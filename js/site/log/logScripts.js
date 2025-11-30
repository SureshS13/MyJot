/******************/
/* Module Imports */
/******************/
import { parseHTMLToElement } from "/js/site/shared/SharedAppUtilities.js"

/*******************************************************/
/* Const & let variable declarations & initializations */
/*******************************************************/
const vueApp = document.querySelector("#app");

/*********************/
/* Utility Functions */
/*********************/

/**********************************************************/
/* Event listeners, Method Calls, and Other Misc. Actions */
/**********************************************************/

// Listen for the custom "appsetupcompleted" event to initialize the Log page's Vue app
window.addEventListener("appsetupcompleted", function () {
    const { createApp, ref } = Vue

    createApp({
        setup() {
            const message = ref('Testing');
            return {
                message
            };
        }
    }).mount('#app');

    // Make the app visible after the setup pipeline completes
    vueApp.classList.remove("d-none");
});