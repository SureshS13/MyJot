/*******************************************************/
/* Const & let variable declarations & initializations */
/*******************************************************/

// App version number & cache name used to ensure that when the app is updated, a new cache will be created and the old one will be deleted
// For more info, read the following: https://sqlpey.com/javascript/effective-cache-busting-strategies/#dynamic-cache-busting-via-javascript-execution
const VERSION = "0.1";
const CACHE_NAME = `myjot-${VERSION}`

// Array of static resources needed to enable the PWA offline experience for MyJot
const APP_STATIC_RESOURCES = [
    // Root URL
    "/MyJot/", 

    // Site web manifest file & favicons
    "/MyJot/myjot.json",
    "/MyJot/favicons/apple-touch-icon.png",
    "/MyJot/favicons/favicon-96x96.png",
    "/MyJot/favicons/favicon.ico",
    "/MyJot/favicons/favicon.svg",
    "/MyJot/favicons/web-app-manifest-192x192.png",
    "/MyJot/favicons/web-app-manifest-512x512.png",

    // Site fonts
    "/MyJot/misc/fonts/Inter/Inter-Italic-VariableFont_opsz,wght.ttf",
    "/MyJot/misc/fonts/Inter/Inter-VariableFont_opsz,wght.ttf",
    "/MyJot/misc/fonts/FontAwesome/fa-brands-400.woff2",
    "/MyJot/misc/fonts/FontAwesome/fa-regular-400.woff2",
    "/MyJot/misc/fonts/FontAwesome/fa-solid-900.woff2",
    "/MyJot/misc/fonts/FontAwesome/fa-v4compatibility.woff2",

    // Site HTML pages
    "/MyJot/index.html", 
    "/MyJot/pages/log-meal.html",
    "/MyJot/pages/log-workout.html",
    "/MyJot/pages/log.html",
    "/MyJot/pages/settings.html",
    "/MyJot/pages/stats.html",

    // Vendor CSS stylesheets 
    "/MyJot/css/vendor/bootstrap/bootstrap.min.css",
    "/MyJot/css/vendor/fontawesome/all.min.css",

    // Site CSS stylesheets 
    "/MyJot/css/site/fileLoad/fileLoad.css",
    "/MyJot/css/site/log/log.css",
    "/MyJot/css/site/log-meal/log-meal.css",
    "/MyJot/css/site/log-workout/log-workout.css",
    "/MyJot/css/site/settings/settings.css",
    "/MyJot/css/site/shared/baseStyles.css",
    "/MyJot/css/site/shared/bootstrapOverrides.css",
    "/MyJot/css/site/shared/utilities.css",

    // Vendor JS libraries & scripts
    "/MyJot/js/vendor/bootstrap/bootstrap.bundle.min.js",
    "/MyJot/js/vendor/dexie-js/dexie.min.js",
    "/MyJot/js/vendor/primevue/aura.js",
    "/MyJot/js/vendor/primevue/primevue.min.js",
    "/MyJot/js/vendor/vue-js/vue.global.js",
    "/MyJot/js/site/log-workout/drag-drop-touch.esm.min.js",

    // Site JS scripts
    "/MyJot/js/site/fileLoad/fileLoadScripts.js",
    "/MyJot/js/site/log/logScripts.js",
    "/MyJot/js/site/log-meal/logMealScripts.js",
    "/MyJot/js/site/log-workout/logWorkoutScripts.js",
    "/MyJot/js/site/settings/settingScripts.js",
    "/MyJot/js/site/shared/SharedAppComponents.js",
    "/MyJot/js/site/shared/SharedAppSetup.js",
    "/MyJot/js/site/shared/SharedAppUtilities.js"
];

/**********************************************************/
/* Event listeners, Method Calls, and Other Misc. Actions */
/**********************************************************/

// On install, retrieve and store the files listed in APP_STATIC_RESOURCES into the cache named CACHE_NAME
self.addEventListener("install", function (event) {
    const cacheStaticAssets = async function () {
        const cache = await caches.open(CACHE_NAME);
        return cache.addAll(APP_STATIC_RESOURCES);
    };

    event.waitUntil(cacheStaticAssets());
});

// When a new service worker is activated, delete old/obsolete caches to free up space and ensure users get the latest assets
self.addEventListener("activate", function (event) {
    const deleteOldCaches = async function () {
        // Get the names of the existing named caches
        const names = await caches.keys();

        /// Iterate through the list of cache names
        // Delete all caches except the current one (CACHE_NAME) to clean up old versions
        await Promise.all(
            names.map((name) => {
                if (name !== CACHE_NAME) {
                    return caches.delete(name);
                }
                
                // Implicitly returns undefined
            }),
        );

        // Enable the service worker to set itself as the new controller for our running instance of the MyJot PWA
        await clients.claim();
    };

    event.waitUntil(deleteOldCaches());
});

// Intercept every network request made by the PWA
// MyJot utilizes a Network First approach for serving assets. It checks if the request can be fulfilled from the network first
// If it can't, it tries to retrieve it from the cache
self.addEventListener("fetch", function(event) {
    const fetchWithCacheFallback = async function () {
        try {
            // Attempt to fetch the requested resource from the network
            const response = await fetch(event.request);

            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            return response;
        } catch (error) {
            // This block runs when: 
            // - The user is offline 
            // - The network request fails (DNS, timeout, etc.) 
            // - OR the server returned a non‑OK HTTP status and we threw above

            console.error("Error fetching from network, attempting to locally load site from previously cached assets.");
            
            // Attempt to find a matching cached version of the requested resource
            // If it exists, return it. If not, this resolves to undefined
            return caches.match(event.request);
        }
    }

    // Tell the browser that the service worker will provide the response
    // This is required for offline behavior
    event.respondWith(fetchWithCacheFallback());
});
