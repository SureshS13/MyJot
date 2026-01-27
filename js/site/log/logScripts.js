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
    let exerciseLogs, mealLogs;

    try {
        // Initialize a new Dexie DB instance
        myJotDB = new Dexie("MyJotDB");

        // Define the necessary DB schema and tables
        myJotDB.version(1).stores(window.getMyJotDBSchemaObj());

        // Open the DB connection
        await myJotDB.open();
       
        // Retrieve the log data from the DB to display in the datatable, and pull the username (if set) and render it in the UI
        await myJotDB.transaction("r", myJotDB.exerciseLog, myJotDB.user, async function () {
            const exerciseLogsArray = await myJotDB.exerciseLog.toArray();

            exerciseLogs = exerciseLogsArray.map(exerciseLog => {
                return {
                    category: "Exercise",
                    name: exerciseLog.logName,
                    datetime: new Date(exerciseLog.dateTime).toUTCString(),
                    editlog: `${window.location.origin}/pages/log-workout.html?editWorkout=true&workoutId=${exerciseLog.id}`,
                    deletelog: `exercise,${exerciseLog.id}`
                };
            });

            const userObj = await myJotDB.user.get(1);

            document.querySelector("#user-welcome-message").textContent = (userObj?.userName) ? `Welcome back ${userObj.userName}!` : "Welcome back Jane Doe!";

            console.error("still need to pull meal logs");
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
    const { createApp } = Vue

    // Create a new Vue application instance with initial data and lifecycle hooks
    const app = createApp({
        data() {
            return {
                logs: exerciseLogs
            }
        },
        methods: {
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
                    await myJotDB.transaction('rw', logTable, async function () {
                        await myJotDB.exerciseLog.delete(logId);

                        const exerciseLogsArray = await myJotDB.exerciseLog.toArray();

                        updatedLogs = exerciseLogsArray.map(exerciseLog => {
                            return {
                                category: "Exercise",
                                name: exerciseLog.logName,
                                datetime: new Date(exerciseLog.dateTime).toUTCString(),
                                editlog: `${window.location.origin}/pages/log-workout.html?editWorkout=true&workoutId=${exerciseLog.id}`,
                                deletelog: `exercise,${exerciseLog.id}`
                            };
                        });
                        
                        console.error("still need to add logic to delete meal logs");
                    });

                    // Update the reactive data to match the updated state
                    this.logs = [...updatedLogs];

                    // Hide any previous validation error messages
                    validationAlertComponent.classList.add("d-none");
                } catch (error) {
                    console.log(error.message);

                    // Show the error message to the user
                    validationAlertComponent.classList.remove("d-none");
                    validationAlertComponent.textContent = `Error while deletinglog: "${error.message}". Please try again. If the problem persists, contact support.`;
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
        .component('p-column', PrimeVue.Column);
    
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
        await myJotDB.transaction('r', myJotDB.user, myJotDB.exerciseLog, myJotDB.exerciseRoutines, async function () {
            // Add the user's profile information to the log object
            const user = await myJotDB.user.get({id: 1});
            logObj.userName = user.userName;
            
            // Add the contents of the exerciseLog table to the log object
            const exerciseLogs = await myJotDB.exerciseLog.toArray();
            logObj.exerciseLogs = exerciseLogs;

            // Add the contents of the exerciseRoutines table to the log object
            const exerciseRoutines = await myJotDB.exerciseRoutines.toArray();
            logObj.exerciseRoutines = exerciseRoutines;
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