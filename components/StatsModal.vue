<template>
    <div v-if="isOpen" :class="{ 'dark': darkMode }" class="stats-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Your Stats</h3>
                <button @click="closeModal" class="close-button">×</button>
            </div>
            <div class="modal-body">
                <div class="stat-item">
                    <p>Total Games Played: {{ stats.gamesPlayed }}</p>
                </div>
                <div class="stat-item">
                    <p>Total Games Won: {{ stats.gamesWon }}</p>
                </div>
                <div class="stat-item">
                    <p>Total Games Lost: {{ stats.gamesLost }}</p>
                </div>
                <div class="stat-item">
                    <p>Win Percentage: {{ winPercentage }}%</p>
                </div>
                <div class="stat-item">
                    <p>Average Guesses Per Win: {{ averageGuessesPerWin }}</p>
                </div>
                <div class="stat-item">
                    <p>Win Streak: {{ stats.winStreak }}</p>
                </div>
                <div class="stat-item">
                    <p>Max Win Streak: {{ stats.maxWinStreak }}</p>
                </div>
                <div class="stat-item">
                    <p>Loss Streak: {{ stats.lossStreak }}</p>
                </div>
                <div class="stat-item">
                    <p>Max Loss Streak: {{ stats.maxLossStreak }}</p>
                </div>
                <div class="stat-item" v-if="stats.gamesPlayed >= 10">
                    <p>Most Guessed Player: {{ stats.mostGuessedPlayer.name }} ({{ stats.mostGuessedPlayer.count }} times)</p>
                </div>
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
</script>
  
<style lang="scss" scoped>
/* StatsModal.vue styles */
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
            text-align: left;

            .stat-item {
                margin-bottom: 0.5rem;
            }
        }
    }
}
  </style>