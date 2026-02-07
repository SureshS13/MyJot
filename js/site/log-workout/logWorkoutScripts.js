/*******************************************************/
/* Const & let variable declarations & initializations */
/*******************************************************/
const loadingSpinner = document.querySelector(".loader");
const logWorkoutPageHeader = document.querySelector("header");
const backButton = logWorkoutPageHeader.querySelector("a");
const validationAlertComponent = logWorkoutPageHeader.querySelector("#log-workout-validation-errors-alert");
const vueAppContainer = document.querySelector("#app");
const queryParams = new URLSearchParams(window.location.search);  

let orderChanged = false;
let currentDraggedExercise, dropTarget, insertBeforeTarget;
let dropIndicator;

let myJotDB;

/**********************************************************/
/* Event listeners, Method Calls, and Other Misc. Actions */
/**********************************************************/

// Listen for the custom "appsetupcompleted" event to initialize the Log page's Vue app
window.addEventListener("appsetupcompleted", async function () {
    // Validate query parameters for pulling the necessary data and configuring add/edit modes in the Vue app below
    const isValidAddRoutineParams = queryParams.has("addRoutine", true);
    const isValidEditRoutineParams = (queryParams.has("editRoutine", true) 
        && queryParams.has("routineId") 
        && queryParams.get("routineId"));
    const isValidEditWorkoutEntryParams = (queryParams.has("editWorkout", true) 
        && queryParams.has("workoutId") 
        && queryParams.get("workoutId"));

    // If the user has navigated here from the settings page, adjust the URL for the back button to take them back there as well
    if (isValidAddRoutineParams || isValidEditRoutineParams) {
        // Keeping a backup of the icon element, since replacing textContent will delete it
        const backArrowIcon = backButton.querySelector(".fa-solid");

        backButton.href = "/pages/settings.html";
        backButton.textContent = "Return to Settings Page";
        backButton.prepend(backArrowIcon);
    }

    // Declare a new variable that will hold the names of any existing routines for use in the Vue app
    let existingRoutineData;

    // Declare a new variable that will hold any existing log / routine data if needed
    let logData;

    try {
        // Initialize a new Dexie DB instance
        myJotDB = new Dexie("MyJotDB");
        
        // Define the necessary DB schema and tables
        myJotDB.version(1).stores(window.getMyJotDBSchemaObj());

        // Open the DB connection
        await myJotDB.open();

        // Pull any existing log / routine data if needed
        if (queryParams.size) {
            if (isValidEditWorkoutEntryParams) {
                await myJotDB.transaction("r", myJotDB.exerciseLog, async function () {
                    logData = await myJotDB.exerciseLog.get(parseInt(queryParams.get("workoutId")));
                });
            } else if (isValidEditRoutineParams) {
                await myJotDB.transaction("r", myJotDB.exerciseRoutines, async function () {
                    logData = await myJotDB.exerciseRoutines.get(parseInt(queryParams.get("routineId")));
                });
            } 
        }

        // Pull all existing routine names if any are added
        await myJotDB.transaction("r", myJotDB.exerciseRoutines, async function () {
            existingRoutineData = (await myJotDB.exerciseRoutines.toArray()).map(routine => {
                return {
                    id: routine.id,
                    logName: routine.logName
                }
            });
        });
        
        // Adjust header spacing and hide validation alert after successful validation
        logWorkoutPageHeader.classList.remove("mb-4");
        logWorkoutPageHeader.classList.add("mb-5");
        validationAlertComponent.classList.add("d-none");
    } catch (error) {
        console.log(error.message);

        // Display the validation error message to the user
        validationAlertComponent.textContent = `Error while opening a DB connection: "${error.message}". Please try again. If the problem persists, contact support.`;

        // Restore compact header spacing and show the validation alert
        logWorkoutPageHeader.classList.remove("mb-5");
        logWorkoutPageHeader.classList.add("mb-4");
        validationAlertComponent.classList.remove("d-none");

        // Ensure the alert is visible by scrolling it into view
        validationAlertComponent.scrollIntoView(false);

        // Remove the loading spinner if any errors occur while opening a DB connection
        loadingSpinner.remove();

        // Exit early from the function if any issues opening the DB
        return;
    }

    // Import Vue's core API methods from the global Vue object
    const { createApp, reactive } = Vue

    // Vue reactive store that manages all workout state and exercise/set operations on the page
    const workoutStore = reactive({
        addedExercises: [],
        /**
        * Adds a new exercise or existing routine to the list of added exercises
        * @param {string} setup The setup configuration to use. Valid values are 'new', 'newfromexisting', 'existing'
        * @param {string} category The category configuration to use when adding the new exercise
        * @param {number} routineId An id for the existing routine to add in the new log
        * @param {Array<object>} routineArray An array of exercise objects to add to the list of added exercises
        * @async
        */
        addExercise: async function({ setup = "new", category = "Strength Training", routineId, routineArray }) {
            if (setup === "existing") {
                for (const exercise of routineArray) {
                    exercise.id = this.addedExercises.length + 1;
                    exercise.order = this.addedExercises.length + 1;

                    this.addedExercises.push(exercise);
                }
            } else if (setup === "newfromexisting") {
                await myJotDB.transaction("r", myJotDB.exerciseRoutines, async () => {
                    const routine = await myJotDB.exerciseRoutines.get(parseInt(routineId));
                    
                    for (const exercise of routine.exercises) {
                        this.addedExercises.push({
                            id: this.addedExercises.length + 1,
                            order: this.addedExercises.length + 1,
                            name: exercise.name,
                            notes: exercise.notes,
                            category: exercise.category,
                            sets: [...exercise.sets]
                        });
                    }
                });
            } else {
                this.addedExercises.push({
                    id: this.addedExercises.length + 1,
                    order: this.addedExercises.length + 1,
                    category: category,
                    sets: [
                        {
                            id: 1,
                            order: 1,
                            type: "Normal"
                        }
                    ]
                });
            }
        },
        /**
        * Updates an existing exercise with new values and resets its sets if the category changes.
        * @param {number} id The id of the exercise to update.
        * @param {string} name The updated exercise name.
        * @param {string} category The updated exercise category.
        * @param {string} notes Additional notes for the exercise.
        */
        updateExercise: function(id, name, category, notes) {
            const exercise = this.addedExercises.find(exercise => exercise.id === id);

            // If the category changes, wipe all set-specific data except id / type,
            // since different categories require different set fields.
            if (exercise.category !== category) {
                exercise.sets.forEach(setObj => {
                    for (const key of Object.keys(setObj)) {
                        if (key !== "id" && key !== "type") {
                            delete setObj[key];
                        }
                    }
                }); 
            }

            // Update the exercise's core fields with the new values.
            exercise.name = name;
            exercise.notes = notes;
            exercise.category = category;
        },
        /**
        * Recalculates and updates the order of exercises based on their current DOM position inside the accordion list.
        */
        updateExerciseOrder: function() {
            const reorderedExercises = document.querySelectorAll(".exercise-accordion");

            // Map each exercise’s DOM ID to its UI index as unique key–value pairs for O(1) lookup during sorting.
            const exerciseOrderMap = new Map();

            reorderedExercises.forEach((ex, index) => {
                exerciseOrderMap.set(parseInt(ex.getAttribute("data-exercise-id")), index);
            });
            
            // Sort the internal exercise array so its order matches the order reflected in the DOM, using the Map created above.
            this.addedExercises.sort(function(exerciseA, exerciseB) {
                const orderA = exerciseOrderMap.get(exerciseA.id), orderB = exerciseOrderMap.get(exerciseB.id);
                
                if (orderA < orderB) {
                    return -1;
                } else if (orderA > orderB) {
                    return 1;
                } else {
                    throw new Error("Invalid state: two exercises share the same UI order");
                }
            });
        
            // After sorting, assign each exercise a sequential order value so the data model reflects the new sorted position.
            for (let i = 0; i < this.addedExercises.length; i++) {
                const exercise = this.addedExercises[i];

                exercise.order = i + 1;
            }
        },
        /**
        * Deletes an exercise at the given order position and reassigns sequential order values to the remaining exercises.
        * @param {number} order The 1‑based order position of the exercise to remove.
        */
        deleteExercise: function(order) {
            this.addedExercises.splice(order - 1, 1);

            this.addedExercises.forEach((exercise, index) => {
                exercise.order = index + 1;
            });
        },
        /**
        * Validates all exercises in the current workout entry. Ensures that:
        * - At least one exercise exists
        * - Each exercise has a valid name
        * - Each exercise contains at least one set
        * - Category-specific validation rules are applied
        * @throws {Error} If any validation rule fails.
        */
        validateAllExercises: function() {
            if (!this.addedExercises.length) {
                throw new Error("Please add at least one exercise before saving your workout.");
            }

            // Add comment here
            this.addedExercises.forEach(exercise => {
                if (!exercise.name) {
                    throw new Error("Every exercise must include a name.");
                }

                if (!exercise.sets || !exercise.sets.length) {
                    throw new Error("Each exercise must include at least one set.");
                }

                switch (exercise.category) {
                    case "Strength Training":
                        this.validateStrengthTrainingExerciseSets(exercise.sets);
                        break;

                    case "Cardio":
                        this.validateCardioExerciseSets(exercise.sets);
                        break;

                    case "Flexibility":
                        // Flexibility exercises do not require set-level validation
                        break;

                    default:
                        throw new Error("The selected exercise category is not recognized.");
                }
            });
        },
        /**
        * Adds a new set to the specified exercise. The new set is assigned a sequential id and order based on the current number of sets.
        * @param {number} exerciseId The id of the exercise to update.
        */
        addExerciseSet: function(exerciseId) {
            const exercise = this.addedExercises.find(exercise => exercise.id === exerciseId);

            exercise.sets.push({
                id: exercise.sets.length + 1,
                order: exercise.sets.length + 1,
                type: "Normal"
            });
        },
        /**
        * Updates the properties of a specific set within an exercise. 
        * The exact fields updated may vary depending on the exercise category or future data model changes.
        * @param {number} exerciseId The id of the exercise containing the set.
        * @param {number} setId The id of the set to update.
        * @param {string} type The set type (e.g., "Normal", "Warm-up", etc.).
        * @param {number} [minutes] Optional duration in minutes.
        * @param {number} [seconds] Optional duration in seconds.
        * @param {number} [distance] Optional distance value.
        * @param {string} [distanceUnitType] Unit of measurement for distance.
        * @param {number} [calories] Optional calorie value.
        * @param {number} [reps] Optional repetition count.
        * @param {number} [weight] Optional weight value.
        * @param {string} [weightUnitType] Unit of measurement for weight.
        * @param {string} [notes] Optional notes for the set.
        */
        updateExerciseSet: function(exerciseId, setId, type, minutes, seconds, distance, distanceUnitType, calories, reps, weight, weightUnitType, notes) {
            const exercise = this.addedExercises.find(exercise => exercise.id === exerciseId), set = exercise.sets.find(set => set.id === setId);

            set.type = type;
            set.notes = notes;

            // Delete any category-specific properties from the object that are NOT needed for the current exercise type, then set what is needed
            switch (exercise.category) {
                case "Cardio":
                    delete this.reps;
                    delete this.weight;
                    delete this.weightUnitType;

                    set.minutes = minutes;
                    set.seconds = seconds;
                    set.distance = distance;
                    set.distanceUnitType = distanceUnitType;
                    set.calories = calories;

                    break;

                case "Strength Training":
                    delete this.minutes;
                    delete this.seconds;
                    delete this.distance;
                    delete this.distanceUnitType;
                    delete this.calories;

                    set.reps = reps;
                    set.weight = weight;
                    set.weightUnitType = weightUnitType;

                    break;
            }
        },
        /**
        * Deletes a specific set from an exercise. 
        * Ensures that at least one set always remains and reassigns sequential order values after deletion.
        * @param {number} exerciseId The id of the exercise containing the set.
        * @param {number} order The 1‑based order position of the set to remove.
        */
        deleteExerciseSet: function(exerciseId, order) {
            const exercise = this.addedExercises.find(exercise => exercise.id === exerciseId);

            // Prevent deletion when only one set remains, since every exercise must retain at least one set
            if (exercise.sets.length <= 1) {
                return;
            }
            
            exercise.sets.splice(order - 1, 1);
            
            exercise.sets.forEach((set, index) => {
                set.order = index + 1;
            });
        },
        /**
        * Validates all sets within a strength training exercise. Ensures that each set
        * contains the required fields (such as reps and weight) needed for a valid
        * strength training entry.
        * @param {Array<Object>} sets The collection of sets to validate.
        * @throws {Error} If any required strength training field is missing or invalid.
        */
        validateStrengthTrainingExerciseSets: function(sets) {
            sets.forEach(set => {
                if (!set.reps) {
                    throw new Error("Please enter the number of reps for each strength training set.");
                }

                if (!set.weight) {
                    throw new Error("Please enter the weight used for each strength training set.");
                }
            });
        },
        /**
        * Validates all sets within a cardio exercise. Ensures that each set includes
        * the required duration and distance fields needed for a valid cardio entry.
        * @param {Array<Object>} sets The collection of cardio sets to validate.
        * @throws {Error} If any required cardio field is missing or invalid.
        */
        validateCardioExerciseSets: function(sets) {
            sets.forEach(set => {
                if (!set.minutes) {
                    throw new Error("Please enter the number of minutes for each cardio set.");
                }

                if (!set.seconds) {
                    throw new Error("Please enter the number of seconds for each cardio set.");
                }

                if (!set.distance) {
                    throw new Error("Please enter the distance for each cardio set.");
                }
            });
        }
    })

    const setComponent = {
        props: {
            exerciseId: Number,
            category: String,
            set: Object
        },
        data() {
            return {
                workoutStore,
                setId: this.set.id,
                setType: this.set.type,
                setMinutes: this.set.minutes,
                setSeconds: this.set.seconds,
                setDistance: this.set.distance,
                setDistanceUnitType: this.set.distanceUnitType,
                setCalories: this.set.calories,
                setReps: this.set.reps,
                setWeight: this.set.weight,
                setWeightUnitType: this.set.weightUnitType,
                setNotes: this.set.notes,
                setTypes: ["Normal", "Warm-up"],
                weightUnitTypes: ["lbs", "kgs"],
                distanceUnitTypes: ["miles", "kilometers"]
            }
        },
        methods: {
            /**
            * Updates the current set’s data in the workout store using the values
            * bound to this component. This method forwards all relevant set fields
            * to the store so the parent workout state remains in sync with the UI.
            */
            updateExerciseSet() {
                this.workoutStore.updateExerciseSet(this.exerciseId, this.setId, this.setType, this.setMinutes, this.setSeconds, this.setDistance, this.setDistanceUnitType, this.setCalories, this.setReps, this.setWeight, this.setWeightUnitType, this.setNotes);
            }
        },
        template: `
            <div class="p-4" :class='(setId > 1) ? "border border-light-subtle border-top-4 border-start-0 border-end-0" : ""'>
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h5 class="mb-0" style="padding-top: 0.15rem;">{{ set.order }}</h5>
                    <i @click="workoutStore.deleteExerciseSet(exerciseId, set.order)" class="fa-solid fa-circle-minus fa-lg" :class="(workoutStore.addedExercises.find(exercise => exercise.id === exerciseId).sets.length <= 1) ? 'd-none' : ''"></i> 
                </div>
                <div class="d-flex flex-column gap-2 mb-4">
                    <label for="set-type">Type</label>
                    <p-select v-model="setType" @change="updateExerciseSet()" :options="setTypes" class="w-100" id="set-type" name="set-type" checkmark :highlightOnSelect="false" />
                </div>
                <div class="d-flex flex-column flex-xl-row gap-xl-3 mb-4" :class="(category !== 'Strength Training') ? 'd-none' : ''">
                    <div class="flex-xl-grow-1 mb-4 mb-xl-0">
                        <label class="mb-2" for="reps">Reps</label>
                        <p-input-number v-model="setReps" @update:modelValue="updateExerciseSet()" inputId="reps" :min="0" fluid />        
                    </div>
                    <div class="flex-xl-grow-1 mb-4 mb-xl-0">
                        <label class="mb-2" for="weight">Weight</label>
                        <p-input-number v-model="setWeight" @update:modelValue="updateExerciseSet()" inputId="weight" :min="0" fluid />        
                    </div>
                    <div class="flex-xl-grow-1 mb-0 mb-xl-0">
                        <label class="mb-2" for="set-weight-unit-type">Unit Type</label>
                        <p-select v-model="setWeightUnitType" @change="updateExerciseSet()" :options="weightUnitTypes" class="w-100" id="set-weight-unit-type" name="set-weight-unit-type" checkmark :highlightOnSelect="false" /> 
                    </div>
                </div>
                <div class="d-flex flex-column flex-xl-row gap-xl-3 mb-4" :class="(category !== 'Cardio') ? 'd-none' : ''">
                    <div class="flex-xl-grow-1 mb-4 mb-xl-0">
                        <label class="mb-2" for="minutes">Minutes</label>
                        <p-input-number v-model="setMinutes" @update:modelValue="updateExerciseSet()" inputId="minutes" :min="0" fluid />        
                    </div>
                    <div class="flex-xl-grow-1 mb-4 mb-xl-0">
                        <label class="mb-2" for="seconds">Seconds</label>
                        <p-input-number v-model="setSeconds" @update:modelValue="updateExerciseSet()" inputId="seconds" :min="0" fluid />        
                    </div>
                    <div class="flex-xl-grow-1 mb-4 mb-xl-0">
                        <label class="mb-2" for="distance">Distance</label>
                        <p-input-number v-model="setDistance" @update:modelValue="updateExerciseSet()" inputId="distance" :min="0" fluid />        
                    </div>
                    <div class="flex-xl-grow-1 mb-0 mb-xl-0">
                        <label class="mb-2" for="set-weight-unit-type">Unit Type</label>
                        <p-select v-model="setDistanceUnitType" @change="updateExerciseSet()" :options="distanceUnitTypes" class="w-100" id="set-distance-unit-type" name="set-distance-unit-type" checkmark :highlightOnSelect="false" /> 
                    </div>
                </div>
                <div class="d-flex flex-column gap-2 mb-4" :class="(category !== 'Cardio') ? 'd-none' : ''">
                    <label for="calories">Calories (Optional)</label>
                    <p-input-number v-model="setCalories" @update:modelValue="updateExerciseSet()" inputId="calories" :min="0" fluid /> 
                </div>
                <input v-model="setNotes" @input="updateExerciseSet()" type="text" class="optional-set-notes" contenteditable="true" placeholder="Add Set Notes (Optional)"></input>
            </div>
        `
    };

    const exerciseComponent = {
        props: {
            id: Number,
            order: Number,
            name: String,
            notes: String,
            category: String,
            sets: Array
        },
        data() {
            return {
                workoutStore,
                exerciseName: this.name,
                exerciseNotes: this.notes,
                exerciseCategory: this.category,
                exerciseSets: this.sets,
                exerciseTypes: ["Cardio", "Strength Training", "Flexibility"]
            }
        },
        methods: {
            /**
            * Updates the exercise’s core fields (name, category, notes) in the workout store.
            * Keeps the store in sync with the values edited inside this component.
            */
            updateExercise() {
                this.workoutStore.updateExercise(this.id, this.exerciseName, this.exerciseCategory, this.exerciseNotes)
            },
            /**
            * Handles the start of a drag operation. Stores a reference to the element
            * being dragged so it can be compared and repositioned during drag events.
            * @param {DragEvent} event The dragstart event.
            */
            onDragStart(event) {
                currentDraggedExercise = event.currentTarget;
            },
            /**
            * Handles drag-over behavior for exercise reordering. Enables dropping,
            * determines whether the dragged item should be placed before or after
            * the hovered element, and visually displays the insertion position.
            * @param {DragEvent} event The dragover event.
            */
            onDragOver(event) {
                event.preventDefault(); // Required to allow dropping
                
                // Only process if hovering over a different exercise element
                if (!event.currentTarget.isSameNode(currentDraggedExercise)) {
                    // Track the element currently being hovered as the potential drop target
                    dropTarget = event.currentTarget;
                    
                    // Calculate the vertical midpoint of the drop target to determine before / after placement
                    const rect = dropTarget.getBoundingClientRect(); 
                    const dropTargetMidY = rect.top + (rect.height / 2);
                    
                    // Remove any previously added visual indicator and create a new one
                    dropIndicator?.remove();
                    dropIndicator = document.createElement("hr");

                    // Insert the visual indicator before or after the target based on cursor position
                    if (event.clientY < dropTargetMidY) {
                        insertBeforeTarget = true;
                        dropTarget.insertAdjacentElement("beforebegin", dropIndicator);
                    } else {
                        insertBeforeTarget =  false;
                        dropTarget.insertAdjacentElement("afterend", dropIndicator);
                    }
                }
            },
            /**
            * Finalizes the drop action by inserting the dragged exercise element into its new position relative to the drop target.
            * @param {DragEvent} event The drop event.
            */
            onDrop(event) {
                // Ignore if dropped onto itself
                if (event.currentTarget.isSameNode(currentDraggedExercise)) {
                    return;
                }
                
                // Remove the dragged element from its old position
                currentDraggedExercise?.remove();

                // Insert the dragged element before or after the drop target
                if (insertBeforeTarget) {
                    dropTarget.insertAdjacentElement("beforebegin", currentDraggedExercise);
                } else {
                    dropTarget.insertAdjacentElement("afterend", currentDraggedExercise);
                }

                orderChanged = true;
            },
            /**
            * Cleans up visual indicators after dragging ends and triggers a store update if the exercise order has changed.
            */
            onDragEnd() {
                // Remove the temporary line indicator
                dropIndicator?.remove();

                // If a reorder occurred, update the exercise order in the store
                if (orderChanged) {
                    workoutStore.updateExerciseOrder();
                }
            }
        },
        template: `
            <div @dragstart="onDragStart" @dragover="onDragOver" @drop="onDrop" @dragend="onDragEnd" class="accordion exercise-accordion mb-4" :id="'exerciseAccordion' + id" :data-exercise-id="id" draggable="true">
                <div class="accordion-item">
                    <h2 class="accordion-header">
                    <button class="accordion-button fw-bold" type="button" data-bs-toggle="collapse" :data-bs-target="'#' + id" aria-expanded="true" :aria-controls="id">
                        <i class="fa-solid fa-arrows-up-down-left-right me-2"></i>
                        <span>{{ order }}</span>&nbsp; - &nbsp;<span class="exercise-name">{{ exerciseName }}</span>
                    </button>
                    </h2>
                    <div :id="id" class="accordion-collapse collapse show" :data-bs-parent="'#exerciseAccordion' + id">
                    <div class="accordion-body mb-2">
                        <div class="card-body">
                            <h5 class="mb-2">
                                <span>{{ order }}</span> - <input v-model="exerciseName" @input="updateExercise()" type="text" class="fw-bold" contenteditable="true" placeholder="Add Exercise Name" />
                            </h5>
                            <input v-model="exerciseNotes" @input="updateExercise()" type="text" class="optional-exercise-notes mb-4" contenteditable="true" placeholder="Add Exercise Notes (Optional)" />
                            <div class="d-flex flex-column gap-2 mb-4">
                                <label for="exercise-type">Category</label>
                                <p-select v-model="exerciseCategory" @change="updateExercise()" :options="exerciseTypes" class="w-100" id="exercise-type" name="exercise-type" checkmark :highlightOnSelect="false" />
                            </div>
                            <div class="mb-4">
                                <p class="mb-2">Sets</p>
                                <div class="card mb-3">
                                    <div class="card-body p-0">
                                        <set-component v-for="set in sets" :key="set.id" :exerciseId="id" :category="exerciseCategory" :set="set"></set-component>
                                        <button @click="workoutStore.addExerciseSet(id)"  type="button" class="btn btn-outline-dark border-0 border-top rounded-top-0 w-100 p-2" style="border-color: rgba(0, 0, 0, 0.176);">
                                            <i class="fa-solid fa-circle-plus"></i> Add Set
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <section class="d-flex flex-column d-xl-block text-xl-center">
                                <button @click="workoutStore.deleteExercise(order)" type="button" class="btn btn-outline-danger">
                                    <i class="fa-solid fa-trash"></i> Delete Exercise
                                </button>   
                            </section>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        `
    };

    // Create a new Vue application instance with initial data and lifecycle hooks
    const app = createApp({
        data() {
            return {
                isAddRoutineMode: false,
                isEditRoutineMode: false,
                isEditWorkoutMode: false,
                ctaButtonText: "Add Workout Entry",
                workoutStore,
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
                existingExerciseRoutineNames: existingRoutineData,
                selectedExerciseType: null,
                selectedSetType: "Normal",
                setTypes: ["Normal", "Warm-up"]
            }
        }, 
        methods: {
            /**
            * Adds a new exercise to the workout using the selected setup, category, and routineId. 
            * Closes the "Add Exercise" modal after the exercise is created.
            */
            addExercise: function() {
                const exerciseObj = {
                    setup: this.selectedExerciseSetup
                };
           
                if (this.selectedExerciseRoutine) {            
                    exerciseObj.routineId = this.selectedExerciseRoutine
                } else {
                    exerciseObj.category = this.selectedNewExerciseType
                }

                workoutStore.addExercise(exerciseObj);

                this.showAddExerciseModal = false
            },
            /**
            * Attempts to submit the workout entry. 
            * Validates all fields, updates UI spacing and hides the validation alert on success. 
            * If validation fails, displays the error message and adjusts the layout accordingly.
            */
            addWorkoutEntry: async function() {
                try {
                    this.validateWorkoutEntry();
                    
                    const obj = {};

                    obj.logName = this.inputtedLogName;
                    obj.dateTime = this.selectedDateTime;
                    obj.bodyWeight = this.inputtedBodyWeight;
                    obj.weightUnitType = this.selectedUnitType;
                    obj.logNotes = this.inputtedNotes;
                    
                    // Build a deep copy of the exercises array and sets subarray for storing in the DB
                    obj.exercises = this.workoutStore.addedExercises.map(exercise => {
                        const copiedExercise = { ...exercise };
                        
                        copiedExercise.sets = copiedExercise.sets.map(set => {
                            return { ...set };
                        });
                        
                        return copiedExercise;
                    });

                    // Add an id property to the object if we are updating an existing log or routine
                    if (this.isEditRoutineMode || this.isEditWorkoutMode) {
                        obj.id = logData.id;
                    }

                    // Add or replace the exercise log object in the DB
                    if (this.isAddRoutineMode || this.isEditRoutineMode) {
                        await myJotDB.transaction("rw", myJotDB.exerciseRoutines, async function () {
                            await myJotDB.exerciseRoutines.put(obj);
                        });
                    } else  {
                        await myJotDB.transaction("rw", myJotDB.exerciseLog, async function () {
                            await myJotDB.exerciseLog.put(obj);
                        });
                    } 

                    // Redirect users to either the log or settings page if their data was successfully validated and inserted into the IndexedDB for the session
                    window.location.replace(`${window.location.origin}/pages/${(this.isAddRoutineMode || this.isEditRoutineMode) ? 'settings.html' : 'log.html'}`);
                } catch (error) {
                    console.error(error.message);

                    // Display the validation error message to the user
                    validationAlertComponent.textContent = error.message;

                    // Restore compact header spacing and show the validation alert
                    logWorkoutPageHeader.classList.remove("mb-5");
                    logWorkoutPageHeader.classList.add("mb-4");
                    validationAlertComponent.classList.remove("d-none");

                    // Ensure the alert is visible by scrolling it into view
                    validationAlertComponent.scrollIntoView(false);
                }
            },
            /**
            * Validates the workout entry fields before submission.
            * Ensures that the log name, date/time, and bodyweight are provided, then delegates exercise-level validation to the workout store.
            * @throws {Error} If any required workout field is missing or invalid.
            */
            validateWorkoutEntry: function() {
                if (!this.inputtedLogName) {
                    throw new Error("A valid log name is required.");
                }

                if (!this.selectedDateTime && !this.isAddRoutineMode && !this.isEditRoutineMode) {
                    throw new Error("A valid date & time is required.");
                }

                if (!this.inputtedBodyWeight) {
                    throw new Error("A valid bodyweight is required.");
                }   

                this.workoutStore.validateAllExercises();
            }
        },
        beforeMount() {    
            // Set UI mode and populate data based on validated query parameters
            if (isValidAddRoutineParams) {
                this.isAddRoutineMode = true;
                this.ctaButtonText = "Add Exercise Routine";

                document.querySelector("#log-workout-page-title").textContent = "Add Exercise Routine";
            } else if (isValidEditRoutineParams) {
                this.isEditRoutineMode = true;
                this.ctaButtonText = "Save Changes";

                this.inputtedLogName = logData.logName;
                this.inputtedBodyWeight = logData.bodyWeight;
                this.selectedUnitType = logData.weightUnitType;
                this.inputtedNotes = logData.logNotes;

                this.workoutStore.addExercise({
                    setup: "existing",
                    routineArray: logData.exercises
                });

                document.querySelector("#log-workout-page-title").textContent = "Edit Exercise Routine";
            } else if (isValidEditWorkoutEntryParams) {
                this.isEditWorkoutMode = true;
                this.ctaButtonText = "Save Changes";
                
                this.inputtedLogName = logData.logName;
                this.selectedDateTime = logData.dateTime;
                this.inputtedBodyWeight = logData.bodyWeight;
                this.selectedUnitType = logData.weightUnitType;
                this.inputtedNotes = logData.logNotes;
                
                this.workoutStore.addExercise({
                    setup: "existing",
                    routineArray: logData.exercises
                });

                document.querySelector("#log-workout-page-title").textContent = "Edit Workout Log";
            }
        },
        mounted() {
             // Enable the DragDropTouch polyfill so the page's drag‑and‑drop functionality works on mobile and touch devices
            window.DragDropTouch.enable();

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

    // Register custom Exercise and Set components globally so they can be used throughout the app
    app.component("exercise-component", exerciseComponent)
        .component("set-component", setComponent);
    
    // Mount the Vue app to the #app container in the DOM
    app.mount('#app');

    // Remove the loading spinner once the Vue app has finished initializing
    loadingSpinner.remove();

    // Reveal the Vue app container after setup is complete
    vueAppContainer.classList.remove("d-none");
});