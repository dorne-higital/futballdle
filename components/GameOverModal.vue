<template>
    <div v-if="isOpen" :class="{ 'dark': darkMode }" class="game-over-modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 v-if="won">
                    {{ winMessage }}
                </h2>
                <h2 v-else-if="alreadyPlayed">
                    {{ alreadyPlayedMessage }}
                </h2>
                <h2 v-else>
                    {{ loseMessage }}
                </h2>
                <p v-if="alreadyPlayed && gameOver">
                    You have reached your daily play limit.
                </p>

                <Icon class="close-button" name="carbon:close-filled" @click="closeModal" />
            </div>

            <div class="guesses">
                <p v-if="won">
                    You guessed the player in {{ guesses.length }} guesses.
                </p>
                <p v-else-if="targetPlayer">
                    The player was {{ targetPlayer.name }}.
                </p>
            </div>

            <div class="modal-body">
                <div class="player-details" v-if="targetPlayer">
                    <div class="detail-item">
                        <strong>Name:</strong> {{ targetPlayer.name }}
                    </div>
                    <div class="detail-item">
                        <strong>Nationality:</strong> {{ targetPlayer.nationality }}
                    </div>
                    <div class="detail-item">
                        <strong>Position:</strong> {{ targetPlayer.position }}
                    </div>
                    <div class="detail-item">
                        <strong>Team:</strong> {{ targetPlayer.team }}
                    </div>
                    <div class="detail-item">
                        <strong>Age:</strong> {{ targetPlayer.age }}
                    </div>
                    <div class="detail-item">
                        <strong>Year Born:</strong> {{ targetPlayer.yearBorn }}
                    </div>
                    <div class="detail-item">
                        <strong>Matches Played:</strong> {{ targetPlayer.matchesPlayed }}
                    </div>
                    <div class="detail-item">
                        <strong>Matches Started:</strong> {{ targetPlayer.matchesStarted }}
                    </div>
                    <div class="detail-item">
                        <strong>Minutes Played:</strong> {{ targetPlayer.minutesPlayed }}
                    </div>
                    <div class="detail-item">
                        <strong>Goals Scored:</strong> {{ targetPlayer.goalsScored }}
                    </div>
                    <div class="detail-item">
                        <strong>Assists:</strong> {{ targetPlayer.assists }}
                    </div>
                    <div class="detail-item">
                        <strong>Goals + Assists:</strong> {{ targetPlayer.goalsAndAssists }}
                    </div>
                    <div class="detail-item">
                        <strong>Yellow Cards:</strong> {{ targetPlayer.yellowCards }}
                    </div>
                    <div class="detail-item">
                        <strong>Red Cards:</strong> {{ targetPlayer.redCards }}
                    </div>
                    <div class="detail-item">
                        <strong>Expected Goals:</strong> {{ targetPlayer.expectedGoals }}
                    </div>
                </div>
                <div v-if="alreadyPlayed && gameOver && gameSummaries.length > 0">
                    <h3>Last 3 Games:</h3>
                    <div v-for="(summary, index) in gameSummaries" :key="index">
                        <p v-if="summary.won">Won: {{ summary.targetPlayer.name }}</p>
                        <p v-else>Lost: {{ summary.targetPlayer.name }}</p>
                        <p>Guesses: {{ summary.guesses.join(', ') }}</p>
                    </div>
                </div>
            </div>
            <button @click="resetPlays">Reset Plays (Testing Only)</button>
        </div>
    </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';
import { winMessages, loseMessages, alreadyPlayedMessages } from '~/stores/messages';
import { ref, onMounted } from 'vue';

const props = defineProps({
    isOpen: Boolean,
    won: Boolean,
    targetPlayer: Object,
    guesses: Array,
    alreadyPlayed: Boolean,
    darkMode: Boolean,
});

const emit = defineEmits(['close']);

const closeModal = () => {
    emit('close');
};

const winMessage = computed(() => {
    return winMessages[Math.floor(Math.random() * winMessages.length)];
});

const loseMessage = computed(() => {
    return loseMessages[Math.floor(Math.random() * loseMessages.length)];
});

const alreadyPlayedMessage = computed(() => {
    return alreadyPlayedMessages[Math.floor(Math.random() * alreadyPlayedMessages.length)];
});

const gameSummaries = ref([]);

onMounted(() => {
    if (props.alreadyPlayed && props.gameOver) {
        gameSummaries.value = JSON.parse(localStorage.getItem('gameSummaries') || '[]');
    }
});

const resetPlays = () => {
    localStorage.setItem('playsToday', '0');
    checkDailyPlay();
};
</script>

<style lang="scss" scoped>
.game-over-modal {
    align-items: center;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    height: 100%;
    justify-content: center;
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

        .guesses {
            text-align: center;
        }

        .modal-body {
            text-align: left;

            .player-details {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;

                .detail-item {
                    display: flex;
                    justify-content: space-between;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 0.5rem;
                }
            }
        }
    }
}
</style>