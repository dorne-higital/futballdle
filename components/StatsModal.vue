<template>
    <div v-if="isOpen && stats" :class="{ 'dark': darkMode }" class="stats-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h1>Your Stats</h1>
                    
                <Icon 
                    class="close-button"
                    name="carbon:close-filled" 
                    @click="closeModal"
                />
            </div>
            
            <div class="modal-body">
                <div class="stat-section">
                    <p v-if="displayName" class="">Hey {{ displayName }}! Check out your stats below!</p>

                    <div class="stat-type">
                        <div class="stat-container">
                            <span class="stat-value">{{ maxGames }}</span>
                        </div>

                        <p class="stat-label">Games played</p>
                    </div>
                    
                    <div class="stat-type">
                        <div class="pie-chart-container">
                            <div class="pie-chart" :style="{ background: `conic-gradient(var(--color-easy) ${winPercentage}%, transparent ${winPercentage}%)` }">
                                <div class="pie-chart-inner"></div>

                                <span class="stat-value">{{ winPercentage }}%</span>
                            </div>
                        </div>

                        <p class="stat-label">Win percentage</p>
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

                <div class="stat-section">
                    <div v-if="stats.winStreak > 0" class="stat-type minimal">
                        <div class="stat-container">
                            <span class="stat-value">{{ stats.winStreak }}</span>
                        </div>

                        <p class="stat-label">Winning run</p>
                    </div>

                    <div v-else class="stat-type minimal">
                        <div class="stat-container">
                            <span class="stat-value">{{ stats.lossStreak }}</span>
                        </div>

                        <p class="stat-label">Losing streak</p>
                    </div>

                    <div class="stat-type minimal">
                        <div class="stat-container">
                            <span class="stat-value">{{ stats.maxWinStreak }}</span>
                        </div>

                        <p class="stat-label">Biggest win streak</p>
                    </div>

                    <div class="stat-type minimal">
                        <div class="stat-container">
                            <span class="stat-value">{{ stats.maxLossStreak }}</span>
                        </div>

                        <p class="stat-label">Longest losing streak</p>
                    </div>

                    <div class="stat-type minimal">
                        <div class="stat-container">
                            <span class="stat-value">{{ averageGuessesPerWin }}</span>
                        </div>

                        <p class="stat-label">Avg. guesses per win</p>
                    </div>
                </div>

                <div class="prev-results">
                    <span class="stat-label">Recent results</span>

                    <div class="chips">
                        <span v-for="(result, index) in stats.lastTenResults" :key="index" class="chip" :class="{ green: result === 'win', red: result === 'lose' }"></span>
                    </div>
                </div>

                <div class="difficulty-results">
                    <p>Wins by difficulty</p>

                    <div class="stat-section">
                        <div class="stat-type minimal">
                            <div class="stat-container">
                                <span class="stat-value">{{ stats.easyGamesWon }}</span>
                            </div>

                            <p class="stat-label difficulty-badge difficulty-easy">Easy</p>
                        </div>

                        <div class="stat-type minimal">
                            <div class="stat-container">
                                <span class="stat-value">{{ stats.mediumGamesWon }}</span>
                            </div>

                            <p class="stat-label difficulty-badge difficulty-medium">Medium</p>
                        </div>

                        <div class="stat-type minimal">
                            <div class="stat-container">
                                <span class="stat-value">{{ stats.hardGamesWon }}</span>
                            </div>

                            <p class="stat-label difficulty-badge difficulty-hard">Hard</p>
                        </div>

                        <div class="stat-type minimal">
                            <div class="stat-container">
                                <span class="stat-value">{{ stats.totalPoints }}</span>
                            </div>

                            <p class="stat-label">Points</p>
                        </div>
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
        background-color: var(--background-primary);
        display: flex;
        justify-content: center;
        height: 100%;
        left: 0;
        position: fixed;
        top: 0;
        width: 100%;
        z-index: 1000;

        .modal-content {
            background-color: var(--background-primary);
            display: flex;
            flex-direction: column;
            gap: 1rem;
            height: 100%;
            overflow: scroll;
            position: absolute;
            top: 0;
            max-width: 600px;
            width: 100%;

            .modal-header {
                align-items: center;
                background-color: var(--background-primary);
                border-bottom: 1px solid var(--background-secondary);
                box-shadow: 0px 0px 15px 0px var(--background-secondary);
                display: flex;
                justify-content: space-between;
                padding: 1rem;
                position: sticky;
                top: 0;
                z-index: 9999;
            }

            .modal-body {
                padding: 0 1rem 1rem;

                .stat-section {
                    display: flex;
                    flex-direction: row;
                    flex-wrap: wrap;
                    gap: .5rem;

                    .stat-type {
                        background-color: var(--background-secondary);
                        border: 1px solid var(--border);
                        border-radius: var(--global-border-radius);
                        padding: .5rem;
                        text-align: center;
                        width: calc(50% - .25rem);

                        &.minimal {
                            padding: 0;
                            width: calc(25% - .375rem);

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

                        .pie-chart-container {
                            align-items: center;
                            display: flex;
                            justify-content: center;
                            padding: .5rem;
                            position: relative;
                            width: 100%;
                        }

                        .pie-chart {
                            aspect-ratio: 1 / 1;
                            width: 100%;
                            border-radius: 50%;
                            display: flex;
                            justify-content: center;
                            align-items: center;

                            .pie-chart-inner {
                                position: absolute;
                                width: 65%;
                                height: 65%;
                                background-color: var(--background-secondary);
                                border-radius: 50%;
                            }

                            .stat-value {
                                font-size: 2rem;
                                font-weight: 300;
                                z-index: 10;
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
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: .75rem;

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
                        background-color: var(--danger);
                        overflow: hidden;
                        position: relative;
                        width: 100%;

                        .bar-fill {
                            background-color: var(--color-easy);
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

                .prev-results {
                    align-items: center;
                    display: flex;
                    flex-direction: column;
                    gap: .5rem;
                    justify-content: center;
                    margin: 1rem auto;

                    .chips {
                        display: flex;
                        gap: .5rem;

                        .chip {
                            border-radius: var(--global-border-radius-sm);
                            display: inline-block;
                            height: 1.5rem;
                            width: .75rem;

                            &.green {
                                background-color: var(--color-easy);
                            }

                            &.red {
                                background-color: var(--danger);
                            }
                        }
                    }
                }

                .difficulty-results {
                    display: flex;
                    flex-direction: column;
                    gap: .5rem;
                    margin-top: 1rem;
                    text-align: center;
                }
            }
        }
    }
</style>