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
                inputtedLogName: null,
                selectedDateTime: null,
                inputtedBodyWeight: null,
                selectedUnitType: null,
                weightUnitTypes: ["", "lbs", "kgs"],
                inputtedNotes: null,
                showAddExerciseModal: false,
                selectedExerciseSetup: "new",
                selectedNewExerciseType: "Strength Training",
                exerciseTypes: ["Cardio", "Strength Training", "Flexibility"],
                selectedExerciseRoutine: null,
                existingExerciseRoutineNames: ["My Wed Strength Day", "Sat Cardio"]
            }
        },
        
        methods() {
            // Define component methods here (e.g., edit, delete, format helpers)
        },
        mounted() {
            // Add comment here
            [...document.querySelectorAll('[data-bs-toggle="tooltip"]')].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
        },
        updated() {
            console.log(this.inputtedLogName, this.selectedDateTime, this.inputtedBodyWeight, this.selectedUnitType, this.inputtedNotes, this.selectedExerciseSetup, this.selectedNewExerciseType);
        }
    })
    
    // Configure PrimeVue with the Aura theme preset from PrimeUIX
    app.use(PrimeVue.Config, {
        theme: {
            preset: PrimeUIX.Themes.Aura
        }
    });
    
    // Register PrimeVue Select, InputNumber, and Dialog components globally for use in templates
    app.component('p-select', PrimeVue.Select)
        .component('p-input-number', PrimeVue.InputNumber)
        .component('p-dialog', PrimeVue.Dialog);
    
    // Mount the Vue app to the #app container in the DOM
    app.mount('#app');

    // Remove the loading spinner once the Vue app has finished initializing
    loadingSpinner.remove();

    // Reveal the Vue app container after setup is complete
    vueAppContainer.classList.remove("d-none");
});