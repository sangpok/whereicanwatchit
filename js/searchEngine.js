export default class SearchEngine {
    #API_PATH = 'https://api.themoviedb.org/3';
    #API_KEY = 'ed6cc14023a74712f2b2ca3d7695bc00';

    #MEDIA_LIST = [];
    #curMediaList = [];

    #lastKeyword = null;
    #isSearching = false;

    #abortMainController = null;
    #abortSubController = [];

    constructor() {
        this.#initAbortController();
    }

    #initAbortController = () => {
        this.#abortMainController = new AbortController();
        this.#abortSubController = [];
    };

    #makeURL = (des, ...param) => {
        let URL = `${this.#API_PATH}${des}?api_key=${this.#API_KEY}`;
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

    #connectURL = async (url, ...params) => {
        return await (
            await fetch(this.#makeURL(url, ...params), {
                signal: this.#abortMainController.signal,
            })
        ).json();
    };

    #getDetailList = async (fetchSrc) => {
        if (!fetchSrc.length) return;

        let fetchList = fetchSrc.map((item) => {
            let newAbortController = new AbortController();
            this.#abortSubController.push(newAbortController);

            return fetch(
                this.#makeURL(
                    `/${item.media_type}/${item.id}`,
                    'language=ko',
                    'append_to_response=credits,watch/providers'
                ),
                {
                    signal: newAbortController.signal,
                }
            );
        });

        return Promise.all((await Promise.all(fetchList)).map((item) => item.json()));
    };

    #updateMediaList = () => {
        this.#curMediaList.forEach((item) => {
            let isExist = this.#MEDIA_LIST.some((elem) => elem.id === item.id);
            if (!isExist) this.#MEDIA_LIST.push(item);
        });
    };

    #renderDOM = () => {
        // <ul class="related-list">
        //     <li>
        //         <div class="img-wrapper">
        //             <img src="/img/1.jpg" alt="" />
        //         </div>
        //         <div class="overlay-container">
        //             <h2>그 해 우리는</h1>
        //         </div>
        //     </li>
        // </ul>

        const tvResultDiv = document.querySelector('#tv-result');
        const filmResultDiv = document.querySelector('#film-result');

        const fragmentTv = new DocumentFragment();
        const fragmentFilm = new DocumentFragment();

        const newUlTv = document.createElement('ul');
        const newUlFilm = document.createElement('ul');

        newUlTv.classList.add('related-list');
        newUlFilm.classList.add('related-list');

        for (let mediaItem of this.#curMediaList) {
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

        if (this.#curMediaList[0]?.media_type === 'tv') {
            tvResultDiv.style.order = '1';
            filmResultDiv.style.order = '2';
        } else {
            tvResultDiv.style.order = '2';
            filmResultDiv.style.order = '1';
        }

        tvResultDiv.insertBefore(fragmentTv, tvResultDiv.querySelector('button'));
        filmResultDiv.insertBefore(fragmentFilm, filmResultDiv.querySelector('button'));

        let countTv = this.#curMediaList.filter((item) => item.media_type === 'tv').length;
        let countFilm = this.#curMediaList.filter((item) => item.media_type === 'movie').length;

        console.log(countTv, countFilm);

        if (!countTv && countFilm) {
            tvResultDiv.classList.add('hide');
            filmResultDiv.classList.remove('hide');
            document.documentElement.style.setProperty('--item-per-row', '5');
        } else if (countTv && !countFilm) {
            tvResultDiv.classList.remove('hide');
            filmResultDiv.classList.add('hide');
            document.documentElement.style.setProperty('--item-per-row', '5');
        } else if (countTv && countFilm) {
            tvResultDiv.classList.remove('hide');
            filmResultDiv.classList.remove('hide');
            document.documentElement.style.removeProperty('--item-per-row');
        } else if (!countTv && !countFilm) {
            // 둘 다 없음
        }
    };

    searchByQuery = async (search_query) => {
        console.log(this.#lastKeyword, search_query);

        if (this.#lastKeyword === search_query) return;
        if (search_query === '') return;

        this.#isSearching = true;
        this.#lastKeyword = search_query;

        let searchResult = null;

        try {
            searchResult = await this.#connectURL(
                '/search/multi',
                `query=${search_query}`,
                'language=ko',
                'page=1',
                'include_adult=false',
                'region=true',
                'append_to_response=videos,images,watch/providers'
            );
        } catch (e) {
            console.log(`searchResult Error: ${e}`);
            if (e.name === 'AbortError') {
                this.#isSearching = false;
                return;
            }
        } finally {
        }

        console.log(searchResult);

        let { total_results, total_pages } = searchResult;

        if (!total_results) {
            this.#isSearching = false;
            return;
        }

        this.#curMediaList = [];

        searchResult.results.forEach((item) => {
            let existItem = this.#MEDIA_LIST.filter((resultItem) => resultItem.id === item.id);

            if (existItem.length > 0) {
                this.#curMediaList.push(...existItem);
            } else {
                if (item.media_type !== 'person')
                    this.#curMediaList.push({
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

        let needDetailList = [];
        let itemDetailList = [];

        try {
            needDetailList = this.#curMediaList.filter((item) => item.providers === undefined);
            itemDetailList = (await this.#getDetailList(needDetailList)) || [];
        } catch (e) {
            console.log(`getDetailList Error: ${e}`);
            if (e.name === 'AbortError') {
                this.#isSearching = false;
                return;
            }
        } finally {
        }

        for (let response of itemDetailList) {
            let lstIdx = this.#curMediaList.findIndex((item) => item.id === response.id);
            this.#curMediaList[lstIdx].providers =
                response['watch/providers']?.results['KR'] || null;
            this.#curMediaList[lstIdx].credits = response['credits'] || null;
        }

        this.#isSearching = false;

        this.#updateMediaList();
        this.#renderDOM();
    };

    abort = () => {
        this.#abortMainController.abort();

        if (this.#abortSubController.length > 0) {
            this.#abortSubController.forEach((item) => item.abort());
        }

        this.#isSearching = false;
        this.#initAbortController();
        this.#abortLoadImage();
    };

    #abortLoadImage = () => {
        const allImages = document.querySelectorAll('li img');
        allImages.forEach((item) => {
            if (!item.complete) item.setAttribute('src', '');
        });
    };

    get isSearching() {
        return this.#isSearching;
    }
}
