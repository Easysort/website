/* Shared service worker for the sorting guides.
 *
 * Two jobs: make the guide installable on Android (Chrome only offers the
 * install prompt to pages with a fetch handler), and keep it usable when the
 * signal drops on a recycling centre. Each site folder has its own three-line
 * `sw.js` that imports this, so the scope stays inside that site.
 *
 * Strategy is network-first: we always try the network so a deploy is picked
 * up immediately, and only fall back to the cache when the request fails.
 */

const CACHE = 'easysort-guide-v3';

/* Relative to the importing sw.js, i.e. the site folder. The map JSON is not
 * listed because its filename differs per site; it gets cached on first load. */
const SHELL = [
    './',
    '../../style2.css',
    '../../core/guide.css',
    '../../core/guide.js',
    '../../logo.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE)
            /* One bad URL must not fail the whole install. */
            .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
            .then(() => self.clients.claim()),
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;
    if (new URL(request.url).origin !== self.location.origin) return;

    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE).then((cache) => cache.put(request, copy));
                }
                return response;
            })
            /* Offline: the version query string may differ from what we cached. */
            .catch(() => caches.match(request, { ignoreSearch: true })
                .then((cached) => cached
                    || (request.mode === 'navigate' ? caches.match('./', { ignoreSearch: true }) : undefined)
                    || Response.error())),
    );
});
