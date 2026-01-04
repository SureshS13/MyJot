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
    const { createApp, reactive } = Vue

    // Add comment here
    const workoutStore = reactive({
        addedExercises: [],
        addExercise: function({ setup = "new", category = "Strength Training", routine }) {
            console.log(setup)
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
        },
        updateExercise: function(id, name, category, notes) {
            this.addedExercises[id - 1].name = name;
            this.addedExercises[id - 1].category = category;
            this.addedExercises[id - 1].notes = notes;
            // TODO- need to add some logic here to dynamically clear / reset the different inputs to default or null values based on the selected category (strength vs cardio vs flexibility)
        },
        deleteExercise: function(order) {
            this.addedExercises.splice(order - 1, 1);

            this.addedExercises.forEach((exercise, index) => {
                exercise.order = index + 1;
            });
        },
        addExerciseSet: function(exerciseId) {
            this.addedExercises[exerciseId - 1].sets.push({
                id: this.addedExercises[exerciseId - 1].sets.length + 1,
                order: this.addedExercises[exerciseId - 1].sets.length + 1,
                type: "Normal"
            });
        },
        updateExerciseSet: function(exerciseId, setId, type, minutes, seconds, distance, distanceUnitType, calories, reps, weight, weightUnitType, notes) {
            const sets = this.addedExercises[exerciseId - 1].sets;
            sets[setId - 1].type = type;
            sets[setId - 1].minutes = minutes;
            sets[setId - 1].seconds = seconds;
            sets[setId - 1].distance = distance;
            sets[setId - 1].distanceUnitType = distanceUnitType;
            sets[setId - 1].calories = calories;
            sets[setId - 1].reps = reps;
            sets[setId - 1].weight = weight;
            sets[setId - 1].weightUnitType = weightUnitType;
            sets[setId - 1].notes = notes;
        },
        deleteExerciseSet: function(exerciseId, order) {
            const exercise = this.addedExercises[exerciseId - 1];

            if (exercise.sets.length <= 1) {
                return;
            }
            
            exercise.sets.splice(order - 1, 1);
            
            exercise.sets.forEach((set, index) => {
                set.order = index + 1;
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
                setNotes: this.set.setNotes,
                setTypes: ["Normal", "Warm-up"],
                weightUnitTypes: ["", "lbs", "kgs"],
                distanceUnitTypes: ["", "miles", "kilometers"]
            }
        },
        methods: {
            updateExerciseSet() {
                this.workoutStore.updateExerciseSet(this.exerciseId, this.setId, this.setType, this.setMinutes, this.setSeconds, this.setDistance, this.setDistanceUnitType, this.setCalories, this.setReps, this.setWeight, this.setWeightUnitType, this.setNotes);
            }
        },
        template: `
            <div class="p-4" :class='(setId > 1) ? "border border-light-subtle border-top-4 border-start-0 border-end-0" : ""'>
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h5 class="mb-0" style="padding-top: 0.15rem;">{{ set.order }}</h5>
                    <i @click="workoutStore.deleteExerciseSet(exerciseId, set.order)" class="fa-solid fa-circle-minus fa-lg"></i> 
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
            updateExercise() {
                this.workoutStore.updateExercise(this.id, this.exerciseName, this.exerciseCategory, this.exerciseNotes)
            }
        },
        template: `
            <div class="accordion mb-4" id="exerciseAccordion" draggable="true">
                <div class="accordion-item">
                    <h2 class="accordion-header">
                    <button class="accordion-button fw-bold" type="button" data-bs-toggle="collapse" :data-bs-target="'#' + id" aria-expanded="true" :aria-controls="id">
                        <span>{{ order }}</span>&nbsp; - &nbsp;<span class="exercise-name">{{ exerciseName }}</span>
                    </button>
                    </h2>
                    <div :id="id" class="accordion-collapse collapse show" data-bs-parent="#exerciseAccordion">
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
                existingExerciseRoutineNames: ["My Wed Strength Day", "Sat Cardio"],
                selectedExerciseType: null,
                selectedSetType: "Normal",
                setTypes: ["Normal", "Warm-up"]
            }
        }, 
        methods: {
            addExercise: function() {
                workoutStore.addExercise({
                    setup: this.selectedExerciseSetup, 
                    category: this.selectedNewExerciseType, 
                    routine: this.selectedExerciseRoutine
                });

                this.showAddExerciseModal = false
            },
            addWorkoutEntry: function() {
                console.log(workoutStore.addedExercises);
            }
        },
        mounted() {
            // Add comment here
            window.DragDropTouch.enable();

            // Add comment here
            [...document.querySelectorAll('[data-bs-toggle="tooltip"]')].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
        },
        updated() {
            console.log(this.inputtedLogName, this.selectedDateTime, this.inputtedBodyWeight, this.selectedUnitType, this.inputtedNotes, this.selectedExerciseSetup, this.selectedNewExerciseType, this.selectedExerciseType, this.selectedSetType);
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

    app.component("exercise-component", exerciseComponent)
        .component("set-component", setComponent);
    
    // Mount the Vue app to the #app container in the DOM
    app.mount('#app');

    // Remove the loading spinner once the Vue app has finished initializing
    loadingSpinner.remove();

    // Reveal the Vue app container after setup is complete
    vueAppContainer.classList.remove("d-none");
});