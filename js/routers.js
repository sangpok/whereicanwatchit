// import * as indexTemplate from '/view/index.html';

export default class Router {
    #indexTemplate = null;
    #searchTemplate = null;
    #searchTvTemplate = null;
    #searchFilmTemplate = null;
    #detailTemplate = null;

    routes = null;

    constructor(el) {
        this.initRoute(el);
        window.addEventListener('popstate', this);
    }

    #getTemplate = async (filePath) => {
        let fetchPromise = await fetch(filePath);
        let resonse = await fetchPromise.text();
        return resonse.substring(resonse.indexOf('<body>') + 6, resonse.indexOf('</body>'));
    };

    initTemplate = async () => {
        this.#indexTemplate = await this.#getTemplate('/view/index.html');
        this.#searchTemplate = await this.#getTemplate('/view/search.html');
        this.#searchTvTemplate = await this.#getTemplate('/view/search/tv.html');
        this.#searchFilmTemplate = await this.#getTemplate('/view/search/film.html');
        this.#detailTemplate = await this.#getTemplate('/view/detail.html');

        return {
            '/': this.#indexTemplate,
            '/search': this.#searchTemplate,
            '/search/tv': this.#searchTvTemplate,
            '/search/film': this.#searchFilmTemplate,
            '/detail': this.#detailTemplate,
        };
    };

    initRoute = async (el) => {
        this.routes = await this.initTemplate();
        this.renderDOM(el, this.routes['/']);
    };

    routerPush(pathName, el) {
        window.history.pushState({}, pathName, window.location.origin + pathName);
        this.renderDOM(el, this.routes[pathName]);
    }

    renderDOM = (el, route) => {
        el.innerHTML = route;
    };

    handleEvent = (event) => {
        console.log(event);
    };
}
