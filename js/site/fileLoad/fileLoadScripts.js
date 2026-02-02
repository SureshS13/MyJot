/*******************************************************/
/* Const & let variable declarations & initializations */
/*******************************************************/

const validationAlertComponent = document.querySelector("#file-upload-errors-alert");
const saveFileUploadInput = document.querySelector("#file-upload-input");
const newUserButton = document.querySelector("footer > a");

/**********************************************************/
/* Event listeners, Method Calls, and Other Misc. Actions */
/**********************************************************/

// Listen for when a user selects a save file to upload, triggering the import process for the current session
saveFileUploadInput.addEventListener("change", async function () {
    // Get the first file selected by the user
    const uploadedSaveFile = saveFileUploadInput.files.item(0);

    // Read the file content as text (base64 encoded)
    const encodedData = await uploadedSaveFile.text();
    
    try {
        // Decode the base64 content to get the original data
        const decodedData = window.atob(encodedData);

        // Parse the decoded base64 string into a JS object for further processing.
        const logObj = JSON.parse(decodedData);

        if (!decodedData) {
            throw new Error("The uploaded save file is empty or could not be read.");
        }

        // Delete any existing database to avoid conflicts.
        // MyJot doesn't persist data past a single user's session, per design.
        Dexie.delete("MyJotDB").catch((error) => {
            throw new Error(`Could not delete the prior database, received the following error message ${error.message}. Try closing all instances of this page and opening a fresh page.`);
        })
        
        // Declare and initialize a new Dexie DB instance
        // Using Dexie as a wrapper for the IndexedDB API since its easier to work with
        let myJotDB = new Dexie("MyJotDB");

        // Define the necessary DB schema and tables
        myJotDB.version(1).stores(window.getMyJotDBSchemaObj());

        // Open the DB connection
        await myJotDB.open();
       
        // Start a read-write transaction to safely add all log data to the DB
        await myJotDB.transaction('rw', myJotDB.user, myJotDB.exerciseLog, myJotDB.mealLog, myJotDB.exerciseRoutines, myJotDB.customMeals, async function () {
            // Add the user's profile information to the 'user' table
            await myJotDB.user.add({
                userName: logObj.userName
            });
            
            // Iterate through each exercise log and add it to the 'exerciseLog' table
            if (Array.isArray(logObj.exerciseLogs)) {
                for (const obj of logObj.exerciseLogs) {
                    await myJotDB.exerciseLog.add(obj);
                }
            }

            // Iterate through each meal log and add it to the 'mealLog' table
            if (Array.isArray(logObj.mealLog)) {
                for (const obj of logObj.mealLogs) {
                    await myJotDB.mealLog.add(obj);
                }
            }

            // Iterate through each exercise routine and add it to the 'exerciseRoutines' table
            if (Array.isArray(logObj.exerciseRoutines)) {
                for (const obj of logObj.exerciseRoutines) {
                    await myJotDB.exerciseRoutines.add(obj);
                }
            }

            // Iterate through each custom meal and add it to the 'customMeals' table
            if (Array.isArray(logObj.customMeals)) {
                for (const obj of logObj.customMeals) {
                    await myJotDB.customMeals.add(obj);
                }
            }
        });
        
        // Hide any previous validation error messages
        validationAlertComponent.classList.add("d-none");

        // Redirect users to the log page if their data was successfully validated and inserted into the IndexedDB for the session
        window.location.replace(`${window.location.origin}/pages/log.html`);
    } catch (error) {
        console.error(error.message);

        // Show the error message to the user
        validationAlertComponent.classList.remove("d-none");
        validationAlertComponent.textContent = `Error processing save file: "${error.message}". Please refresh the page and try again. If the problem persists, contact support.`;
    }
});

// Listen for when a new user clicks on the new user button, triggering the processing steps needed before redirecting them to the log page
newUserButton.addEventListener("click", function (event) {
    event.preventDefault();
    
    try {
        // Delete any existing database to avoid conflicts (just in case).
        // MyJot doesn't persist data past a single user's session, per design.
        Dexie.delete("MyJotDB").catch((error) => {
            throw new Error(`Could not delete the prior database, received the following error message ${error.message}. Try closing all instances of this page and opening a fresh page.`);
        })
    
        // Hide any previous validation error messages
        validationAlertComponent.classList.add("d-none");

        // Redirect users to the log page if their data was successfully validated and inserted into the IndexedDB for the session
        window.location.replace(`${window.location.origin}/pages/log.html`);
    } catch (error) {
        console.error(error.message);

        // Show the error message to the user
        validationAlertComponent.classList.remove("d-none");
        validationAlertComponent.textContent = `Error processing new user: "${error.message}". Please refresh the page and try again. If the problem persists, contact support.`;
    }
});