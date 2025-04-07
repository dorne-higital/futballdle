<template>
    <div v-if="isOpen" :class="{ 'dark': darkMode }" class="game-over-modal">
        <PageHero 
			v-if="won"
            :heading="winMessage"
			:subheading="'You won ' + difficultyLabel + ' in ' + guesses.length + ' / 6'"
			theme="win"
        />

        <PageHero 
			v-else-if="!won"
            :heading="loseMessage"
			:subheading="'You failed ' + difficultyLabel + ' this time'"
			theme="lose"
        />

        <div class="modal-content">
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
					</div>

					<div class="stat-container">
						<span class="label">Stats</span>

						<span class="section">
							<p class="caption">Games Started</p>

							<p>{{ targetPlayer.matchesStarted }}</p>
						</span>
						<span class="section">
							<p class="caption">Goals</p>

							<p>{{ targetPlayer.goalsScored }}</p>
						</span>
						<span class="section">
							<p class="caption">Assists</p>

							<p>{{ targetPlayer.assists }}</p>
						</span>
						<span class="section">
							<p class="caption">xG</p>

							<p>{{ targetPlayer.expectedGoals }}</p>
						</span>

						<HeadingSeparator text="Cards"/>

						<span class="section">
							<p class="caption">Yellows</p>

							<p>{{ targetPlayer.yellowCards }}</p>
						</span>
						<span class="section">
							<p class="caption">Reds</p>

							<p>{{ targetPlayer.redCards }}</p>
						</span>
					</div>

					<nuxt-link 
						class="button primary full"
						@click="closeModal"
					>
						Back to game
					</nuxt-link>
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
			case 1: return 'Game 1';
			case 2: return 'Game 2';
			case 3: return 'Game 3';
			default: return 'Unknown';
		}
	});

	const winMessage = computed(() => {
		return winMessages[Math.floor(Math.random() * winMessages.length)];
	});

	const loseMessage = computed(() => {
		return loseMessages[Math.floor(Math.random() * loseMessages.length)];
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
		background-color: var(--background-primary);
		display: flex;
		flex-direction: column;
		height: 100%;
		justify-content: center;
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
			max-width: 600px;
			overflow: scroll;
			padding: 1rem 0;
			position: relative;
			width: 100%;

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
							background-color: var(--background-secondary);
							border: 1px solid var(--border);
							border-radius: var(--global-border-radius);
							display: flex;
							flex-direction: column;
							padding: .5rem;
							width: calc(50% - .25rem);

							&.compact {
								width: calc(33% - .26rem) !important;

								span {
									aspect-ratio: auto;
									display: flex;
									flex-direction: column;
								}

								h1 {
									font-size: 2rem;
								}
							}

							span {
								align-items: center;
								aspect-ratio: 1 / 1;
								border-bottom: 1px solid var(--border);
								display: flex;
								justify-content: center;
								height: calc(100% - 2rem);
								padding: .5rem .25rem;
								width: 100%;

								h1 {
									font-size: 3.5rem;
								}
							}

							p {
								font-size: .75rem;
								line-height: 2rem;
								text-align: center;
							}
						}
					}

					.stat-container {
						border: 1px solid var(--border);
						border-radius: var(--global-border-radius);
						margin: 1rem 0;
						padding: 1rem;
						position: relative;
						width: 100%;

						.section {
							display: flex;
							flex-direction: row;
							justify-content: space-between;
							padding: .25rem 0;
						}
						
						.label {
							position: absolute;
							top: 0;
							left: 50%;
							transform: translate(-50%, -50%);
							background-color: var(--background-primary);
							padding: 0 .75rem;
							text-transform: uppercase;
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