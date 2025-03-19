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

				<Icon 
					class="close-button"
					name="carbon:close-filled" 
					@click="closeModal"
				/>
            </div>

            <div class="guesses">
				<span 
					class="difficulty-badge" 
					:class="difficultyClass"
				>
					<p>{{ difficultyLabel }}</p>

					<span>|</span>
					
					<p v-if="won">
						You guessed the player in {{ guesses.length }} guesses.
					</p>
					<p v-else-if="targetPlayer">
						The player was {{ targetPlayer.name }}.
					</p>
				</span>
            </div>

            <div class="modal-body">
				<div class="player-stats" v-if="targetPlayer">
					<div class="stat-row">
						<p>Player</p>
						<h3>{{ targetPlayer.name }}</h3>
					</div>
					<div class="stat-grid">
						<div class="stat-item">
							<img 
								:src="'../images/' + targetPlayer.team + '.png'" alt=""
							>
							<p>Club</p>
						</div>

						<div class="stat-item">
							<Icon 
								v-if="countryIconMap[targetPlayer.nationality]" 
								:name="`circle-flags:${countryIconMap[targetPlayer.nationality]}`" 
							/>
							<p>Nationality</p>
						</div>
					</div>

					<div class="stat-grid">
						<div class="stat-item compact">
							<span>
								<h1 v-if="targetPlayer.position === 'Goalkeeper'">GK</h1>
								<h1 v-else-if="targetPlayer.position === 'Defender'">DF</h1>
								<h1 v-else-if="targetPlayer.position === 'Midfielder'">MF</h1>
								<h1 v-else-if="targetPlayer.position === 'Forward'">ST</h1>
							</span>
							<p>Position</p>
						</div>

						<div class="stat-item compact">
							<span>
								<h1>{{ targetPlayer.age }}</h1>
							</span>
							<p>Age</p>
						</div>

						<div class="stat-item compact">
							<span>
								<h1>{{ targetPlayer.matchesPlayed }}</h1>
							</span>
							<p>Played</p>
						</div>

						<div class="stat-item compact">
							<span>
								<h1>{{ targetPlayer.matchesStarted }}</h1>
							</span>
							<p>Started</p>
						</div>

						<div class="stat-item compact">
							<span>
								<h1>{{ targetPlayer.goalsScored }}</h1>
							</span>
							<p>Goals</p>
						</div>

						<div class="stat-item compact">
							<span>
								<h1>{{ targetPlayer.assists }}</h1>
							</span>
							<p>Assists</p>
						</div>

						<div class="stat-item compact yellow">
							<span>
								<h1>{{ targetPlayer.yellowCards }}</h1>
							</span>
							<p>Yellow's</p>
						</div>

						<div class="stat-item compact red">
							<span>
								<h1>{{ targetPlayer.redCards }}</h1>
							</span>
							<p>Red's</p>
						</div>
					</div>
				</div>

				<p class="small">Stats are accurate to end of Feb 2025, and are applicable to the 24/25 season</p>
            </div>
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
	difficulty: {
		type: Number,
		default: 1
	}
});

const emit = defineEmits(['close']);

const closeModal = () => {
    emit('close');
};

const difficultyLabel = computed(() => {
  switch (props.difficulty) {
    case 1: return 'Easy';
    case 2: return 'Medium';
    case 3: return 'Hard';
    default: return 'Unknown';
  }
});

const difficultyClass = computed(() => {
  switch (props.difficulty) {
    case 1: return 'difficulty-easy';
    case 2: return 'difficulty-medium';
    case 3: return 'difficulty-hard';
    default: return '';
  }
});

const gamesRemainingToday = computed(() => {
  const playsToday = parseInt(localStorage.getItem('playsToday') || '0');
  return Math.max(0, 3 - playsToday);
});

const difficultyNextGame = computed(() => {
  const playsToday = parseInt(localStorage.getItem('playsToday') || '0');
  
  if (playsToday === 0) return 'Easy';
  if (playsToday === 1) return 'Medium';
  return 'Hard';
});

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

    .modal-content {
        background-color: white;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        gap: 1rem;
		max-height: 80%;
		overflow: scroll;
		position: relative;
        width: 100%;

        .modal-header {
			align-items: center;
			background-color: white;
			border-bottom: 1px solid #cfcfcf;
			display: flex;
			justify-content: space-between;
			padding: 1rem;
			position: sticky;
			top: 0;
			z-index: 9999;
        }

        .guesses {
			width: 100%;

			.difficulty-badge {
				border-radius: 0;
			}
        }

        .modal-body {
            text-align: left;
			padding: 0 1rem 1rem;

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
					margin-bottom: .5rem;

					.stat-item {
						background-color: #f0f0f0;
						border: 1px solid #cfcfcf;
						border-radius: .5rem;
						display: flex;
						flex-direction: column;
						gap: .5rem;
						padding: .5rem;
						width: calc(50% - .25rem);

						&.compact {
							width: calc(25% - .375rem) !important;

							span {
								aspect-ratio: auto;
							}

							h1 {
								font-size: 2rem;
							}
						}

						&.yellow {
							background-color: #fff480;
							border: 1px solid #c1b533;

							p {
								border-top: 1px solid #c1b533;
							}
						}

						&.red {
							background-color: #ff8080;
							border: 1px solid #b84444;

							p {
								border-top: 1px solid #b84444;
							}
						}

						span {
							align-items: center;
							aspect-ratio: 1 / 1;
							display: flex;
							justify-content: center;
							height: calc(100% - 2rem);
							width: 100%;

							h1 {
								font-size: 3.5rem;
							}
						}

						p {
							border-top: 1px solid #cfcfcf;
							font-size: .75rem;
							line-height: 2rem;
							text-align: center;
						}
					}
				}
			}

			.small {
				font-size: .75rem;
				margin-top: 1rem;
			}
        }
    }
}
</style>