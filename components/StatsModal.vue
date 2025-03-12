<template>
    <div v-if="isOpen" :class="{ 'dark': darkMode }" class="stats-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Your Stats</h3>
					
                <Icon 
                    class="close-button"
                    name="carbon:close-filled" 
                    @click="closeModal"
                />
            </div>
            <div class="modal-body">
                <div class="stat-section">
                    <div class="stat-type">
                        <div class="stat-container">
                            <span class="stat-value">{{ maxGames }}</span>
                        </div>

                        <p class="stat-label">Games played</p>
                    </div>
                    
                    <div class="stat-type">
                        <div class="pie-chart-container">
                            <div class="pie-chart" :style="{ background: `conic-gradient(#88bd8a ${winPercentage}%, transparent ${winPercentage}%)` }">
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

                <!-- temp hidden as not working on mobile -->
                <!-- <div class="prev-results">
                    <span class="stat-label">Recent results</span>

                    <div class="chips">
                        <span v-for="(result, index) in stats.lastTenResults" :key="index" class="chip" :class="{ green: result === 'win', red: result === 'lose' }"></span>
                    </div>
                </div> -->
            </div>
        </div>
    </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
    isOpen: Boolean,
    stats: Object,
    darkMode: Boolean,
});

const emit = defineEmits(['close']);

const closeModal = () => {
    emit('close');
};

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
    return Math.max(props.stats.gamesPlayed, 1); // Ensure it's not zero
});

const maxStreak = computed(() => {
    return Math.max(props.stats.maxWinStreak, props.stats.maxLossStreak, 1); // Ensure it's not zero
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
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    height: 100%;
    left: 0;
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 1000;

    &.dark {
        background-color: rgba(50, 50, 50, 0.5);

        .modal-content {
            background-color: #1f1f1f;
            color: #e2e2e2;

            .modal-header {
                .close-button {
                    color: #aeaeae;
                }
            }
        }
    }

    .modal-content {
        background-color: white;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1.25rem;
        width: 100%;
        max-width: 600px;

        .modal-header {
            align-items: center;
            display: flex;
            justify-content: space-between;

            .close-button {
                border: none;
                color: #292929;
                cursor: pointer;
                font-size: 1.75rem;
            }
        }

        .modal-body {
            .stat-section {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                gap: .5rem;

                .stat-type {
                    background-color: #f0f0f0;
                    border: 1px solid #cfcfcf;
                    padding: .5rem;
                    text-align: center;
                    width: calc(50% - .25rem);

                    &.minimal {
                        width: calc(25% - .375rem);

                        .stat-value {
                            font-size: 2rem !important;
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
                        width: 100%;
                        position: relative;
                        display: flex;
                        justify-content: center;
                        align-items: center;
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
                            width: 70%;
                            height: 70%;
                            background-color: #f0f0f0;
                            border-radius: 50%;
                        }

                        .stat-value {
                            font-size: 2.5rem;
                            font-weight: 300;
                            z-index: 10;
                        }
                    }

                    p {
                        border-top: 1px solid #cfcfcf;
                        font-size: .75rem;
                        padding-top: .5rem;
                    }
                }
            }

            .stat-bar {
                align-items: center;
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.75rem;

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
                    background-color: #d24f4f; /* Dark background */
                    overflow: hidden;
                    position: relative;
                    width: 100%;

                    .bar-fill {
                        background-color: #88bd8a; /* Yellow fill */
                        height: 24px;
                        display: flex;
                        align-items: center;
                        justify-content: flex-start;
                        position: relative;
                        z-index: 1;

                        .stat-value {
                            color: black;
                            font-weight: bold;
                            padding-left: 8px;
                        }
                    }

                    .max-value {
                        color: white;
                        padding-right: 8px;
                        position: absolute;
                        right: 0;
                        z-index: 2;
                    }
                }
            }

            .prev-results {
                align-items: center;
                display: flex;
                flex-direction: column;
                gap: .5rem;
                justify-content: center;
                margin-top: 1rem;

                .stat-label {
                    margin-right: 1rem;
                }

                .chips {
                    display: flex;
                    gap: .5rem;

                    .chip {
                        width: .75rem;
                        height: 1.5rem;
                        display: inline-block;

                        &.green {
                            background-color: #88bd8a;
                        }

                        &.red {
                            background-color: #d24f4f;
                        }
                    }
                }
            }
        }
    }
}
</style>