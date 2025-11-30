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
                // Temporary hardcoded list of products for testing; replace with real data once integrations are complete
                products: [
                    { 
                        "category": "Exercise",
                        "name": "Legs day",
                        "datetime": "2024-03-10 02:30",
                        "editlog": "https://vuejs.org/",
                        "deletelog": "https://vuejs.org/"
                    },
                    { 
                        "category": "Meal",
                        "name": "Taco Bell",
                        "datetime": "2024-03-9 02:30",
                        "editlog": "https://vuejs.org/",
                        "deletelog": "https://vuejs.org/"
                    }
                ]
            }
        },
        methods() {
            // Define component methods here (e.g., edit, delete, format helpers)
        },
        mounted() {
            console.log(this.products);
        }
    })
    
    // Configure PrimeVue with the Aura theme preset from PrimeUIX
    app.use(PrimeVue.Config, {
        theme: {
            preset: PrimeUIX.Themes.Aura
        }
    });

    // Register PrimeVue DataTable and Column components globally for use in templates
    app.component('p-datatable', PrimeVue.DataTable)
        .component('p-column', PrimeVue.Column);
    
    // Mount the Vue app to the #app container in the DOM
    app.mount('#app');

    // Remove the loading spinner once the Vue app has finished initializing
    loadingSpinner.remove();

    // Reveal the Vue app container after setup is complete
    vueAppContainer.classList.remove("d-none");
});