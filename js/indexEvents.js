const API_PATH = 'https://api.themoviedb.org/3';
const API_KEY = 'ed6cc14023a74712f2b2ca3d7695bc00';

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

const searchMovie = async (movie_name) => {
    let RESULT_LIST = [];

    const movieListResultProm = await fetch(
        makeURL(
            '/search/multi',
            `query=${movie_name}`,
            'language=ko',
            'page=1',
            'include_adult=true',
            'region=true',
            'append_to_response=videos,images,watch/providers'
        )
    );
    const movieList = await movieListResultProm.json();
    const result1 = [...movieList.results];

    result1.forEach((item) => {
        RESULT_LIST.push({
            id: item.id,
            media_type: item.media_type,
            name: item.name || item.title,
            release_date: item.release_date || item.first_air_date,
            poster_path: item.poster_path,
        });
    });

    console.log(result1);

    const responsePromises = await Promise.all(
        result1.map((item) =>
            fetch(
                item.media_type === 'tv'
                    ? makeURL(
                          `/tv/${item.id}`,
                          'language=ko',
                          'append_to_response=credits,watch/providers'
                      )
                    : makeURL(
                          `/movie/${item.id}`,
                          'language=ko',
                          'append_to_response=credits,watch/providers'
                      )
            )
        )
    );

    const jsonPromises = await Promise.all(responsePromises.map((item) => item.json()));

    for (let response of jsonPromises) {
        let lstIdx = RESULT_LIST.findIndex((item) => item.id === response.id);
        RESULT_LIST[lstIdx].providers = response['watch/providers']?.results['KR'] || null;
        RESULT_LIST[lstIdx].credits = response['credits'] || null;
    }

    const tvResultDiv = document.querySelector('#tv-result ul');
    const filmResultDiv = document.querySelector('#film-result ul');

    if (tvResultDiv.childElementCount) {
        while (tvResultDiv.firstChild) {
            tvResultDiv.removeChild(tvResultDiv.lastChild);
        }
    }

    if (filmResultDiv.childElementCount) {
        while (filmResultDiv.firstChild) {
            filmResultDiv.removeChild(filmResultDiv.lastChild);
        }
    }
    // filmResultDiv.innerHTML = '';

    for (let movieItem of RESULT_LIST) {
        const newLi = document.createElement('li');
        const newDiv = document.createElement('div');
        const newDiv2 = document.createElement('div');
        const newImg = document.createElement('img');
        const newH2 = document.createElement('h2');

        const newDivProvider = document.createElement('div');
        newDivProvider.classList.add('providers');

        console.log(movieItem.providers?.flatrate);

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

        console.log(movieItem.poster_path);
        newImg.src = movieItem.poster_path
            ? 'https://image.tmdb.org/t/p/w500' + movieItem.poster_path
            : '';

        newImg.setAttribute('loading', 'lazy');
        newDiv.classList.add('img-wrapper');
        if (movieItem.poster_path !== null) newDiv.appendChild(newImg);

        newH2.innerText = movieItem.name;
        newDiv2.classList.add('overlay-container');
        newDiv2.appendChild(newH2);

        newLi.appendChild(newDiv);
        newLi.appendChild(newDiv2);
        newLi.appendChild(newDivProvider);

        if (movieItem.media_type === 'tv') {
            tvResultDiv.appendChild(newLi);
        } else {
            filmResultDiv.appendChild(newLi);
        }

        // const searchResult = document.querySelector('#search-result');
        // const newP = document.createElement('p');
        // const newImage = document.createElement('img');
        // newP.innerText = `${movieItem.name} / ${movieItem.id}`;
        // newImage.setAttribute('loading', 'lazy');
        // newImage.src = movieItem.poster_path
        //     ? 'https://www.themoviedb.org/t/p/w94_and_h141_bestv2' + movieItem.poster_path
        //     : '';
        // searchResult.appendChild(newP);
        // searchResult.appendChild(newImage);
    }

    console.log(RESULT_LIST);
};

const searchBox = document.querySelector('.search-box input');

searchBox.addEventListener('input', (event) => {
    searchMovie(searchBox.value);
});
