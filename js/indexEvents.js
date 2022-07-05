import SearchEngine from './searchEngine.js';
const mySE = new SearchEngine();

const searchBox = document.querySelector('.search-box input');

searchBox.addEventListener('input', (event) => {
    if (mySE.isSearching) mySE.abort();
    mySE.searchByQuery(searchBox.value.trim());
});
