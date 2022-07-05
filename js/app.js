import Router from './routers.js';

const appDiv = document.querySelector('#app');
const myRouter = new Router(appDiv);

console.log(document.documentElement);
const allLinkBtn = document.querySelectorAll('[data-link]');
console.log(allLinkBtn);
allLinkBtn.forEach((item) => {
    item.addEventListener('click', (event) => {
        const pathName = evt.target.getAttribute('[data-link]');
        myRouter.routerPush(pathName, appDiv);
    });
});

window.addEventListener('load', (event) => {});
