self.addEventListener('install', function(event){
    // caching all static files
    event.waitUntil(
        caches.open('static').then(function(cache){
            return cache.addAll([
                // lib
                '/axios.min.js',
                '/vue.min.js',
                '/lodash.min.js',
                '/mousetrap.min.js',
                'de.svg',
                'en.svg',
                'fr.svg',
                'es.svg',
                'pl.svg',
                'it.svg',
                'ru.svg',
                'se.svg'
            ]);
        })
    );
});

self.addEventListener('fetch', function(event){
    event.respondWith(
        caches.match(event.request).then(function(response){
            return response || fetch(event.request);
        })
    );    
});