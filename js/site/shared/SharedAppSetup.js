/******************/
/* Module Imports */
/******************/
import { createHTMLElement } from "/js/site/shared/SharedAppUtilities.js"

/*******************************************************/
/* Const & let variable declarations * initializations */
/*******************************************************/
const pageTitle = document.head.querySelector("title").textContent;
const vendorCSSImportURlsObj = {
    bootstrap: "css/vendor/bootstrap/bootstrap.min.css"
};
const sharedSiteCSSImportUrlsObj = {
    baseStyles: "css/site/shared/baseStyles.css",
    bootstrapOverrides: "css/site/shared/bootstrapOverrides.css",
    utilities: "css/site/shared/utilities.css"
};
const vendorJSImportURLsObj = {
    vueJS: "js/vendor/vue-js/vue.global.js",
    primeVue: "js/vendor/primevue/primevue.min.js",
    aura: "js/vendor/primevue/aura.js",
    bootstrap: "js/vendor/bootstrap/bootstrap.bundle.min.js",
    handleBars: "js/vendor/handlebars/handlebars.js",
    fontAwesome: "js/vendor/fontawesome/fontawesome.js"
};

/*********************/
/* Utility Functions */
/*********************/

// Add JSDoc Here
function createLinkTag(hrefValue) {
    return createHTMLElement({
        type: "link",
        attributes: [
            {
                name: "rel",
                value: "stylesheet"
            },
            {
                name: "href",
                value: hrefValue
            }
        ]
    });
}

// Add JSDoc Here
function createScriptTag(srcValue, isDeferred = false) {
    const scriptTag = createHTMLElement({
        type: "script",
        attributes: [
            {
                name: "src",
                value: srcValue
            }
        ]
    });

    if (isDeferred) {
        scriptTag.setAttribute("defer", "");
    }

    return scriptTag;
}

/**********************************************************/
/* Event listeners, Method Calls, and Other Misc. Actions */
/**********************************************************/

// Add all vendor CSS stylesheets
for (const cssImport of Object.keys(vendorCSSImportURlsObj)) {
    document.head.appendChild(createLinkTag(vendorCSSImportURlsObj[cssImport]));
}

// Add all shared site styles and utilies 
for (const cssImport of Object.keys(sharedSiteCSSImportUrlsObj)) {
    document.head.appendChild(createLinkTag(sharedSiteCSSImportUrlsObj[cssImport]));
}

// Dynamically locate and add the necessary site stylesheets for the current page, based on the page name
document.head.appendChild(createLinkTag(`css/site/${pageTitle.toLocaleLowerCase()}/${pageTitle.toLocaleLowerCase()}.css`));

// Add all vendor JS scripts
for (const jsImport of Object.keys(vendorJSImportURLsObj)) {
    document.head.appendChild(createScriptTag(vendorJSImportURLsObj[jsImport]));
}

// Dynamically locate and add the necessary JS scripts for the current page, based on the page name
document.head.appendChild(createScriptTag(`js/site/${pageTitle.toLocaleLowerCase()}/${pageTitle.toLocaleLowerCase()}Scripts.js`, true));


