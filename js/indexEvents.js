const API_PATH = 'https://api.themoviedb.org/3';
const API_KEY = 'ed6cc14023a74712f2b2ca3d7695bc00';

const controller = new AbortController();

let isSearching = false;
let RESULT_LIST = [];

const makeURL = (des, ...param) => {
    let URL = `${API_PATH}${des}?api_key=${API_KEY}`;
    if (param)
        URL += param
            .map((item) => {
                return item.indexOf('query') > -1
                    ? '&query=' + encodeURIComponent(item.substring(item.indexOf('=') + 1))
                    : '&' + item;
            })
            .join('');
    return URL;
};

const connectURL = async (des, ...params) => {
    return (
        await fetch(makeURL(des, ...params), {
            signal: controller.signal,
        })
    ).json();
};

const getDetailList = async (fetchSrc) => {
    if (!fetchSrc.length) return;

    let fetchList = fetchSrc.map((item) =>
        fetch(
            makeURL(
                `/${item.media_type}/${item.id}`,
                'language=ko',
                'append_to_response=credits,watch/providers'
            ),
            {
                signal: controller.signal,
            }
        )
    );

    return Promise.all((await Promise.all(fetchList)).map((item) => item.json()));
};

const searchMovie = async (movie_name) => {
    if (movie_name === '') return null;

    const searchResult = await connectURL(
        '/search/multi',
        `query=${movie_name}`,
        'language=ko',
        'page=1',
        'include_adult=false',
        'region=true',
        'append_to_response=videos,images,watch/providers'
    );

    let curResultList = [];
    let { total_results, total_pages } = searchResult;

    if (!total_results) return;

    searchResult.results.forEach((item) => {
        let existItem = RESULT_LIST.filter((resultItem) => resultItem.id === item.id);

        if (existItem.length > 0) {
            curResultList.push(...existItem);
        } else {
            if (item.media_type !== 'person')
                curResultList.push({
                    id: item.id,
                    media_type: item.media_type,
                    name: item.name || item.title,
                    release_date: item.release_date || item.first_air_date,
                    poster_path: item.poster_path,
                    providers: undefined,
                    credits: undefined,
                });
        }
    });

    let needDetailList = curResultList.filter((item) => item.providers === undefined);
    let itemDetailList = (await getDetailList(needDetailList)) || [];

    for (let response of itemDetailList) {
        let lstIdx = curResultList.findIndex((item) => item.id === response.id);
        curResultList[lstIdx].providers = response['watch/providers']?.results['KR'] || null;
        curResultList[lstIdx].credits = response['credits'] || null;
    }

    const tvResultDiv = document.querySelector('#tv-result');
    const filmResultDiv = document.querySelector('#film-result');

    const fragmentTv = new DocumentFragment();
    const fragmentFilm = new DocumentFragment();

    const newUlTv = document.createElement('ul');
    const newUlFilm = document.createElement('ul');

    newUlTv.classList.add('related-list');
    newUlFilm.classList.add('related-list');

    for (let movieItem of curResultList) {
        const newLi = document.createElement('li');
        const newDiv = document.createElement('div');
        const newDiv2 = document.createElement('div');
        const newImg = document.createElement('img');
        const newH2 = document.createElement('h2');

        const newDivProvider = document.createElement('div');
        newDivProvider.classList.add('providers');

        if (movieItem.providers?.flatrate !== undefined) {
            for (let provider of movieItem.providers?.flatrate) {
                let newdivzz = document.createElement('div');
                newdivzz.classList.add('img-wrapper');

                let newImage = document.createElement('img');
                newImage.src = 'https://image.tmdb.org/t/p/w66_and_h66_face' + provider.logo_path;

                newdivzz.appendChild(newImage);
                newDivProvider.appendChild(newdivzz);
            }
        }

        newImg.src = movieItem.poster_path
            ? 'https://image.tmdb.org/t/p/w500' + movieItem.poster_path
            : '';

        newImg.setAttribute('loading', 'lazy');
        newDiv.classList.add('img-wrapper');

        if (movieItem.poster_path !== null) newDiv.appendChild(newImg);

        newH2.innerText = movieItem.name;
        newDiv2.classList.add('overlay-container');
        newDiv2.appendChild(newH2);

        newLi.append(newDiv, newDiv2, newDivProvider);

        if (movieItem.media_type === 'tv') {
            newUlTv.appendChild(newLi);
        } else {
            newUlFilm.appendChild(newLi);
        }
    }

    fragmentTv.appendChild(newUlTv);
    fragmentFilm.appendChild(newUlFilm);

    let ulNodeTv = tvResultDiv.querySelector('ul');
    let ulNodeFilm = filmResultDiv.querySelector('ul');

    if (ulNodeTv !== null) {
        ulNodeTv.remove();
    }

    if (ulNodeFilm !== null) {
        ulNodeFilm.remove();
    }

    if (curResultList[0].media_type === 'tv') {
        tvResultDiv.style.order = '1';
        filmResultDiv.style.order = '2';
    } else {
        tvResultDiv.style.order = '2';
        filmResultDiv.style.order = '1';
    }

    tvResultDiv.insertBefore(fragmentTv, tvResultDiv.querySelector('button'));
    filmResultDiv.insertBefore(fragmentFilm, filmResultDiv.querySelector('button'));

    curResultList.forEach((item) => {
        let isExist = RESULT_LIST.some((elem) => elem.id === item.id);
        if (!isExist) RESULT_LIST.push(item);
    });

    isSearching = false;
};

const searchBox = document.querySelector('.search-box input');

searchBox.addEventListener('input', (event) => {
    searchMovie(searchBox.value);
});

// document.querySelector('#tv-result').addEventListener('load', (event) => {
//     console.log('tvResultDiv 로드 완료');
// });

// document.querySelector('#film-result').addEventListener('load', (event) => {
//     console.log('filmResultDiv 로드 완료');
// });
