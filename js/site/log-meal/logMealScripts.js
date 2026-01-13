/*******************************************************/
/* Const & let variable declarations & initializations */
/*******************************************************/
const loadingSpinner = document.querySelector(".loader");
const logMealPageHeader = document.querySelector("header");
const validationAlertComponent = logMealPageHeader.querySelector("#log-meal-validation-errors-alert");
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
                isAddCustomMealMode: false,
                isEditCustomMealMode: false,
                isEditMealMode: false,
                ctaButtonText: "Add Meal Entry",
                inputtedLogName: null,
                selectedDateTime: null,
                inputtedNotes: null,
                inputtedMealName: null,
                selectedMealType: null,
                mealTypes: ["Breakfast", "Lunch", "Dinner", "Snack", "Misc"],
                inputtedCalories: null,
                inputtedProtein: null,
                inputtedCarbs: null,
                inputtedFats: null
            }
        },
        methods: {
            /**
            * Attempts to submit the meal entry. 
            * Validates all fields, updates UI spacing and hides the validation alert on success. 
            * If validation fails, displays the error message and adjusts the layout accordingly.
            */
            addMealEntry: function() {
                try {
                    this.validateMealEntry();

                    // Adjust header spacing and hide validation alert after successful validation
                    logMealPageHeader.classList.remove("mb-4");
                    logMealPageHeader.classList.add("mb-5");
                    validationAlertComponent.classList.add("d-none");
                } catch (error) {
                    // Display the validation error message to the user
                    validationAlertComponent.textContent = error.message;

                    // Restore compact header spacing and show the validation alert
                    logMealPageHeader.classList.remove("mb-5");
                    logMealPageHeader.classList.add("mb-4");
                    validationAlertComponent.classList.remove("d-none");

                    // Ensure the alert is visible by scrolling it into view
                    validationAlertComponent.scrollIntoView(false);
                }
            },
            /**
            * Validates the meal entry fields before submission.
            * Ensures that the log name, date/time, meal name, and meal type are provided.
            * @throws {Error} If any required workout field is missing or invalid.
            */
            validateMealEntry: function() {
                if (!this.inputtedLogName) {
                    throw new Error("A valid log name is required.");
                }

                if (!this.selectedDateTime) {
                    throw new Error("A valid date & time is required.");
                }

                if (!this.inputtedMealName) {
                    throw new Error("A valid meal name is required.");
                }

                if (!this.selectedMealType) {
                    throw new Error("A valid meal type is required.");
                }
            }
        },
        beforeMount() {
            // Add comment here
            const queryParams = new URLSearchParams(window.location.search);  
            
            console.warn("TODO - Need to add additional validation here to ensure that the workout/routine name actually exists as a valid routine stored in the IndexDB.");

            // Add comment here
            const isValidAddCustomMealParams = queryParams.has("addCustomMeal", true);
            const isValidEditCustomMealParams = (queryParams.has("editCustomMeal", true) 
                && queryParams.has("customMealName") 
                && queryParams.get("customMealName"));
            const isValidEditMealEntryParams = (queryParams.has("editMeal", true) 
                && queryParams.has("mealName") 
                && queryParams.get("mealName")
                && queryParams.has("mealDateTime") 
                && queryParams.get("mealDateTime"));
    
            // Add comment here
            if (isValidAddCustomMealParams) {
                this.isAddRoutineMode = true;
                this.ctaButtonText = "Add Custom Meal";

                document.querySelector("#log-meal-page-title").textContent = "Add Custom Meal";
            } else if (isValidEditCustomMealParams) {
                this.isEditRoutineMode = true;
                this.ctaButtonText = "Save Changes";

                // hardcoded for now
                console.warn("TODO - Need to add additional functionality here to pull a valid routine and add it to the workout store stored in the IndexDB.");
                this.inputtedLogName = "HI";

                document.querySelector("#log-meal-page-title").textContent = "Edit Custom Meal";
            } else if (isValidEditMealEntryParams) {
                this.isEditWorkoutMode = true;
                this.ctaButtonText = "Save Changes";

                // hardcoded for now
                console.warn("TODO - Need to add additional functionality here to pull a valid workout entry and add it to the workout store stored in the IndexDB.");
                this.inputtedLogName = "BYE";

                document.querySelector("#log-meal-page-title").textContent = "Edit Meal Log";
            }
        },
        mounted() {
            // Initialize all Bootstrap tooltips found in the DOM for elements using the data-bs-toggle="tooltip" attribute
            [...document.querySelectorAll('[data-bs-toggle="tooltip"]')].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
        }
    })
    
    // Configure PrimeVue with the Aura theme preset from PrimeUIX
    app.use(PrimeVue.Config, {
        theme: {
            preset: PrimeUIX.Themes.Aura
        }
    });
    
    // Register PrimeVue Select and InputNumber components globally for use in templates
    app.component('p-select', PrimeVue.Select)
        .component('p-input-number', PrimeVue.InputNumber);
    
    // Mount the Vue app to the #app container in the DOM
    app.mount('#app');

    // Remove the loading spinner once the Vue app has finished initializing
    loadingSpinner.remove();

    // Reveal the Vue app container after setup is complete
    vueAppContainer.classList.remove("d-none");
});