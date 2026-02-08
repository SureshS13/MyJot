/******************/
/* Module Imports */
/******************/
import { createHTMLElement } from "/js/site/shared/SharedAppUtilities.js"

/*******************************************************/
/* Const & let variable declarations & initializations */
/*******************************************************/
const settingButtonGroup = document.querySelectorAll("#setting-button-group > button");
const generalSettingsButton = document.querySelector("#general-settings-button");
const customMealsButton = document.querySelector("#custom-meals-button");
const exerciseRoutinesButton = document.querySelector("#exercise-routines-button");
const generalSettingsSection = document.querySelector("#general-settings");
const userNameInput = document.querySelector("#username-input");
const confirmChangesButton = document.querySelector("#confirm-changes-button");
const customMealsSection = document.querySelector("#custom-meals");
const customMealsSearchbox = customMealsSection.querySelector("#custom-meals-searchbar > input");
const addCustomMealButton = document.querySelector("#add-new-custom-meal-button");
const exerciseRoutinesSection = document.querySelector("#exercise-routines");
const exerciseRoutinesSearchbox = document.querySelector("#exercise-routines-searchbar > input");
const addNewExerciseRoutineButton = document.querySelector("#add-new-exercise-routine-button");
const validationAlertComponent = document.querySelector("header > #settings-validation-errors-alert");

let myJotDB;
let generalSettingsData, customMealsData, exerciseRoutinesData;

/*********************/
/* Utility Functions */
/*********************/

/***
* Constructs a table row for each stored custom meal, and configures it with the necessary event listeners for the page.
* @param {Object} customMeal The saved custom meal object retrieved from the DB
* @returns {HTMLElement} The table row element for the custom meal
*/
function buildCustomMealTableRow(customMeal) {
    const penIcon = createHTMLElement({
        type: "i",
        classes: ["fa-solid", "fa-pen-to-square"]
    });

    const trashIcon = createHTMLElement({
        type: "i",
        classes: ["fa-solid", "fa-trash-can"],
        attributes: [
            {
                name: "data-custom-meal-id",
                value: customMeal.id
            }
        ]
    });

    // Add the event listener needed to delete routines
    trashIcon.addEventListener("click", async function (event) {
        try {
            await myJotDB.transaction("rw", myJotDB.customMeals, async function () {
                await myJotDB.customMeals.delete(parseInt(event.currentTarget.getAttribute("data-custom-meal-id")));
            });

            // Refresh the page if the deletion was successful
            window.location.reload();
        } catch (error) {
            console.error(error.message);

            // Show the error message to the user
            validationAlertComponent.classList.remove("d-none");
            validationAlertComponent.textContent = `Error while deleting the custom meal: "${error.message}". Please reupload your save file and try again. If the problem persists, contact support.`;
        }
    });

    const editTag = createHTMLElement({
        type: "a",
        classes: ["text-decoration-none", "text-black"],
        attributes: [
            {
                name: "href",
                value: `${window.location.origin}/MyJot/pages/log-meal.html?editCustomMeal=true&customMealId=${customMeal.id}`
            }
        ],
        children: [penIcon]
    });

    const deleteTag = createHTMLElement({
        type: "a",
        classes: ["text-decoration-none", "text-black"],
        attributes: [
            {
                name: "href",
                value: "#"
            }
        ],
        children: [trashIcon]
    });

    const customMealNameTd = createHTMLElement({
        type: "td",
        text: customMeal.logName
    });

    const customMealTypeTd = createHTMLElement({
        type: "td",
        text: customMeal.mealType
    });

    const editCustomMealTd = createHTMLElement({
        type: "td",
        children: [editTag]
    });

    const deleteCustomMealTd = createHTMLElement({
        type: "td",
        children: [deleteTag]
    });

    const customMealTableRow = createHTMLElement({ 
        type: "tr",
        children: [customMealNameTd, customMealTypeTd, editCustomMealTd, deleteCustomMealTd]
    });

    return customMealTableRow;
}

/***
* Constructs a table row for each stored routine, and configures it with the necessary event listeners for the page.
* @param {Object} routine The saved routine object retrieved from the DB
* @returns {HTMLElement} The table row element for the routine
*/
function buildRoutineTableRow(routine) {
    const penIcon = createHTMLElement({
        type: "i",
        classes: ["fa-solid", "fa-pen-to-square"]
    });

    const trashIcon = createHTMLElement({
        type: "i",
        classes: ["fa-solid", "fa-trash-can"],
        attributes: [
            {
                name: "data-routine-id",
                value: routine.id
            }
        ]
    });

    // Add the event listener needed to delete routines
    trashIcon.addEventListener("click", async function (event) {
        try {
            await myJotDB.transaction("rw", myJotDB.exerciseRoutines, async function () {
                await myJotDB.exerciseRoutines.delete(parseInt(event.currentTarget.getAttribute("data-routine-id")));
            });

            // Refresh the page if the deletion was successful
            window.location.reload();
        } catch (error) {
            console.error(error.message);

            // Show the error message to the user
            validationAlertComponent.classList.remove("d-none");
            validationAlertComponent.textContent = `Error while deleting the routine: "${error.message}". Please reupload your save file and try again. If the problem persists, contact support.`;
        }
    });

    const editTag = createHTMLElement({
        type: "a",
        classes: ["text-decoration-none", "text-black"],
        attributes: [
            {
                name: "href",
                value: `${window.location.origin}/MyJot/pages/log-workout.html?editRoutine=true&routineId=${routine.id}`
            }
        ],
        children: [penIcon]
    });

    const deleteTag = createHTMLElement({
        type: "a",
        classes: ["text-decoration-none", "text-black"],
        attributes: [
            {
                name: "href",
                value: "#"
            }
        ],
        children: [trashIcon]
    });

    const routineNameTd = createHTMLElement({
        type: "td",
        text: routine.logName
    });

    const editRoutineTd = createHTMLElement({
        type: "td",
        children: [editTag]
    });

    const deleteRoutineTd = createHTMLElement({
        type: "td",
        children: [deleteTag]
    });

    const routineTableRow = createHTMLElement({ 
        type: "tr",
        children: [routineNameTd, editRoutineTd, deleteRoutineTd]
    });

    return routineTableRow;
}

/**
* Shows one section element while hiding a set of other section elements.
* @param {HTMLElement} sectionToShow The section element to display.
* @param {HTMLElement[]} sectionsToHide An array of section elements to hide.
*/
function toggleSettingSections(sectionToShow, sectionsToHide) {
    sectionToShow.classList.remove("hide-section");
  
    sectionsToHide.forEach(section => {
      section.classList.add("hide-section");
    });
}

/**********************************************************/
/* Event listeners, Method Calls, and Other Misc. Actions */
/**********************************************************/
window.addEventListener("appsetupcompleted", async function () {
    try {
        // Declare and initialize a new Dexie DB instance
        myJotDB = new Dexie("MyJotDB");

        // Define the necessary DB schema and tables
        myJotDB.version(1).stores(window.getMyJotDBSchemaObj());

        // Open the DB connection
        await myJotDB.open();

        // Pull the settings data from the DB
        await myJotDB.transaction("r", myJotDB.user, myJotDB.customMeals, myJotDB.exerciseRoutines, async function () {
            generalSettingsData = await myJotDB.user.get(1);
            exerciseRoutinesData = await myJotDB.exerciseRoutines.toArray();
            customMealsData = await myJotDB.customMeals.toArray();
        });

        // Set the initial value of the input text field with the user's username, if set
        userNameInput.value = generalSettingsData?.userName ?? "Jane Doe";

        // Attach event listener to handle username changes and subsequent DB updates
        confirmChangesButton.addEventListener("click", async function () {
            try {
                // Replace the existing user object in the DB
                await myJotDB.transaction("rw", myJotDB.user, async function () {
                    generalSettingsData = await myJotDB.user.put({
                        id: 1,
                        userName: userNameInput.value
                    });
                });

                // Hide any previous validation error messages
                validationAlertComponent.classList.add("d-none");

                // Indiciate to to the user that the save was successful, then after some time revert to default button text
                // TODO: Adjust to use thee existing Bootstrap alert component if time permits so the UI/UX is consistent
                confirmChangesButton.textContent = "Username updated!";
                confirmChangesButton.classList.add("bg-success", "border-success");
                window.setTimeout(() => {
                    confirmChangesButton.textContent = "Confirm changes";
                    confirmChangesButton.classList.remove("bg-success", "border-success");
                }, 2000)
            } catch (error) {
                console.error(error.message);

                // Show the error message to the user
                validationAlertComponent.classList.remove("d-none");
                validationAlertComponent.textContent = `Error while updating username "${error.message}". Please refresh the page file and try again. If the problem persists, contact support.`;
            }
        });

        // Construct a table row for each stored custom meal, and configure it with the necessary event listeners
        customMealsData.forEach(customMeal => {         
            customMealsSection.querySelector("tbody").appendChild(buildCustomMealTableRow(customMeal));
        });
        
        // Construct a table row for each stored routine, and configure it with the necessary event listeners
        exerciseRoutinesData.forEach(routine => {         
            exerciseRoutinesSection.querySelector("tbody").appendChild(buildRoutineTableRow(routine));
        });

        // Attach event listener to handle custom meal filtering
        customMealsSearchbox.addEventListener("input", function () {
            const customMealTableRows = document.querySelectorAll("#custom-meals > table tbody > tr");

            if (customMealsSearchbox.value) {
                customMealTableRows.forEach(tableRow => {
                    const isSearchQueryIncluded = tableRow.querySelector("td:first-child").textContent.toLowerCase().includes(customMealsSearchbox.value.toLowerCase());

                    if (!isSearchQueryIncluded) {
                        tableRow.classList.add("d-none");
                    } else {
                        tableRow.classList.remove("d-none");
                    }
                });
            } else {
                customMealTableRows.forEach(tableRow => tableRow.classList.remove("d-none"));
            }
        });

        // Attach event listener to handle exercise routine filtering
        exerciseRoutinesSearchbox.addEventListener("input", function () {
            const routineTableRows = document.querySelectorAll("#exercise-routines > table tbody > tr");

            if (exerciseRoutinesSearchbox.value) {
                routineTableRows.forEach(tableRow => {
                    const isSearchQueryIncluded = tableRow.querySelector("td:first-child").textContent.toLowerCase().includes(exerciseRoutinesSearchbox.value.toLowerCase());

                    if (!isSearchQueryIncluded) {
                        tableRow.classList.add("d-none");
                    } else {
                        tableRow.classList.remove("d-none");
                    }
                });
            } else {
                routineTableRows.forEach(tableRow => tableRow.classList.remove("d-none"));
            }
        });
        
        // Attach click handlers to each settings button
        settingButtonGroup.forEach(function(settingButton) {
            settingButton.addEventListener("click", function (event) {
                // Update active button styling
                document.querySelector("button.active").classList.remove("active");
                event.currentTarget.classList.add("active");

                // Show the selected settings section and hide the others
                if (event.currentTarget === generalSettingsButton) {
                    toggleSettingSections(generalSettingsSection, [customMealsSection, exerciseRoutinesSection]);
                } else if (event.currentTarget === customMealsButton) {
                    toggleSettingSections(customMealsSection, [generalSettingsSection, exerciseRoutinesSection]);
                } else {
                    toggleSettingSections(exerciseRoutinesSection, [generalSettingsSection, customMealsSection]);
                }
            });
        });

        // Hide any previous validation error messages
        validationAlertComponent.classList.add("d-none");
    } catch (error) {
        console.error(error.message);

        // Show the error message to the user
        validationAlertComponent.classList.remove("d-none");
        validationAlertComponent.textContent = `Error retrieving settings data from DB: "${error.message}". Please refresh the page and try again. If the problem persists, contact support.`;
    }
});

addCustomMealButton.addEventListener("click", function () {
    window.location.replace(`${window.location.origin}/MyJot/pages/log-meal.html?addCustomMeal=true`);
});

addNewExerciseRoutineButton.addEventListener("click", function () {
    window.location.replace(`${window.location.origin}/MyJot/pages/log-workout.html?addRoutine=true`);
});