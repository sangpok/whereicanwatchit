// import * as indexTemplate from '/view/index.html';

export default class Router {
    routes = {
        '/': indexTemplate,
        '/search': searchTemplate,
        '/search/tv': searchTvTemplate,
        '/search/film': searchFilmTemplate,
        '/detail': detailTemplate,
    };

    getTemplate = async (filePath) => {
        let fetchPromise = await fetch(filePath);
        let resonse = await fetchPromise.text();
        return resonse.substring(resonse.indexOf('<body>') + 6, resonse.indexOf('</body>'));
    };

    initTemplate = async () => {
        const indexTemplate = await getTemplate('/view/index.html');
        const searchTemplate = await getTemplate('/view/search.html');
        const searchTvTemplate = await getTemplate('/view/search/tv.html');
        const searchFilmTemplate = await getTemplate('/view/search/film.html');
        const detailTemplate = await getTemplate('/view/detail.html');
    };

    initRoute = () => {};
}
