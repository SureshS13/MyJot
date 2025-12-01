/*******************************************************/
/* Const & let variable declarations & initializations */
/*******************************************************/
const settingButtonGroup = document.querySelectorAll("#setting-button-group > button");
const generalSettingsButton = document.querySelector("#general-settings-button");
const customMealsButton = document.querySelector("#custom-meals-button");
const exerciseRoutinesButton = document.querySelector("#exercise-routines-button");
const generalSettingsSection = document.querySelector("#general-settings");
const customMealsSection = document.querySelector("#custom-meals");
const exerciseRoutinesSection = document.querySelector("#exercise-routines");

/*********************/
/* Utility Functions */
/*********************/

/**
* Shows one section element while hiding a set of other section elements.
* @param {HTMLElement} sectionToShow The section element to display.
* @param {HTMLElement[]} sectionsToHide An array of section elements to hide.
*/
function toggleSettingSections(sectionToShow, sectionsToHide) {
    sectionToShow.classList.remove("d-none");
  
    sectionsToHide.forEach(section => {
      section.classList.add("d-none");
    });
}

/**********************************************************/
/* Event listeners, Method Calls, and Other Misc. Actions */
/**********************************************************/

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