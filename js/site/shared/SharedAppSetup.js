/******************/
/* Module Imports */
/******************/
import { createHTMLElement } from "/MyJot/js/site/shared/SharedAppUtilities.js";
import { createNavbar } from "/MyJot/js/site/shared/SharedAppComponents.js";

/*******************************************************/
/* Const & let variable declarations & initializations */
/*******************************************************/

// Cache-busting version number appended to asset URLs to force browsers to reload updated files
// For more info, read the following: https://sqlpey.com/javascript/effective-cache-busting-strategies/#dynamic-cache-busting-via-javascript-execution
const ASSET_VERSION = 1;

const customStylesheetsMetaTag = document.querySelector("[data-custom-stylesheets]");
const customScriptsMetaTag = document.querySelector("[data-custom-scripts]");
const customScriptModulesMetaTag = document.querySelector("[data-custom-script-modules]");
const customSharedComponentsMetaTag = document.querySelector("[data-custom-shared-components]");
const pageName = document.querySelector("[data-nav-label-override]")?.getAttribute("data-nav-label-override") ?? document.querySelector("title").textContent;
const vendorCSSImportURlsObj = {
    bootstrap: "/MyJot/css/vendor/bootstrap/bootstrap.min.css"
};
const sharedSiteCSSImportUrlsObj = {
    baseStyles: "/MyJot/css/site/shared/baseStyles.css",
    bootstrapOverrides: "/MyJot/css/site/shared/bootstrapOverrides.css",
    utilities: "/MyJot/css/site/shared/utilities.css"
};
const vendorJSImportURLsObj = {
    vueJS: "/MyJot/js/vendor/vue-js/vue.global.js",
    primeVue: "/MyJot/js/vendor/primevue/primevue.min.js",
    aura: "/MyJot/js/vendor/primevue/aura.js",
    dexieJS: "/MyJot/js/vendor/dexie-js/dexie.min.js",
    bootstrap: "/MyJot/js/vendor/bootstrap/bootstrap.bundle.min.js",
    fontAwesome: "/MyJot/js/vendor/fontawesome/fontawesome.js"
};

/*********************/
/* Utility Functions */
/*********************/

/**
* Creates a `<link>` HTML element for including a stylesheet.
* @param {string} hrefValue The URL of the stylesheet to be linked.
* @returns {HTMLElement} The generated `<link>` element with `rel="stylesheet"` and the specified `href`.
*/
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
                value: `${hrefValue}?v=${ASSET_VERSION}`
            }
        ]
    });
}

/**
* Creates a `<script>` HTML element for including a JavaScript file.
* @param {string} srcValue The URL of the JavaScript file to be loaded.
* @param {boolean} [isDeferred=false] Whether to add the `defer` attribute so the script executes after parsing.
* @param {boolean} [isModule=false] Whether to set the `type="module"` attribute so the script is treated as an ES module.
* @returns {HTMLElement} The generated `<script>` element with the specified `src` and optional `defer` attribute.
*/
function createScriptTag(srcValue, isDeferred = false, isModule = false) {
    const scriptTag = createHTMLElement({
        type: "script",
        attributes: [
            {
                name: "src",
                value: `${srcValue}?v=${ASSET_VERSION}`
            }
        ]
    });

    if (isDeferred) {
        scriptTag.setAttribute("defer", "");
    }

    if (isModule) {
        scriptTag.setAttribute("type", "module");
    }

    return scriptTag;
}

/**********************************************************/
/* Event listeners, Method Calls, and Other Misc. Actions */
/**********************************************************/

// Load all vendor CSS stylesheets
for (const cssImport of Object.keys(vendorCSSImportURlsObj)) {
    document.head.appendChild(createLinkTag(vendorCSSImportURlsObj[cssImport]));
}

// Load all shared site CSS stylesheets
for (const cssImport of Object.keys(sharedSiteCSSImportUrlsObj)) {
    document.head.appendChild(createLinkTag(sharedSiteCSSImportUrlsObj[cssImport]));
}

// Load any page-specific CSS stylesheets defined in the 'data-custom-stylesheets' meta attribute
if (customStylesheetsMetaTag?.getAttribute("data-custom-stylesheets")) {
    const stylesheetNames = customStylesheetsMetaTag.getAttribute("data-custom-stylesheets").split(",");
    
    for (const stylesheet of stylesheetNames) {
        document.head.appendChild(createLinkTag(stylesheet));
    }
}

// Load all vendor JS scripts
for (const jsImport of Object.keys(vendorJSImportURLsObj)) {
    document.head.appendChild(createScriptTag(vendorJSImportURLsObj[jsImport]));
}

// Load any page-specific JS scripts (deferred) defined in the 'data-custom-scripts' meta attribute
if (customScriptsMetaTag?.getAttribute("data-custom-scripts")) {
    const scriptNames = customScriptsMetaTag.getAttribute("data-custom-scripts").split(",");
    
    for (const scriptName of scriptNames) {
        document.head.appendChild(createScriptTag(scriptName, true));
    }
}

// Load any page-specific JS script modules (deferred) defined in the optional 'data-custom-script-modules' meta attribute
if (customScriptModulesMetaTag?.getAttribute("data-custom-script-modules")) {
    const scriptModuleNames = customScriptModulesMetaTag.getAttribute("data-custom-script-modules").split(",");
    
    for (const scriptModuleName of scriptModuleNames) {
        document.head.appendChild(createScriptTag(scriptModuleName, true, true));
    } 
}

// Load and append any shared components defined in the optional "data-custom-shared-components" meta attribute
if (customSharedComponentsMetaTag?.getAttribute("data-custom-shared-components")) {
    const componentNames = customSharedComponentsMetaTag.getAttribute("data-custom-shared-components").split(",");

    for (const componentName of componentNames) {
        let component;
        
        switch (componentName.toLowerCase()) {
            case "navbar":
                component = createNavbar(pageName);
                document.body.prepend(component);
                break;

            default:
                throw new Error(`The component name "${componentName}" does not match any recognized components and is invalid.`);
        }
    }
}

// Attach a global utility method to the window object that returns the Dexie.js database schema for MyJotDB, used in any page-specific JS scripts
window.getMyJotDBSchemaObj = function() {
    return {
            user: '++id, userName',
            exerciseLog: '++id, logName, dateTime, bodyWeight, weightUnitType, logNotes, *exercises',
            mealLog: '++id, logName, dateTime, logNotes, mealName, mealType, calories, protein, carbs, fats',
            exerciseRoutines: '++id, logName, bodyWeight, weightUnitType, logNotes, *exercises',
            customMeals: '++id, logName, logNotes, mealName, mealType, calories, protein, carbs, fats',
    }
};

// Dispatch a custom event after the page has fully loaded to signal app setup completion
window.addEventListener("load", function () {
    const event = new CustomEvent("appsetupcompleted");
    window.dispatchEvent(event);
});

