let version = "v1::";
let CACHE_FILES = [
    '/',
    '/index.html',
    '/restaurant.html',
    '/css/styles.css',
    '/js/dbhelper.js',
    '/js/main.js',
    '/data/restaurants.json',
    '/js/restaurant_info.js',
    '/img/1.jpg',
    '/img/2.jpg',
    '/img/3.jpg',
    '/img/4.jpg',
    '/img/5.jpg',
    '/img/6.jpg',
    '/img/7.jpg',
    '/img/8.jpg',
    '/img/9.jpg',
    '/img/10.jpg'
];

self.addEventListener('install', function (event) {
    console.log('WORKER : install in progress');
    event.waitUntil(
        caches.open(version + 'restaurant').then(function (cache) {
            return cache.addAll(CACHE_FILES);
        })
            .then(function () {
                console.log("WORKER : install complete");
            })
    );
});


self.addEventListener('fetch', function (event) {
    console.log("WORKER: fetch event in progress");
    if (event.request.method !== 'GET') {
        console.log("fetch event ignored" + event.request.method + event.request.url);
        return;
    }
    event.respondWith(caches.match(event.request).then(function (cached) {
            let networked = fetch(event.request)
                .then(fetchedFromNetwork, unableToResolve)
                .catch(unableToResolve);
            console.log('WORKER : fetch event ', cached ? '(cached)' : '(networked)', event.request.url);
            return cached || networked;

            function fetchedFromNetwork(response) {
                let cacheCopy = response.clone();
                console.log("WORKER : fetch response from network", event.request.url);

                caches.open(version + 'restaurant').then(function add(cache) {
                    cache.put(event.request, cacheCopy)
                    .then(function () {
                        console.log('WORKER: fetch response stored in cache.', event.request.url);
                    })
                });
                return response;
            }

            function unableToResolve() {
                console.log('WORKER: fetch request failed in both network and cache.');
                return new Response('<h1>Service unavailable</h1>', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: new Headers({
                        'Content-Type': 'text/html'
                    })
                });
            }
        })
    );
});


self.addEventListener('activate', function (event) {
    console.log('WORKER: activate event in response');
    event.waitUntil(caches.keys().then(function (keys) {
            return Promise.all(
                keys
                    .filter(function (key) {
                        return !key.startsWith(version);
                    })
                    .map(function (key) {
                        return caches.delete(key);
                    })
            );
        })
            .then(function () {
                console.log("WORKER : activate complete");
            })
    );
});