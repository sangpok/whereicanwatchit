export default class SearchEngine {
    #API_PATH = 'https://api.themoviedb.org/3';
    #API_KEY = 'ed6cc14023a74712f2b2ca3d7695bc00';

    #MEDIA_LIST = [];
    #curMediaList = [];

    #isSearching = false;

    #makeURL = (des, ...param) => {
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

    #connectURL = async (url) => {
        return await (await fetch(makeURL(url))).json();
    };

    #getDetailList = async (fetchSrc) => {
        if (!fetchSrc.length) return;

        let fetchList = fetchSrc.map((item) =>
            fetch(
                makeURL(
                    `/${item.media_type}/${item.id}`,
                    'language=ko',
                    'append_to_response=credits,watch/providers'
                )
            )
        );

        return Promise.all((await Promise.all(fetchList)).map((item) => item.json()));
    };

    #updateMediaList = () => {
        curMediaList.forEach((item) => {
            let isExist = MEDIA_LIST.some((elem) => elem.id === item.id);
            if (!isExist) MEDIA_LIST.push(item);
        });
    };

    searchByQuery = async (search_query) => {
        if (search_query === '') return null;

        isSearching = true;

        const searchResult = await connectURL(
            '/search/multi',
            `query=${search_query}`,
            'language=ko',
            'page=1',
            'include_adult=false',
            'region=true',
            'append_to_response=videos,images,watch/providers'
        );

        let { total_results, total_pages } = searchResult;

        if (!total_results) {
            isSearching = false;
            return;
        }

        curMediaList = [];

        searchResult.results.forEach((item) => {
            let existItem = MEDIA_LIST.filter((resultItem) => resultItem.id === item.id);

            if (existItem.length > 0) {
                curMediaList.push(...existItem);
            } else {
                if (item.media_type !== 'person')
                    curMediaList.push({
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

        let needDetailList = curMediaList.filter((item) => item.providers === undefined);
        let itemDetailList = (await getDetailList(needDetailList)) || [];

        for (let response of itemDetailList) {
            let lstIdx = curMediaList.findIndex((item) => item.id === response.id);
            curMediaList[lstIdx].providers = response['watch/providers']?.results['KR'] || null;
            curMediaList[lstIdx].credits = response['credits'] || null;
        }

        isSearching = false;

        updateMediaList();
        renderDOM();
    };

    renderDOM = () => {
        const tvResultDiv = document.querySelector('#tv-result');
        const filmResultDiv = document.querySelector('#film-result');

        const fragmentTv = new DocumentFragment();
        const fragmentFilm = new DocumentFragment();

        const newUlTv = document.createElement('ul');
        const newUlFilm = document.createElement('ul');

        newUlTv.classList.add('related-list');
        newUlFilm.classList.add('related-list');

        for (let mediaItem of curMediaList) {
            const newLi = document.createElement('li');
            const newDiv = document.createElement('div');
            const newDiv2 = document.createElement('div');
            const newImg = document.createElement('img');
            const newH2 = document.createElement('h2');

            const newDivProvider = document.createElement('div');
            newDivProvider.classList.add('providers');

            if (mediaItem.providers?.flatrate !== undefined) {
                for (let provider of mediaItem.providers?.flatrate) {
                    let newdivzz = document.createElement('div');
                    newdivzz.classList.add('img-wrapper');

                    let newImage = document.createElement('img');
                    newImage.src =
                        'https://image.tmdb.org/t/p/w66_and_h66_face' + provider.logo_path;

                    newdivzz.appendChild(newImage);
                    newDivProvider.appendChild(newdivzz);
                }
            }

            newImg.src = mediaItem.poster_path
                ? 'https://image.tmdb.org/t/p/w500' + mediaItem.poster_path
                : '';

            newImg.setAttribute('loading', 'lazy');
            newDiv.classList.add('img-wrapper');

            if (mediaItem.poster_path !== null) newDiv.appendChild(newImg);

            newH2.innerText = mediaItem.name;
            newDiv2.classList.add('overlay-container');
            newDiv2.appendChild(newH2);

            newLi.append(newDiv, newDiv2, newDivProvider);

            if (mediaItem.media_type === 'tv') {
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

        if (curMediaList[0].media_type === 'tv') {
            tvResultDiv.style.order = '1';
            filmResultDiv.style.order = '2';
        } else {
            tvResultDiv.style.order = '2';
            filmResultDiv.style.order = '1';
        }

        tvResultDiv.insertBefore(fragmentTv, tvResultDiv.querySelector('button'));
        filmResultDiv.insertBefore(fragmentFilm, filmResultDiv.querySelector('button'));
    };
}
