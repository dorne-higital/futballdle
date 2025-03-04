<template>
	<div 
		v-if="isOpen" 
		:class="{ 'dark': isDarkMode }"
		class="game-over-modal"
	>
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
					
				<Icon 
					class="close-button"
					name="carbon:close-filled" 
					@click="closeModal"
				/>
			</div>

			<div class="guesses">
				<p v-if="guesses.length < 3">Damn, got it in {{ guesses.length }}! Champions league incoming!</p>
				<p v-else-if="guesses.length < 5">Not too shabby, {{ guesses.length }}/6 isn't the worst!</p>
				<p v-else-if="guesses.length === 5">Wow, got it in {{ guesses.length }}? Relegation prending...</p>
				<p v-else>{{ guesses.length }}... Need I say anything?</p>
			</div>

			<div class="modal-body">
				<div v-if="won || !won">
					<div 
						v-if="playerStats"
						class="stats"
					>
						<span>
							<img 
								:src="playerStats.photo"
							/>
						</span>
						<span class="stat-item">
							<p>Name: </p>

							<p>{{ playerStats.name }}</p>
						</span>
						<span class="stat-item">
							<p>Age: </p>

							<p>{{ playerStats.age }}</p>
						</span>
						<span class="stat-item">
							<p>Nationality: </p>

							<p>{{ playerStats.nationality }}</p>
						</span>
					</div>
					
					<p v-else>Loading player stats...</p>
				</div>
			</div>
		</div>
	</div>
</template>
  
<script setup>
	import { defineProps, defineEmits, computed, ref, onMounted } from 'vue';
	import { winMessages, loseMessages, alreadyPlayedMessages } from '~/stores/messages';
	import axios from 'axios'; // Import axios
  
	const props = defineProps({
		isOpen: Boolean,
		won: Boolean,
		targetPlayer: String,
		playerDetails: Object,
		guesses: Array,
		alreadyPlayed: Boolean,
	});
  
	const emit = defineEmits(['close']);

	const isDarkMode = ref(false);
	
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
  
	const playerStats = ref(null);
  
	onMounted(async () => {
		try {
			const playerName = props.targetPlayer; // Use the target player name
			const apiKey = '0981ac1cc5bffb4fa9188196532df9b5';
			const response = await axios.get('https://v3.football.api-sports.io/players/profiles', {
				headers: {
				'x-rapidapi-key': apiKey,
				'x-rapidapi-host': 'v3.football.api-sports.io',
				},
				params: {
				search: playerName,
				},
			});

			console.log("details........", response);
		
			if (response.data.response && response.data.response.length > 0) {
				playerStats.value = response.data.response[0].player;

				console.log("player........", playerStats.value);
			} else {
				console.error('Player stats not found.');
			}
		} catch (error) {
			console.error('Error fetching player stats:', error);
		}

		const storedDarkMode = localStorage.getItem('darkMode');
		if (storedDarkMode === 'true') {
			isDarkMode.value = true;
		}
	});
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

				.modal-header{
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
				text-align: left;
			}

			.modal-body {
				text-align: center;

				.stats {
					display: flex;
					flex-direction: column;
					gap: .5rem;

					.stat-item {
						display: flex;
						justify-content: space-between;
						width: 100%;
					}
				}
			}
		}
	}
</style>