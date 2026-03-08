/*******************************************************/
/* Const & let variable declarations & initializations */
/*******************************************************/
const loadingSpinnerContainer = document.querySelector("#loader-container");
const validationAlertComponent = document.querySelector("#stats-validation-errors-alert");
const segmentedControlComponent = document.querySelector(".segmented-control-component");
const todaySegmentControlButton = segmentedControlComponent.querySelector("#today-segmented-control-button");
const thisWeekSegmentControlButton = segmentedControlComponent.querySelector("#this-week-segmented-control-button");
const dailyReportsSectionContainer = document.querySelector("#daily-reports");
const todaysCaloriesEatenReportContainer = document.querySelector("#todays-calories-report");
const todaysCaloriesEatenUserValueSpan = todaysCaloriesEatenReportContainer.querySelector("#todays-calories-report-calories-eaten");
const todaysProteinEatenReportContainer = document.querySelector("#todays-protein-report");
const todaysProteinEatenUserValueSpan = todaysProteinEatenReportContainer.querySelector("#todays-protein-report-protein-eaten");
const todaysFatsEatenReportContainer = document.querySelector("#todays-fats-report");
const todaysFatsEatenUserValueSpan = todaysFatsEatenReportContainer.querySelector("#todays-fats-report-fats-eaten");
const todaysCarbsEatenReportContainer = document.querySelector("#todays-carbs-report");
const todaysCarbsEatenUserValueSpan = todaysCarbsEatenReportContainer.querySelector("#todays-carbs-report-carbs-eaten");
const todaysCaloriesBurnedReportContainer = document.querySelector("#todays-calories-burned-report");
const todaysCaloriesBurnedUserValueSpan = todaysCaloriesBurnedReportContainer.querySelector("#todays-calories-burned-report-calories-burned");
const weeklyReportsSectionContainer = document.querySelector("#weekly-reports");
const numberDayMap = new Map([
    [0, "M"],
    [1, "T"],
    [2, "W"],
    [3, "Th"],
    [4, "F"],
    [5, "S"],
    [6, "Su"]
]);

let myJotDB;

/*********************/
/* Utility Functions */
/*********************/

/**
* Returns the first day of the week (configurable) for the given date.
* @param {number} [startDay=1] The day to treat as the first day of the week (0=Sunday, 1=Monday, etc.).
* @param {Date} [date=new Date()] The input date (defaults to current date).
* @returns {Date} A new Date object set to the first day of the week at 00:00:00.
*/
function getFirstDayOfWeek(currentDate = new Date(), startDay = 1) {
  const currentDay = currentDate.getDay();
  const diff = (currentDay < startDay ? 7 : 0) + currentDay - startDay;

  const firstDayOfWeekDate = new Date(currentDate.setDate(currentDate.getDate() - diff));
  firstDayOfWeekDate.setHours(0, 0, 0, 0); // Reset time to 00:00:00.000

  return firstDayOfWeekDate;
}

/**
* Updates the progress bar for a macro report based on the user's target and current intake.
* Shows the progress bar if a target is set, otherwise adjusts spacing.
* @param {number|undefined} target The user's daily target for the macro (e.g., calories, protein). `undefined` if no target is set.
* @param {number} currentTotal The current amount consumed (e.g., calories eaten, protein eaten).
* @param {HTMLElement} reportContainerElement The DOM element containing the macro report.
*/
function toggleMacroProgressDisplay(target, currentTotal, reportContainerElement) {
    if (target) {
        reportContainerElement.querySelector(".progress-bar").style.width = `${(target * (currentTotal / 100)) * 100}%`;
        reportContainerElement.querySelector(".progress").classList.remove("d-none");
        reportContainerElement.querySelector(".intake-limit")?.classList.remove("d-none");
    } else {
        reportContainerElement.querySelector("h1").style.marginBottom = 0;
    }
}

/**
* Generates a configuration object for an ApexCharts line chart.
* The configuration includes chart type, dimensions, toolbar options, series data, axis labels, and styling.
* @param {Object} config Configuration options for the chart.
* @param {string} [config.chartName=""] The name of the chart series (displayed in the legend).
* @param {Array<number|null>} config.chartData The data points for the chart series. Can include `null` values for missing data.
* @param {string} [config.chartLineColor="#000000"] The color of the line and markers in hex format.
* @returns {Object} ApexCharts configuration object for a line chart.
*/
function generateApexLineChartConfigs({ chartName = "", chartData, chartLineColor = "#000000" }) {
    return {
        chart: {
            type: 'line',
            height: "100%",
            width: "100%",
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: false,
                    zoom: false,
                    zoomin: false,
                    zoomout: false,
                    pan: false,
                    reset: false
                }
            }
        },
        series: [{
            name: chartName,
            data: chartData
        }],
        xaxis: {
            categories: ["M", "T", "W", "Th", "F", "S", "Su"]
        },
        yaxis: {
            min: 0
        },
        stroke: {
            width: 3,
            curve: 'monotoneCubic'
        },
        markers: {
            size: 5
        },
        colors: [chartLineColor]
    };
}

/**
* Populates the daily nutrition report with the user's intake, targets, and calories burned.
* Updates the UI for calories, protein, fats, carbs, and calories burned.
* @param {Object} nutritionData An object containing the user's daily nutrition targets (if set) and intake.
* @param {number|undefined} nutritionData.dailyCalorieTarget -aily calorie target (or `undefined` if not set).
* @param {number|undefined} nutritionData.dailyProteinTarget Daily protein target (or `undefined` if not set).
* @param {number|undefined} nutritionData.dailyFatTarget Daily fat target (or `undefined` if not set).
* @param {number|undefined} nutritionData.dailyCarbsTarget Daily carb target (or `undefined` if not set).
* @param {number} nutritionData.caloriesEaten Calories consumed today.
* @param {number} nutritionData.proteinEaten Protein consumed today.
* @param {number} nutritionData.fatsEaten Fats consumed today.
* @param {number} nutritionData.carbsEaten Carbs consumed today.
* @param {number} nutritionData.caloriesBurned Calories burned today.
*/
function updateDailyFitnessReports({ dailyCalorieTarget, dailyProteinTarget, dailyFatTarget, dailyCarbsTarget, caloriesEaten, proteinEaten, fatsEaten, carbsEaten, caloriesBurned }) {
    // Populate the each of the daily macro count reports, and show the progress bar or adjust the spacing if the user has set a daily target
    todaysCaloriesEatenUserValueSpan.textContent = caloriesEaten;
    toggleMacroProgressDisplay(dailyCalorieTarget, caloriesEaten, todaysCaloriesEatenReportContainer);
    
    todaysProteinEatenUserValueSpan.textContent = proteinEaten;
    toggleMacroProgressDisplay(dailyProteinTarget, proteinEaten, todaysProteinEatenReportContainer);

    todaysFatsEatenUserValueSpan.textContent = fatsEaten;
    toggleMacroProgressDisplay(dailyFatTarget, fatsEaten, todaysFatsEatenReportContainer);

    todaysCarbsEatenUserValueSpan.textContent = carbsEaten;
    toggleMacroProgressDisplay(dailyCarbsTarget, carbsEaten, todaysCarbsEatenReportContainer);

    // Populate the calories burned report with the total amount of burned calories
    todaysCaloriesBurnedUserValueSpan.textContent = caloriesBurned;
}

/**
* Generates and renders weekly line charts for weight changes and caloric intake.
* The charts use ApexCharts.js and are populated with averaged data from the provided Maps.
* Missing data for a day is represented as `null`, which ApexCharts handles by skipping markers/lines for those points.
* @param {Map<number, number[]>} weeklyWeightChangesMap A Map where keys are day indices (0-6) and values are arrays of weight logs for that day.
* @param {Map<number, number[]>} weeklyCaloricIntakeMap A Map where keys are day indices (0-6) and values are arrays of caloric intake logs for that day.
* @returns {void} Renders two ApexCharts line charts to the DOM:
* - `#weight-tracker-chart`: Weekly weight changes.
* - `#calories-eaten-chart`: Weekly caloric intake.
*/
function generateWeeklyReportLineCharts(weeklyWeightChangesMap, weeklyCaloricIntakeMap) {
    // Generate a line chart using Apexcharts.js for the the weekly weight changes report
    const dailyLoggedWeightAverages = [null, null, null, null, null, null, null];
    
    for (let i = 0; i < 7; i++) {
        const weightValuesArr = weeklyWeightChangesMap.get(i);

        // If no weight logs exist for the current index (day), leave the average as `undefined`...
        // ...to implicitly represent missing data. ApexCharts will render markers for non-undefined values
        if (!weightValuesArr) {
            continue;
        }

        // Need to adjust the array index to map Sunday (0) to the end of the array (6)
        dailyLoggedWeightAverages[i === 0 ? 6 : i - 1] = (weightValuesArr.reduce((accumulator, currentValue) => {
            return accumulator += currentValue;
        }, 0)) / weightValuesArr.length;
    }
    const weeklyWeightChangesLineChart = new ApexCharts(document.querySelector("#weight-tracker-chart"), generateApexLineChartConfigs({ chartName: "Weekly Weight Changes", chartData: dailyLoggedWeightAverages }));
    weeklyWeightChangesLineChart.render();

    // Generate a line chart using Apexcharts.js for the the weekly caloric intake report
    const dailyLoggedCaloriesEaten = [null, null, null, null, null, null, null];
    
    for (let i = 0; i < 7; i++) {
        const caloriesEatenArr = weeklyCaloricIntakeMap.get(i);

        // If no meal logs exist for the current index (day), leave the average as `undefined`...
        // ...to implicitly represent missing data. ApexCharts will render markers for non-undefined values
        if (!caloriesEatenArr) {
            continue;
        }
        
        // Need to adjust the array index to map Sunday (0) to the end of the array (6)
        dailyLoggedCaloriesEaten[i === 0 ? 6 : i - 1] = caloriesEatenArr.reduce((accumulator, currentValue) => {
            return accumulator += currentValue;
        }, 0);
    }
    
    const weeklyCaloricIntakeLineChart = new ApexCharts(document.querySelector("#calories-eaten-chart"), generateApexLineChartConfigs({ chartName: "Weekly Caloric Intake", chartData: dailyLoggedCaloriesEaten, chartLineColor: "#0d6efd" }));
    weeklyCaloricIntakeLineChart.render();
}

/**********************************************************/
/* Event listeners, Method Calls, and Other Misc. Actions */
/**********************************************************/
window.addEventListener("appsetupcompleted", async function () {
    const startOfCurrentWeek = getFirstDayOfWeek();

    // Declare and initialize a new Date object variable to represent the earliest time of the current date
    let startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Declare variables to hold any macro goal data set by the user
    let dailyCalorieTarget, dailyProteinTarget, dailyFatTarget, dailyCarbsTarget;

    // Declare and initialize variables & data structures to hold the results of our DB queries used to generate the daily and weekly reports
    let caloriesEatenToday = 0, proteinEatenToday = 0, fatsEatenToday = 0, carbsEatenToday = 0, caloriesBurnedToday = 0;
    let weeklyWeightChangesMap = new Map(), weeklyCaloricIntakeMap = new Map();

    try {
        // Initialize a new Dexie DB instance
        myJotDB = new Dexie("MyJotDB");

        // Define the necessary DB schema and tables
        myJotDB.version(1).stores(window.getMyJotDBSchemaObj());

        // Open the DB connection
        await myJotDB.open();

        // Retrieve the macro goal data from the DB to display in reporting modules (if set), and query the DB for the data needed for our reports
        await myJotDB.transaction("r", myJotDB.exerciseLog, myJotDB.mealLog, myJotDB.user, async function () {    
            const exerciseLogsFromThisWeek = await myJotDB.exerciseLog
                .where("dateTime")
                .aboveOrEqual(startOfCurrentWeek) // Include all entries from this week
                .toArray();
      
            const mealLogsFromThisWeek = await myJotDB.mealLog
                .where("dateTime")
                .aboveOrEqual(startOfCurrentWeek) // Include all entries from today
                .toArray();
            
            exerciseLogsFromThisWeek.forEach(exerciseLog => {
                const exerciseLogDate = new Date(exerciseLog.dateTime);

                exerciseLog.exercises.forEach(exerciseObj => {
                    exerciseObj.sets.forEach(setObj => {
                        // If the exercise log happened sometime today and the user provided a calorie value, add it to our caloriessBurnedToday variable for our daily report
                        if (startOfToday <= exerciseLogDate && startOfToday.getDay() === exerciseLogDate.getDay() && setObj.calories) {
                            caloriesBurnedToday += setObj.calories;
                        }
                    });
                });

                // Store all the provided weights into groups separated by the day they were logged for our weekly report
                if (exerciseLog.bodyWeight) {
                    if (!weeklyWeightChangesMap.has(exerciseLogDate.getDay())) {
                        weeklyWeightChangesMap.set(exerciseLogDate.getDay(), [exerciseLog.bodyWeight]);
                    } else {
                        (weeklyWeightChangesMap.get(exerciseLogDate.getDay())).push(exerciseLog.bodyWeight);
                    }
                }
            });
            
            mealLogsFromThisWeek.forEach(mealLog => {
                const mealLogDate = new Date(mealLog.dateTime);

                // If the meal log happened sometime today and the user provided macro information, add them to our variables for our daily reports
                if (startOfToday <= mealLogDate && startOfToday.getDay() === mealLogDate.getDay()) {
                    if (mealLog.calories) {
                        caloriesEatenToday += mealLog.calories;
                    }

                    if (mealLog.protein) {
                        proteinEatenToday += mealLog.protein;
                    }

                    if (mealLog.fats) {
                        fatsEatenToday += mealLog.fats;
                    }

                    if (mealLog.carbs) {
                        carbsEatenToday += mealLog.carbs;
                    }
                }
                    
                // Store all the provided weights into groups separated by the day they were logged for our weekly report
                if (mealLog.calories) {
                    if (!weeklyCaloricIntakeMap.has(mealLogDate.getDay())) {
                        weeklyCaloricIntakeMap.set(mealLogDate.getDay(), [mealLog.calories]);
                    } else {
                        (weeklyCaloricIntakeMap.get(mealLogDate.getDay())).push(mealLog.calories);
                    }
                }
            });
            
            console.error("Still need to pull the user set information from settings");
        });

        // Populate all daily reports using our queried values
        updateDailyFitnessReports({
            caloriesEaten: caloriesEatenToday,
            dailyCalorieTarget,
            proteinEaten: proteinEatenToday,
            dailyProteinTarget,
            fatsEaten: fatsEatenToday,
            dailyFatTarget,
            carbsEaten: carbsEatenToday,
            dailyCarbsTarget,
            caloriesBurned: caloriesBurnedToday
        });
        
        // Generate all the line charts necessary for our weekly reports using our queried values
        generateWeeklyReportLineCharts(weeklyWeightChangesMap, weeklyCaloricIntakeMap);

        // Hide any previous validation error messages
        validationAlertComponent.classList.add("d-none");

        // Display the segmented controls and daily reports
        segmentedControlComponent.classList.remove("d-none");
        dailyReportsSectionContainer.classList.remove("d-none");
    } catch (error) {
        console.log(error.message);

        // Show the error message to the user
        validationAlertComponent.classList.remove("d-none");
        validationAlertComponent.textContent = `Error while retrieving save data from DB: "${error.message}". Please try again. If the problem persists, contact support.`;

        // Remove the loading spinner if any errors occur while retrieving data
        loadingSpinnerContainer.remove();

        // Exit early from the function if any issues occur retrieving data
        return;
    } finally {
        // Remove the loading spinner if everything finishes successfully
        loadingSpinnerContainer.remove();
    }

    // Attach click event listener on the segmented control component to toggle the visibility and rendering of the daily and weekly reports
    segmentedControlComponent.addEventListener("click", function (event) {
        if (event.target === todaySegmentControlButton) {
            // Toggle the "Today" button as the selected segment control
            todaySegmentControlButton.classList.add("selected-segment-control");
            thisWeekSegmentControlButton.classList.remove("selected-segment-control");

            // Hide all the weekly report modules, and show all the daily report modules
            dailyReportsSectionContainer.classList.remove("d-none");
            weeklyReportsSectionContainer.classList.add("d-none");
        } else {
            // Toggle the "This Week" button as the selected segment control
            thisWeekSegmentControlButton.classList.add("selected-segment-control");
            todaySegmentControlButton.classList.remove("selected-segment-control");

            // Hide all the daily report modules, and show all the weekly report modules
            weeklyReportsSectionContainer.classList.remove("d-none");
            dailyReportsSectionContainer.classList.add("d-none");
        }
    });   
});
