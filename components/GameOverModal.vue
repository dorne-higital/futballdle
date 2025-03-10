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

                <button @click="closeModal" class="close-button">×</button>
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
				<div class="player-stats" v-if="targetPlayer">
					<div class="stat-row">
						<p>Player</p>
						<h3>{{ targetPlayer.name }}</h3>
					</div>
					<div class="stat-grid">
						<div class="stat-item">
							<Icon 
								v-if="countryIconMap[targetPlayer.nationality]" 
								:name="`circle-flags:${countryIconMap[targetPlayer.nationality]}`" 
							/>
							<p>Nationality</p>
						</div>
						<div class="stat-item">
							<Icon 
								v-if="countryIconMap[targetPlayer.nationality]" 
								:name="`circle-flags:${countryIconMap[targetPlayer.nationality]}`" 
							/>
							<p>Nationality</p>
						</div>
					</div>
				</div>
                <div class="player-details" v-if="targetPlayer">
                    <div class="detail-item">
                        <strong>Name:</strong> {{ targetPlayer.name }}
                    </div>
                    <div class="detail-item">
                         {{ targetPlayer.nationality }}
					
						<Icon 
							v-if="countryIconMap[targetPlayer.nationality]" 
							:name="`circle-flags:${countryIconMap[targetPlayer.nationality]}`" 
						/>
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

const countryIconMap = {
    'Albania': 'al',
    'Algeria': 'dz',
    'Argentina': 'ar',
    'Australia': 'au',
    'Belgium': 'be',
    'Brazil': 'br',
    'Burkina Faso': 'bf',
    'Cameroon': 'cm',
    'Chile': 'cl',
    'Colombia': 'co',
    'Cote d\'Ivoire': 'ci',
    'Croatia': 'hr',
    'Czech Republic': 'cz',
    'Democratic Republic of Congo': 'cd',
    'Denmark': 'dk',
    'Ecuador': 'ec',
    'Egypt': 'eg',
    'England': 'gb-eng',
    'France': 'fr',
    'Gabon': 'ga',
    'Gambia': 'gm',
    'Germany': 'de',
    'Ghana': 'gh',
    'Greece': 'gr',
    'Guinea-Bissau': 'gw',
    'Hungary': 'hu',
    'Iraq': 'iq',
    'Italy': 'it',
    'Jamaica': 'jm',
    'Japan': 'jp',
    'Kosovo': 'xk',
    'Mali': 'ml',
    'Mexico': 'mx',
    'Morocco': 'ma',
    'Netherlands': 'nl',
    'New Zealand': 'nz',
    'Nigeria': 'ng',
    'Northern Ireland': 'gb-nir',
    'Norway': 'no',
    'Paraguay': 'py',
    'Poland': 'pl',
    'Portugal': 'pt',
    'Republic of Ireland': 'ie',
    'Romania': 'ro',
    'Scotland': 'gb-sct',
    'Senegal': 'sn',
    'Serbia': 'rs',
    'Slovakia': 'sk',
    'South Korea': 'kr',
    'Spain': 'es',
    'Sweden': 'se',
    'Switzerland': 'ch',
    'Turkey': 'tr',
    'Ukraine': 'ua',
    'Uruguay': 'uy',
    'USA': 'us',
    'Wales': 'gb-wls',
    'Zambia': 'zm',
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

			.player-stats {
				display: flex;
				flex-direction: column;

				.stat-row {
					display: flex;
					flex-direction: row;
					justify-content: space-between;
					margin-bottom: .5rem;
				}

				.stat-grid {
					display: flex;
					flex-direction: row;
					flex-wrap: wrap;
					gap: .5rem;

					.stat-item {
						background-color: #f0f0f0;
						border: 1px solid #cfcfcf;
						padding: .5rem;						
						width: calc(50% - .25rem);

						span {
							aspect-ratio: 1 / 1;
							height: calc(100% - 2rem);
							width: 100%;
						}

						p {
							border-top: 1px solid #cfcfcf;;
							line-height: 2rem;
							text-align: center;
						}
					}
				}
			}

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