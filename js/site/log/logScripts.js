/*******************************************************/
/* Const & let variable declarations & initializations */
/*******************************************************/
const loadingSpinner = document.querySelector(".loader");
const vueAppContainer = document.querySelector("#app");
const validationAlertComponent = document.querySelector("#log-errors-alert");
const saveDataButton = document.querySelector("#save-data-button");

let myJotDB;

/**********************************************************/
/* Event listeners, Method Calls, and Other Misc. Actions */
/**********************************************************/

// Listen for the custom "appsetupcompleted" event to initialize the Log page's Vue app
window.addEventListener("appsetupcompleted", async function () {
    // Declare variables to hold our log data (used in the Vue app)
    let exerciseLogs, mealLogs, combinedLogs;

    try {
        // Initialize a new Dexie DB instance
        myJotDB = new Dexie("MyJotDB");

        // Define the necessary DB schema and tables
        myJotDB.version(1).stores(window.getMyJotDBSchemaObj());

        // Open the DB connection
        await myJotDB.open();
       
        // Retrieve the log data from the DB to display in the datatable, and pull the username (if set) and render it in the UI
        await myJotDB.transaction("r", myJotDB.exerciseLog, myJotDB.mealLog, myJotDB.user, async function () {
            const exerciseLogsArray = await myJotDB.exerciseLog.toArray();
            const mealLogsArray = await myJotDB.mealLog.toArray();

            exerciseLogs = exerciseLogsArray.map(exerciseLog => {
                return {
                    category: "Exercise",
                    name: exerciseLog.logName,
                    datetime: new Date(exerciseLog.dateTime).toUTCString(),
                    sortableDateTime: new Date(exerciseLog.dateTime).getTime(),
                    editlog: `${window.location.origin}/MyJot/pages/log-workout.html?editWorkout=true&workoutId=${exerciseLog.id}`,
                    deletelog: `exercise,${exerciseLog.id}`
                };
            });

            mealLogs = mealLogsArray.map(mealLog => {
                return {
                    category: "Meal",
                    name: mealLog.logName,
                    datetime: new Date(mealLog.dateTime).toUTCString(),
                    sortableDateTime: new Date(mealLog.dateTime).getTime(),
                    editlog: `${window.location.origin}/MyJot/pages/log-meal.html?editMeal=true&mealId=${mealLog.id}`,
                    deletelog: `meal,${mealLog.id}`
                };
            });

            // Build a new array and sort it so the most recent entries appear first, which will be used to populate the History datatable
            combinedLogs = [...exerciseLogs, ...mealLogs].sort(function (a, b) {
                const aDateObj = Date.parse(a.datetime), bDateObj = Date.parse(b.datetime);

                if (aDateObj < bDateObj) {
                    return 1;
                } else if (aDateObj > bDateObj) {
                    return -1;
                } else {
                    return 0;
                }
            });
     
            const userObj = await myJotDB.user.get(1);

            document.querySelector("#user-welcome-message").textContent = (userObj?.userName) ? `Welcome back ${userObj.userName}!` : "Welcome back Jane Doe!";
        });
    } catch (error) {
        console.log(error.message);

        // Show the error message to the user
        validationAlertComponent.classList.remove("d-none");
        validationAlertComponent.textContent = `Error while retrieving save data from DB: "${error.message}". Please try again. If the problem persists, contact support.`;

        // Remove the loading spinner if any errors occur while retrieving data
        loadingSpinner.remove();

        // Exit early from the function if any issues occur retrieving data
        return;
    }

    // Import Vue's core API methods from the global Vue object
    const { createApp } = Vue;

    // Import FilterOperator & FilterMatchMode from the global PrimeVue object to allow for column-specific filtering
    const { FilterOperator, FilterMatchMode } = PrimeVue;
    
    // Create a new Vue application instance with initial data and lifecycle hooks
    const app = createApp({
        data() {
            return {
                logs: combinedLogs,
                filters: {
                    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
                    category: { operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.CONTAINS }] },
                    name: { operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.CONTAINS }] },
                    datetime: { operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.CONTAINS }] }
                },
            }
        },
        methods: {
            /**
            * Clears all applied filters from the History datatable, including global search & any column-specific filters
            */
            clearAllFilters: function() {
                this.filters.global.value = null;
                this.filters.category.constraints[0].value = null;
                this.filters.name.constraints[0].value = null;
                this.filters.datetime.constraints[0].value = null;
            },
            /**
            * Deletes a log entry (exercise or meal) from the database and updates the UI.
            * @async
            * @param {Event} event The click event triggered by the delete button.
             */
            deleteLog: async function(event) {
                try {
                    // Extract the log table name and ID from the button's data attribute
                    const logInfo = event.currentTarget.getAttribute("data-log-info").split(",");
                    const logTable = (logInfo[0] === "exercise") ?  myJotDB.exerciseLog : myJotDB.mealLog;
                    const logId = parseInt(logInfo[1]);   
                    
                    let updatedLogs;
                    
                    // Start a read-write transaction to delete the log and fetch the updated list
                    await myJotDB.transaction('rw', myJotDB.exerciseLog, myJotDB.mealLog, async function () {
                        await logTable.delete(logId);

                        const exerciseLogsArray = await myJotDB.exerciseLog.toArray();
                        const mealLogsArray = await myJotDB.mealLog.toArray();

                        exerciseLogs = exerciseLogsArray.map(exerciseLog => {
                            return {
                                category: "Exercise",
                                name: exerciseLog.logName,
                                datetime: new Date(exerciseLog.dateTime).toUTCString(),
                                sortableDateTime: new Date(exerciseLog.dateTime).getTime(),
                                editlog: `${window.location.origin}/MyJot/pages/log-workout.html?editWorkout=true&workoutId=${exerciseLog.id}`,
                                deletelog: `exercise,${exerciseLog.id}`
                            };
                        });

                        mealLogs = mealLogsArray.map(mealLog => {
                            return {
                                category: "Meal",
                                name: mealLog.logName,
                                datetime: new Date(mealLog.dateTime).toUTCString(),
                                sortableDateTime: new Date(mealLog.dateTime).getTime(),
                                editlog: `${window.location.origin}/MyJot/pages/log-meal.html?editMeal=true&mealId=${mealLog.id}`,
                                deletelog: `meal,${mealLog.id}`
                            };
                        });

                        // Build an updated array and sort it so the most recent entries appear first, used to repopulate the History datatable
                        updatedLogs = [...exerciseLogs, ...mealLogs].sort(function (a, b) {
                            const aDateObj = Date.parse(a.datetime), bDateObj = Date.parse(b.datetime);

                            if (aDateObj < bDateObj) {
                                return 1;
                            } else if (aDateObj > bDateObj) {
                                return -1;
                            } else {
                                return 0;
                            }
                        });
                    });

                    // Update the reactive data to match the updated state
                    this.logs = [...updatedLogs];

                    // Hide any previous validation error messages
                    validationAlertComponent.classList.add("d-none");
                } catch (error) {
                    console.log(error.message);

                    // Show the error message to the user
                    validationAlertComponent.classList.remove("d-none");
                    validationAlertComponent.textContent = `Error while deleting log: "${error.message}". Please try again. If the problem persists, contact support.`;
                }
            }
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
        .component('p-column', PrimeVue.Column)
        .component('p-button', PrimeVue.Button)
        .component('p-input-text', PrimeVue.InputText);
    
    // Mount the Vue app to the #app container in the DOM
    app.mount('#app');

    // Remove the loading spinner once the Vue app has finished initializing
    loadingSpinner.remove();

    // Reveal the Vue app container after setup is complete
    vueAppContainer.classList.remove("d-none");
});

// Listen for when a user clicks on the save data button, triggering the export process for the current session
saveDataButton.addEventListener("click", async function() {
    try {     
        // Declare and initialize an empty JS object which we will eventually store in the save file
        const logObj = {};

        // Start a read transaction to pull all table data from the DB for saving locally
        await myJotDB.transaction('r', myJotDB.user, myJotDB.exerciseLog, myJotDB.mealLog, myJotDB.exerciseRoutines, myJotDB.customMeals, async function () {
            // Add the user's profile information to the log object, if exists. Else, set the placeholder name as "Jane Doe"
            const user = await myJotDB.user.get({id: 1});
            logObj.userName = (user?.userName) ? user.userName : "Jane Doe";
            
            // Add the contents of the exerciseLog table to the log object, if exists
            const exerciseLogs = await myJotDB.exerciseLog.toArray();
            if (exerciseLogs) {
                logObj.exerciseLogs = exerciseLogs;
            }

            // Add the contents of the mealLog table to the log object, if exists
            const mealLogs = await myJotDB.mealLog.toArray();
            if (mealLogs) {
                logObj.mealLogs = mealLogs;
            }

            // Add the contents of the exerciseRoutines table to the log object, if exists
            const exerciseRoutines = await myJotDB.exerciseRoutines.toArray();
            if (exerciseRoutines) {
                logObj.exerciseRoutines = exerciseRoutines;
            }

            // Add the contents of the customMeals table to the log object, if exists
            const customMeals = await myJotDB.customMeals.toArray();
            if (customMeals) {
                logObj.customMeals = customMeals;
            }
        });      

        // Convert the log object into a JSON string for storage
        const logObjectStr = JSON.stringify(logObj);
        
        // Encode the log object string to base64 for saving
        const encodedData = window.btoa(logObjectStr);

        // Declare and initialize a new Blob object which will hold the contents of our new save file
        const blob = new Blob([encodedData], {type: 'text/plain'});

        // Dynamically create a download link and simulate a click to start the download
        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = `${logObj.userName}-Log-${new Date().toDateString()}.myjot`;
        downloadLink.click();

        // Remove the internal reference for the Blob so it can be deleted and free the memory
        URL.revokeObjectURL(blob);

        // Hide any previous validation error messages
        validationAlertComponent.classList.add("d-none");

        // Optionally redirect users back to the file upload page if they would like to close out of their current MyJot session
        const endSession = window.confirm("Would you like to end your current session with MyJot? If yes, you will be redirected to the file upload page.");

        if (endSession) {
            window.location.replace(`${window.location.origin}/index.html`);
        }
    } catch (error) {
        console.log(error.message);

        // Show the error message to the user
        validationAlertComponent.classList.remove("d-none");
        validationAlertComponent.textContent = `Error while saving changes: "${error.message}". Please try again. If the problem persists, contact support.`;
    }
});