/*******************************************************/
/* Const & let variable declarations & initializations */
/*******************************************************/
const loadingSpinner = document.querySelector(".loader");
const vueAppContainer = document.querySelector("#app");

/**********************************************************/
/* Event listeners, Method Calls, and Other Misc. Actions */
/**********************************************************/

// Listen for the custom "appsetupcompleted" event to initialize the Log page's Vue app
window.addEventListener("appsetupcompleted", function () {
    // Import Vue's core API methods from the global Vue object
    const { createApp } = Vue

    // Create a new Vue application instance with initial data and lifecycle hooks
    const app = createApp({
        data() {
            return {
                
            }
        },
        methods() {
            // Define component methods here (e.g., edit, delete, format helpers)
        },
        mounted() {
            // Add comment here
            [...document.querySelectorAll('[data-bs-toggle="tooltip"]')].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
        }
    })
    
    // Configure PrimeVue with the Aura theme preset from PrimeUIX
    app.use(PrimeVue.Config, {
        theme: {
            preset: PrimeUIX.Themes.Aura
        }
    });
    
    // Register PrimeVue DataTable and Column components globally for use in templates
    // app.component('p-input-text', PrimeVue.InputText);
    
    // Mount the Vue app to the #app container in the DOM
    app.mount('#app');

    // Remove the loading spinner once the Vue app has finished initializing
    loadingSpinner.remove();

    // Reveal the Vue app container after setup is complete
    vueAppContainer.classList.remove("d-none");
});