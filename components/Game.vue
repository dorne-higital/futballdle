<template>
	<div 
		:class="{ 'dark': darkMode }"
		class="game"
	>
		<div class="guess-grid">
			<div 
				v-for="(guess, guessIndex) in guesses" 
				:key="guessIndex" 
				class="guess-row"
			>
				<div 
					v-for="(letter, letterIndex) in guess" 
					:key="letterIndex" 
					:class="letterClasses[guessIndex][letterIndex]"
					class="letter-box" 
				>
					<p>{{ letter }}</p>
				</div>

				<div 
					v-for="n in 5 - (guesses[guessIndex] ? guesses[guessIndex].length : 0)"
					:key="`empty-${guessIndex}-${n}`" 
					class="letter-box"
				/>
			</div>

			<div 
				v-for="n in 6 - guesses.length" 
				:key="`empty-guess-row-${n}`" 
				class="guess-row"
			>
				<div 
					v-for="n2 in 5" 
					:key="`empty-letter-${n}-${n2}`" 
					class="letter-box"
				>
					<p>{{ n === 1 && currentGuess[n2 - 1] ? currentGuess[n2 - 1] : '' }}</p>
				</div>
			</div>
		</div>

		<Keyboard 
			:darkMode="darkMode"
			:disabledKeys="disabledKeys" 
			:letterStates="letterStates"
			@key-press="handleKeyboardKeyPress" 
		/>

		<GameOverModal
			:darkMode="isDarkMode"
			:isOpen="isGameOverModalOpen"
			:won="won"
			:targetPlayer="targetPlayer"
			:playerDetails="playerDetails"
			:guesses="guesses"
			:alreadyPlayed="alreadyPlayed"
			@close="closeGameOverModal"
		/>

		<InfoModal 
			:darkMode="isDarkMode"
			:isOpen="isInfoModalOpen" 
			@close="closeInfoModal" 
		/>
	</div>
</template>
  
  
<script setup>
	import { ref, computed, onMounted, defineEmits, onUnmounted } from 'vue';
	import { usePlayerStore } from '~/stores/players';
	import Keyboard from './Keyboard.vue';
	import GameOverModal from './GameOverModal.vue';
	import InfoModal from './InfoModal.vue'; 

	const props = defineProps({
        darkMode: {
            type: Boolean,
            default: false,
        },
	});

	const emit = defineEmits(['stats-updated']);

	const playerStore = usePlayerStore();
	const targetPlayer = playerStore.getRandomPlayer;
	const playerDetails = playerStore.getPlayerDetails(targetPlayer);

	const guesses = ref([]);
	const currentGuess = ref('');
	const gameOver = ref(false);
	const won = ref(false);
	const letterClasses = ref(Array(6).fill(Array(5).fill('')));
	const disabledKeys = ref([]);
	const stats = ref({
		gamesPlayed: 0,
		gamesWon: 0,
		winStreak: 0,
		maxWinStreak: 0,
	});
	const letterStates = ref({});
  
	const isGameOverModalOpen = ref(false);
	const alreadyPlayed = ref(false);
	const isInfoModalOpen = ref(false);
  
	onMounted(() => {
		loadStats();
		checkDailyPlay();
		window.addEventListener('keydown', handleDesktopKeyPress);
	});
  
	onUnmounted(() => {
		window.removeEventListener('keydown', handleDesktopKeyPress);
	});
  
	const checkDailyPlay = () => {
		const lastPlayed = localStorage.getItem('lastPlayed');
		const today = new Date().toISOString().slice(0, 10);

		if (lastPlayed !== today) {
			// New day, reset the game
			guesses.value = [];
			currentGuess.value = '';
			gameOver.value = false;
			won.value = false;
			letterClasses.value = Array(6).fill(Array(5).fill(''));
			disabledKeys.value = [];
			alreadyPlayed.value = false;
			isGameOverModalOpen.value = false;
			saveGameData(); // Save the reset game data
			localStorage.setItem('lastPlayed', today); // Update last played date
		} else {
			// Same day, load the game state
			gameOver.value = true;
			alreadyPlayed.value = true;
			isGameOverModalOpen.value = true;
			try {
				guesses.value = JSON.parse(localStorage.getItem('guesses')) || [];
				won.value = JSON.parse(localStorage.getItem('won')) || false;
				letterClasses.value = JSON.parse(localStorage.getItem('letterClasses')) || Array(6).fill(Array(5).fill(''));
			} catch (e) {
				console.error('Error parsing local storage data:', e);
				guesses.value = [];
				won.value = false;
				letterClasses.value = Array(6).fill(Array(5).fill(''));
			}
		}
	};

	const saveGameData = () => {
		const today = new Date().toISOString().slice(0, 10);
		localStorage.setItem('lastPlayed', today);
		localStorage.setItem('guesses', JSON.stringify(guesses.value));
		localStorage.setItem('won', JSON.stringify(won.value));
		localStorage.setItem('letterClasses', JSON.stringify(letterClasses.value));
	};

	const updateLetterStates = () => {
		const newLetterStates = {};
		guesses.value.forEach((guess, guessIndex) => {
			guess.forEach((letter, letterIndex) => {
				if (letterClasses.value[guessIndex][letterIndex] === 'correct') {
					newLetterStates[letter] = 'correct';
				} else if (letterClasses.value[guessIndex][letterIndex] === 'present' && newLetterStates[letter] !== 'correct') {
					newLetterStates[letter] = 'present';
				} else if (letterClasses.value[guessIndex][letterIndex] === 'absent' && newLetterStates[letter] !== 'correct' && newLetterStates[letter] !== 'present') {
					newLetterStates[letter] = 'absent';
				}
			});
		});
		letterStates.value = newLetterStates;
	};

	const updateLetterClasses = (guessIndex, guess) => {
		letterClasses.value[guessIndex] = guess.map((letter, letterIndex) => {
			if (letter === targetPlayer[letterIndex]) {
				return 'correct';
			} else if (targetPlayer.includes(letter)) {
				return 'present';
			} else {
				return 'absent';
			}
		});

		updateLetterStates();
	};

	const handleGuess = () => {
		if (currentGuess.value.length !== 5) return;
		
		const guess = currentGuess.value.toUpperCase();
		guesses.value.push(guess.split(''));
		currentGuess.value = '';
		updateLetterClasses(guesses.value.length - 1, guess.split(''));

		if (guess === targetPlayer) {
			won.value = true;
			gameOver.value = true;
			isGameOverModalOpen.value = true;
			updateStats(true);
		} else if (guesses.value.length === 6) {
			gameOver.value = true;
			isGameOverModalOpen.value = true;
			updateStats(false);
		}
		saveGameData();
		updateLetterStates();
	};

	const loadStats = () => {
		try {
			const storedStats = JSON.parse(localStorage.getItem('stats'));

			if (storedStats) {
				stats.value = storedStats;
			}
		} catch (e) {
			console.error('Error parsing stats:', e);
		}
	};
  
	const saveStats = () => {
		localStorage.setItem('stats', JSON.stringify(stats.value));
	};
  
  
	const updateStats = (gameWon) => {
		stats.value.gamesPlayed++;

		if (gameWon) {
			stats.value.gamesWon++;
			stats.value.winStreak++;

			if (stats.value.winStreak > stats.value.maxWinStreak) {
				stats.value.maxWinStreak = stats.value.winStreak;
			}
		} else {
			stats.value.winStreak = 0;
		}

		saveStats();
		emit('stats-updated');
	};
  
  
	const handleKeyboardKeyPress = (key) => {
		if (gameOver.value) return;

		if (key === 'ENTER') {
			handleGuess();
		} else if (key === 'BACK') {
			currentGuess.value = currentGuess.value.slice(0, -1);
		} else if (currentGuess.value.length < 5) {
			currentGuess.value += key;
		}
	};
  
	const handleDesktopKeyPress = (event) => {
		if (gameOver.value) return;

		const key = event.key.toUpperCase();

		if (key === 'ENTER') {
			handleGuess();
		} else if (key === 'BACKSPACE') {
			currentGuess.value = currentGuess.value.slice(0, -1);
		} else if (/^[A-Z]$/.test(key) && currentGuess.value.length < 5) {
			currentGuess.value += key;
		}
	};
  
	const closeGameOverModal = () => {
		isGameOverModalOpen.value = false;
	};

	const closeInfoModal = () => {
		isInfoModalOpen.value = false;
	};
</script>
  
  
<style lang="scss" scoped>
	.game {
		align-items: center;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: 100%;
		padding: 2rem 1rem;
		width: 100%;

		&.dark {
			.guess-grid {
				.guess-row {
					.letter-box {
						background-color: #818080;
						border: 1px solid #000000;

						&.correct {
							background-color: #79a375;
							border-color: #000000;
						}

						&.present {
							background-color: #afa163;
							border-color: #000000;
						}

						&.absent {
							background-color: #535758;
							border-color: #000000;
						}
					}
				}
			}
		}
  
		.guess-grid {
			display: grid;
			gap: .25rem;
			grid-template-rows: repeat(6, 1fr);
			margin-bottom: .75rem;
			
			.guess-row {
				display: grid;
				gap: .25rem;
				grid-template-columns: repeat(5, 1fr);

				.letter-box {
					align-items: center;
					border: 1px solid #aaaaaa;
					border-radius: .25rem;
					display: flex;
					font-size: 1.2rem;
					justify-content: center;
					height: 3.5rem;
					text-transform: uppercase;
					width: 3.5rem;

					&.correct {
						background-color: #6aaa64;
						border-color: #6aaa64;
						color: white;
					}

					&.present {
						background-color: #c9b458;
						border-color: #c9b458;
						color: white;
					}

					&.absent {
						background-color: #787c7e;
						border-color: #787c7e;
						color: white;
					}
				}
			}
		}
	}
</style>