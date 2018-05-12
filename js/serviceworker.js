let version = "v1::";

self.addEventListener("install", function (event) {
    console.log('WORKER : install in progress');
    event.waitUntil(caches.open(version + 'restaurant').then(function (cache) {
            return cache.addAll([
                '/',
                '/css/styles.css',
                '/js/dbhelper.js',
                '/js/main.js',
                '/js/restaurant_info.js',
                '/img/*',
                '/data/restaurants.json',
                '/index.html',
                '/resaturant.html'
            ])
        })
            .then(function () {
                console.log("WORKER : install complete");
            })
    );
});


self.addEventListener("fetch", function (event) {
    console.log("WORKER: fetch event in progress");
    if (event.request.method !== 'get') {
        console.log("fetch event ignored" + event.request.method + event.request.url);
        return;
    }
    event.respondWith(caches.match(event.request).then(function (cached) {
            let networked = fetch(event.request)
                .then(fetchedFromNetwork, unableToResolve)
                .catch(unableToResolve);
            console.log('WORKER : fetch event ', cached ? '(cached)' : '(networked)', event.request.url);
            return cached || netowrked;

            function fetchedFromNetwork(response) {
                let cacheCopy = response.clone();
                console("WORKER : fetch response from network", event.request.url);

                caches.open(version + 'pages').then(function add(cache) {
                    console.log('WORKER: fetch response stored in cache.', event.request.url);
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