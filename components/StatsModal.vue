<template>
    <div v-if="stats" :class="{ 'dark': darkMode }" class="stats-modal">
        <PageHero 
            heading="Stats"
            subheading="All of your stats from previous games"
            link="/"
            linkText="Home"
        />

        <div class="modal-content">
            <div class="modal-body">
                <div class="stat-section">
                    <div class="pie-chart-container">
                        <div class="pie-chart" :style="{ background: `conic-gradient(var(--color-1) ${winPercentage}%, transparent ${winPercentage}%)` }">
                            <div class="pie-chart-inner"></div>

                            <span class="stat-value">{{ winPercentage }}%</span>
                        </div>
                    </div>

                    <div class="stat-content">
                        <p class="stat-label">Win Percentage</p>

                        <p class="caption">You have won <strong>{{ winPercentage }}% </strong>of all games you have played.</p>

                        <p class="caption">Out of <strong>{{ maxGames }}</strong> games played, you have won <strong>{{ props.stats.gamesWon }}</strong> of these.</p>
                    </div>
                </div>

                <div class="stat-bar center">
                    <p class="stat-label">Won / Lost</p>

                    <div class="progress-section">
                        <p>{{ stats.gamesWon }}</p>

                        <div class="bar-container">
                            <div class="bar-fill" :style="{ width: winPercentageSplit + '%' }"/>
                        </div>

                        <p>{{ stats.gamesLost }}</p>
                    </div>
                </div>

                <div class="difficulty-results">
                    <p>Wins by difficulty</p>

                    <div class="bar-chart-container">
                        <div class="bar-item">
                            <span class="caption">Game 1</span>
                            <div class="bar-container">
                                <div class="bar" :style="{ width: calculatePercentage(stats.easyGamesWon) + '%' }">
                                    <span class="bar-value">{{ stats.easyGamesWon }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="bar-item">
                            <span class="caption">Game 2</span>
                            <div class="bar-container">
                                <div class="bar" :style="{ width: calculatePercentage(stats.mediumGamesWon) + '%' }">
                                    <span class="bar-value">{{ stats.mediumGamesWon }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="bar-item">
                            <span class="caption">Game 3</span>
                            <div class="bar-container">
                                <div class="bar" :style="{ width: calculatePercentage(stats.hardGamesWon) + '%' }">
                                    <span class="bar-value">{{ stats.hardGamesWon }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="prev-results">
                    <span class="stat-label">Recent results</span>

                    <div class="chips">
                        <span v-for="(result, index) in stats.lastTenResults" :key="index" class="chip" :class="{ green: result === 'win', red: result === 'lose' }"></span>
                    </div>
                </div>


                <div class="stat-section">
                    <div class="stat-type minimal">
                        <div class="stat-container">
                            <span class="stat-value">{{ averageGuessesPerWin }}</span>
                        </div>

                        <p class="stat-label">Avg. guesses per win</p>
                    </div>

                    <div class="stat-type minimal">
                        <div v-if="stats.winStreak > 0" class="stat-container">
                            <span class="stat-value">+ {{ stats.winStreak }}</span>
                        </div>

                        <div v-else class="stat-container">
                            <span class="stat-value">- {{ stats.lossStreak }}</span>
                        </div>

                        <p class="stat-label">Current Streak</p>
                    </div>

                    <div class="stat-type minimal">
                        <div class="stat-container">
                            <span class="stat-value">{{ stats.maxWinStreak }}</span>
                        </div>

                        <p class="stat-label">Biggest win streak</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { defineProps, defineEmits, computed, ref, onMounted, nextTick, watch } from 'vue'; // Add watch import
import { useNuxtApp } from '#app';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import PageHero from '../components/PageHero.vue';

const props = defineProps({
    isOpen: Boolean,
    stats: Object,
    darkMode: Boolean,
    userId: String, // Add userId prop to identify the user
});

const emit = defineEmits(['close', 'nameUpdated']);

// Firebase reference
const { $firestore: db } = useNuxtApp();

// Name editing state
const isEditingName = ref(false);
const displayName = ref('');
const newDisplayName = ref('');
const nameInput = ref(null);


const totalDifficultyWins = computed(() => {
    return props.stats.easyGamesWon + props.stats.mediumGamesWon + props.stats.hardGamesWon;
});

const calculatePercentage = (wins) => {
    if (totalDifficultyWins.value === 0) return 0;
    return (wins / totalDifficultyWins.value) * 100;
};


// Initial load from localStorage as backup
onMounted(async () => {
    // First try to load from localStorage as fallback
    const savedName = localStorage.getItem('playerDisplayName');
    if (savedName) {
        displayName.value = savedName;
    }
    
    // Then try to fetch from Firebase if we have a userId
    if (props.userId) {
        await fetchDisplayName();
    }
});

// Watch for changes to isOpen and userId
watch(() => [props.isOpen, props.userId], async ([newIsOpen, newUserId]) => {
    if (newIsOpen && newUserId) {
        await fetchDisplayName();
    }
}, { immediate: true });

const fetchDisplayName = async () => {
    try {
        const userDoc = await getDoc(doc(db, "users", props.userId));
        if (userDoc.exists()) {
            const name = userDoc.data().displayName || '';
            if (name) {
                displayName.value = name;
                // Also save to localStorage as backup
                localStorage.setItem('playerDisplayName', name);
            }
        }
    } catch (error) {
        console.error("Error fetching user display name:", error);
    }
};

const closeModal = () => {
    emit('close');
};

// Rest of your computed properties remain the same
const winPercentage = computed(() => {
    if (props.stats.gamesPlayed === 0) return 0;
    return Math.round((props.stats.gamesWon / props.stats.gamesPlayed) * 100);
});

const averageGuessesPerWin = computed(() => {
    if (props.stats.guessesPerWin.length === 0) return 0;
    const totalGuesses = props.stats.guessesPerWin.reduce((sum, guesses) => sum + guesses, 0);
    return (totalGuesses / props.stats.guessesPerWin.length).toFixed(1);
});

const maxGames = computed(() => {
    return Math.max(props.stats.gamesPlayed, 1);
});

const maxStreak = computed(() => {
    return Math.max(props.stats.maxWinStreak, props.stats.maxLossStreak, 1);
});

const winPercentageSplit = computed(() => {
    const total = props.stats.gamesWon + props.stats.gamesLost;
    if (total === 0) return 0;
    return (props.stats.gamesWon / total) * 100;
});

const lossPercentageSplit = computed(() => {
    const total = props.stats.gamesWon + props.stats.gamesLost;
    if (total === 0) return 0;
    return (props.stats.gamesLost / total) * 100;
});
</script>

<style lang="scss" scoped>
    .stats-modal {
        align-items: center;
        display: flex;
        flex-direction: column;
        justify-content: center;
        height: 100%;
        left: 0;
        width: 100%;
        z-index: 1000;

        .modal-content {
            background-color: var(--background-primary);
            display: flex;
            flex-direction: column;
            gap: 1rem;
            height: 100%;
            margin-top: 1rem;
            max-width: 600px;
            width: 100%;

            .modal-body {
                padding: 0 1rem 1rem;

                .stat-section {
                    display: flex;
                    flex-direction: row;
                    flex-wrap: wrap;
                    gap: .5rem;


                    .pie-chart-container {
                        align-items: center;
                        display: flex;
                        justify-content: center;
                        flex: 1;
                        padding: .5rem;
                        position: relative;

                        .pie-chart {
                            aspect-ratio: 1 / 1;
                            width: 100%;
                            border-radius: 50%;
                            display: flex;
                            justify-content: center;
                            align-items: center;

                            .pie-chart-inner {
                                position: absolute;
                                width: 70%;
                                height: 70%;
                                background-color: var(--background-primary);
                                border-radius: 50%;
                            }

                            .stat-value {
                                font-size: 2rem;
                                font-weight: 300;
                                z-index: 10;
                            }
                        }
                    }

                    .stat-content {
                        display: flex;
                        flex: 1;
                        flex-direction: column;
                        justify-content: center;
                        gap: .5rem;
                    }

                    .stat-type {
                        background-color: var(--background-secondary);
                        border: 1px solid var(--border);
                        border-radius: var(--global-border-radius);
                        padding: .5rem;
                        text-align: center;
                        width: calc(50% - .25rem);

                        &.minimal {
                            padding: 0;
                            width: calc(33% - .26rem);

                            .stat-value {
                                font-size: 2rem !important;
                            }

                            .stat-label {
                                padding: .5rem;
                            }

                            .difficulty-badge {
                                border-radius: 0 0 var(--global-border-radius) var(--global-border-radius);
                            }
                        }

                        .stat-container {
                            align-items: center;
                            aspect-ratio: 1 / 1;
                            display: flex;
                            justify-content: center;
                            width: 100%;

                            .stat-value {
                                font-size: 3rem;
                                font-weight: 300;
                            }
                        }

                        p {
                            border-top: 1px solid var(--border);
                            font-size: .75rem;
                            padding-top: .5rem;
                        }
                    }
                }

                .stat-bar {
                    align-items: center;
                    background-color: var(--background-secondary);
                    border: 1px solid var(--border);
                    border-radius: var(--global-border-radius);
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: .75rem;
                    padding: 1rem;

                    &.center {
                        flex-direction: column;
                        margin-top: .75rem;
                    }

                    .stat-label {
                        margin-right: 1rem;
                    }

                    .progress-section {
                        display: flex;
                        flex-direction: row;
                        gap: .5rem;
                        margin-top: .5rem;
                        width: 100%;
                    }

                    .bar-container {
                        flex: 1;
                        display: flex;
                        align-items: center;
                        border-radius: var(--global-border-radius-sm);
                        background-color: var(--color-3);
                        overflow: hidden;
                        position: relative;
                        width: 100%;

                        .bar-fill {
                            background-color: var(--color-2);
                            height: 1.5rem;
                            display: flex;
                            align-items: center;
                            justify-content: flex-start;
                            position: relative;
                            z-index: 1;

                            .stat-value {
                                color: var(--text-primary);
                                font-weight: bold;
                                padding-left: 8px;
                            }
                        }
                    }
                }

                .difficulty-results {
                    margin: 2rem 0;
                    padding: 0 1rem;
                    text-align: left; 

                    p {
                        padding-bottom: 1rem;
                    }

                    .bar-chart-container {
                        display: flex;
                        flex-direction: column;

                        .bar-item {
                            align-items: center;
                            display: flex;

                            .caption {
                                border-right: 3px solid var(--color-1);
                                padding: .25rem 0;
                                width: 30%; 
                            }

                            .bar-container {
                                width: 70%;
                            }

                            .bar {
                                background-color: var(--color-1);
                                border-radius: 0 var(--global-border-radius-sm) var(--global-border-radius-sm) 0;
                                height: 1rem;
                                display: flex;
                                align-items: center;
                                justify-content: flex-start;
                                position: relative;

                                .bar-value {
                                    color: var(--text-primary);
                                    font-size: .75rem;
                                    padding-left: .25rem;
                                }
                            }
                        }
                    }
                }

                .prev-results {
                    align-items: center;
                    background-color: var(--background-secondary);
                    border: 1px solid var(--border);
                    border-radius: var(--global-border-radius);
                    display: flex;
                    flex-direction: column;
                    gap: .5rem;
                    justify-content: center;
                    margin: 1rem auto;
                    padding: 1rem;

                    .chips {
                        display: flex;
                        gap: .5rem;

                        .chip {
                            border-radius: var(--global-border-radius-sm);
                            display: inline-block;
                            height: 1.5rem;
                            width: .75rem;

                            &.green {
                                background-color: var(--color-2);
                            }

                            &.red {
                                background-color: var(--color-3);
                            }
                        }
                    }
                }
            }
        }
    }
</style>