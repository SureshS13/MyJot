/*******************************************************/
/* Const & let variable declarations & initializations */
/*******************************************************/
const loadingSpinner = document.querySelector(".loader");
const logMealPageHeader = document.querySelector("header");
const backButton = logMealPageHeader.querySelector("a");
const validationAlertComponent = logMealPageHeader.querySelector("#log-meal-validation-errors-alert");
const vueAppContainer = document.querySelector("#app");
const queryParams = new URLSearchParams(window.location.search);  

let myJotDB;

/**********************************************************/
/* Event listeners, Method Calls, and Other Misc. Actions */
/**********************************************************/

// Listen for the custom "appsetupcompleted" event to initialize the Log page's Vue app
window.addEventListener("appsetupcompleted", async function () {
    // Validate query parameters for pulling the necessary data and configuring add/edit modes in the Vue app below
    const isValidAddCustomMealParams = queryParams.has("addCustomMeal", true);
    const isValidEditCustomMealParams = (queryParams.has("editCustomMeal", true) 
        && queryParams.has("customMealId") 
        && queryParams.get("customMealId"));
    const isValidEditMealEntryParams = (queryParams.has("editMeal", true) 
        && queryParams.has("mealId") 
        && queryParams.get("mealId"));

    // If the user has navigated here from the settings page, adjust the URL for the back button to take them back there as well
    if (isValidAddCustomMealParams || isValidEditCustomMealParams) {
        // Keeping a backup of the icon element, since replacing textContent will delete it
        const backArrowIcon = backButton.querySelector(".fa-solid");

        backButton.href = "/MyJot/pages/settings.html";
        backButton.textContent = "Return to Settings Page";
        backButton.prepend(backArrowIcon);
    }

    // Declare a new variable that will hold the names of any existing custom meals for use in the Vue app
    let existingCustomMealData;

    // Declare a new variable that will hold any existing log / custom meal data if needed
    let logData;

    try {
        // Initialize a new Dexie DB instance
        myJotDB = new Dexie("MyJotDB");
        
        // Define the necessary DB schema and tables
        myJotDB.version(1).stores(window.getMyJotDBSchemaObj());

        // Open the DB connection
        await myJotDB.open();

        // Pull any existing log / custom meal data if needed
        if (queryParams.size) {
            if (isValidEditMealEntryParams) {
                await myJotDB.transaction("r", myJotDB.mealLog, async function () {
                    logData = await myJotDB.mealLog.get(parseInt(queryParams.get("mealId")));
                });
            } else if (isValidEditCustomMealParams) {
                await myJotDB.transaction("r", myJotDB.customMeals, async function () {
                    logData = await myJotDB.customMeals.get(parseInt(queryParams.get("customMealId")));
                });
            } 
        }

        // Pull all existing custom meal names if any are added
        await myJotDB.transaction("r", myJotDB.customMeals, async function () {
            existingCustomMealData = (await myJotDB.customMeals.toArray()).map(customMeal => {
                return {
                    id: customMeal.id,
                    logName: customMeal.logName
                }
            });
        });
    } catch (error) {
        console.log(error.message);

        // Display the validation error message to the user
        validationAlertComponent.textContent = `Error while opening a DB connection: "${error.message}". Please try again. If the problem persists, contact support.`;

        // Restore compact header spacing and show the validation alert
        logMealPageHeader.classList.remove("mb-5");
        logMealPageHeader.classList.add("mb-4");
        validationAlertComponent.classList.remove("d-none");

        // Ensure the alert is visible by scrolling it into view
        validationAlertComponent.scrollIntoView(false);

        // Remove the loading spinner if any errors occur while opening a DB connection
        loadingSpinner.remove();

        // Exit early from the function if any issues opening the DB
        return;
    }

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
                showLoadFromCustomMealModal: false,
                selectedCustomMeal: null,
                existingCustomMealNames: existingCustomMealData,
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
            * Loads the details from an existing custom meal entry to the meal log
            * Closes the "Load From Existing Meal" modal after the exercise is created.
            */
            loadMealDetails: async function () {
                await myJotDB.transaction("r", myJotDB.customMeals, async () => {
                    const customMealObj = await myJotDB.customMeals.get(parseInt(this.selectedCustomMeal));
                
                    this.inputtedLogName = customMealObj.logName;
                    this.inputtedNotes = customMealObj.logNotes;
                    this.inputtedMealName = customMealObj.mealName;
                    this.selectedMealType = customMealObj.mealType;
                    this.inputtedCalories = customMealObj.calories;
                    this.inputtedProtein = customMealObj.protein;
                    this.inputtedCarbs = customMealObj.carbs;
                    this.inputtedFats = customMealObj.fats;

                    this.showLoadFromCustomMealModal = false;
                });
            },
            /**
            * Attempts to submit the meal entry. 
            * Validates all fields, updates UI spacing and hides the validation alert on success. 
            * If validation fails, displays the error message and adjusts the layout accordingly.
            */
            addMealEntry: async function() {
                try {
                    this.validateMealEntry();

                    const mealObj = {
                        logName: this.inputtedLogName,
                        dateTime: this.selectedDateTime,
                        logNotes: this.inputtedNotes,
                        mealName: this.inputtedLogName,
                        mealType: this.selectedMealType,
                        calories: this.inputtedCalories,
                        protein: this.inputtedProtein,
                        carbs: this.inputtedCarbs,
                        fats: this.inputtedFats
                    };

                    // Add an id property to the object if we are updating an existing log or custom meal
                    if (this.isEditCustomMealMode || this.isEditMealMode) {
                        mealObj.id = logData.id;
                    }
                    
                    // Add or replace the meal log object in the DB
                    if (this.isAddCustomMealMode || this.isEditCustomMealMode) {
                        await myJotDB.transaction("rw", myJotDB.customMeals, async function () {
                            await myJotDB.customMeals.put(mealObj);
                        });
                    } else  {
                        await myJotDB.transaction("rw", myJotDB.mealLog, async function () {
                            await myJotDB.mealLog.put(mealObj);
                        });
                    }

                    // Redirect users to either the log or settings page if their data was successfully validated and inserted into the IndexedDB for the session
                    window.location.replace(`${window.location.origin}/MyJot/pages/${(this.isAddCustomMealMode || this.isEditCustomMealMode) ? 'settings.html' : 'log.html'}`);
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
            * @throws {Error} If any required meal field is missing or invalid.
            */
            validateMealEntry: function() {
                if (!this.inputtedLogName) {
                    throw new Error("A valid log name is required.");
                }

                if (!this.selectedDateTime && !this.isAddCustomMealMode && !this.isEditCustomMealMode) {
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
            // Set UI mode and populate data based on validated query parameters
            if (isValidAddCustomMealParams) {
                this.isAddCustomMealMode = true;
                this.ctaButtonText = "Add Custom Meal";

                document.querySelector("#log-meal-page-title").textContent = "Add Custom Meal";
            } else if (isValidEditCustomMealParams) {
                this.isEditCustomMealMode = true;
                this.ctaButtonText = "Save Changes";

                this.inputtedLogName = logData.logName;
                this.inputtedNotes = logData.logNotes;
                this.inputtedMealName = logData.mealName;
                this.selectedMealType = logData.mealType;
                this.inputtedCalories = logData.calories;
                this.inputtedProtein = logData.protein;
                this.inputtedCarbs = logData.carbs;
                this.inputtedFats = logData.fats;

                document.querySelector("#log-meal-page-title").textContent = "Edit Custom Meal";
            } else if (isValidEditMealEntryParams) {
                this.isEditMealMode = true;
                this.ctaButtonText = "Save Changes";

                this.inputtedLogName = logData.logName;
                this.selectedDateTime = logData.dateTime;
                this.inputtedNotes = logData.logNotes;
                this.inputtedMealName = logData.mealName;
                this.selectedMealType = logData.mealType;
                this.inputtedCalories = logData.calories;
                this.inputtedProtein = logData.protein;
                this.inputtedCarbs = logData.carbs;
                this.inputtedFats = logData.fats;

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