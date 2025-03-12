<template>
    <div :class="{ 'dark': darkMode }" class="game">
        <p v-if="!alreadyPlayed && guessesRemaining > 0">Guesses remaining: {{ guessesRemaining }}</p>
        <p v-else-if="alreadyPlayed" style="text-align: center;">You have reached your daily play limit. See the summary below of your games, and check back tomorrow for another try!</p>

		<template v-if="!alreadyPlayed">
			<div class="guesses-input-container">
				<span v-for="(guessObj, index) in guesses" :key="index" class="previous-guess" :class="{ 'correct-guess': guessObj.correct }">
					{{index + 1}}. {{ guessObj.guess }}

					<Icon 
						v-if="guessObj.correct"
						class="guessed-indicator"
						name="carbon:checkmark"
					/>

					<Icon 
						v-else
						class="guessed-indicator"
						name="carbon:close"
					/>
				</span>

				<div class="guess-container">
					<input v-if="!won && !gameOver" v-model="currentGuess" placeholder="Enter player name" :disabled="gameOver" />
					<ul v-if="filteredSuggestions.length > 0" class="suggestions">
						<li v-for="suggestion in filteredSuggestions" :key="suggestion.name" class="player-suggestion" @click="selectSuggestion(suggestion.name)">
							{{ suggestion.name }}

							<Icon 
								v-if="suggestion.guessed"
								class="guessed-indicator"
								name="carbon:close-outline"
							/>
						</li>
					</ul>
				</div>
			</div>

			<div class="clues">
				<div v-if="won" class="win-message">
					<h4>Easy, right!</h4>

					<p>You have {{ gamesRemainingToday }} game<span v-if="gamesRemainingToday !== 1">s</span> left to play today...</p>

					<p v-if="gamesRemainingToday === 0">Come back tomorrow for another try!!!</p>

					<button v-else @click="startNewGame">New Game</button>
				</div>

				<div v-else-if="gameOver && !won" class="lose-message">
					<h4>Better luck next time!</h4>

					<p>The correct player was: {{ targetPlayer.name }}</p>

					<p>You have {{ gamesRemainingToday }} game<span v-if="gamesRemainingToday > 1">s</span> left to play today...</p>

					<p v-if="gamesRemainingToday === 0">Come back tomorrow for another try!!!</p>

					<button v-else @click="startNewGame">New Game</button>
				</div>

				<div v-else class="clues-grid">
					<h6>Hints</h6>
					<div v-for="(row, rowIndex) in cluesGrid" :key="rowIndex" class="clues-row">
						<div v-for="(clue, colIndex) in row" :key="colIndex" class="clue-item">
							<Icon v-if="rowIndex * 3 + colIndex >= clues.length" :name="clueIcons[rowIndex * 3 + colIndex]" class="clue-icon" />
							<template v-else>
								<span class="clue-title">{{ clueTitles[rowIndex * 3 + colIndex] }}</span>
								<span class="clue">{{ clue }}</span>
							</template>
						</div>
					</div>
				</div>
			</div>
		</template>

		<div v-if="gameSummaries.length > 0 && alreadyPlayed" class="game-summaries">
			<h6>Todays games</h6>
			<div v-for="(summary, index) in gameSummaries" :key="index" :class="{ 'game-won': summary.won, 'game-lost': !summary.won }" class="prev-games">
				<p class="title">
					Game {{ index + 1 }}
				
					<Icon 
						v-if="summary.won"
						class="guessed-indicator"
						name="carbon:checkmark"
					/>

					<Icon 
						v-else
						class="guessed-indicator"
						name="carbon:close"
					/>
				</p>
				<span class="summary-row">
					<p>Winning Player</p>

					<p>{{ summary.targetPlayer.name }}</p>
				</span>
				<span class="summary-row">
					<p>Guesses</p>

					<p v-if="summary.won">{{ summary.guesses.length }} / 6</p>
					<p v-else>Failed</p>
				</span>
			</div>
		</div>

        <GameOverModal :darkMode="darkMode" :isOpen="isGameOverModalOpen" :won="won" :targetPlayer="targetPlayer"
            :guesses="guesses" :alreadyPlayed="alreadyPlayed"
            @close="closeGameOverModal" @newGame="startNewGame" />

        <InfoModal :darkMode="darkMode" :isOpen="isInfoModalOpen" @close="closeInfoModal" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, defineEmits, onUnmounted } from 'vue';
import { usePlayerStore } from '~/stores/players';
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
const targetPlayer = ref(null); // Initialize to null

const playerDetails = computed(() => {
  if (targetPlayer.value) {
    return {
      name: targetPlayer.value.name,
      nationality: targetPlayer.value.nationality,
      position: targetPlayer.value.position,
      team: targetPlayer.value.team,
      age: targetPlayer.value.age,
      yearBorn: targetPlayer.value.yearBorn,
      matchesPlayed: targetPlayer.value.matchesPlayed,
      matchesStarted: targetPlayer.value.matchesStarted,
      minutesPlayed: targetPlayer.value.minutesPlayed,
      goalsScored: targetPlayer.value.goalsScored,
      assists: targetPlayer.value.assists,
      goalsAndAssists: targetPlayer.value.goalsAndAssists,
      yellowCards: targetPlayer.value.yellowCards,
      redCards: targetPlayer.value.redCards,
      expectedGoals: targetPlayer.value.expectedGoals,
    };
  }
  return null;
});

const guesses = ref([]);
const currentGuess = ref('');
const gameOver = ref(false);
const won = ref(false);
const stats = ref({
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    winStreak: 0,
    maxWinStreak: 0,
    lossStreak: 0,
    maxLossStreak: 0,
    guessesPerWin: [],
    mostGuessedPlayer: {},
    lastTenResults: [],
});

const isGameOverModalOpen = ref(false);
const alreadyPlayed = ref(false);
const clues = ref([]);
const gameSummaries = ref([]);
const isInfoModalOpen = ref(true);

const suggestions = ref([]);

const filteredSuggestions = computed(() => {
    if (!currentGuess.value) {
        return [];
    }
    return playerStore.players
        .filter((player) =>
            player.name.toLowerCase().includes(currentGuess.value.toLowerCase())
        )
        .map((player) => ({
            ...player,
            guessed: guesses.value.includes(player.name),
        }));
});

const selectSuggestion = (playerName) => {
    currentGuess.value = playerName;
    filteredSuggestions.value = []; // Clear suggestions
    handleGuess(); // Submit the guess immediately
};

onMounted(async () => {
    await playerStore.fetchPlayers();
    loadStats();
    checkDailyPlay();
    window.addEventListener('keydown', handleDesktopKeyPress);

    const today = new Date().toISOString().slice(0, 10);
    const dailyPlayers = JSON.parse(localStorage.getItem(`dailyPlayers_${today}`) || '[]');

    if (dailyPlayers.length > 0) {
        targetPlayer.value = playerStore.players.find(player => player.name === dailyPlayers[0]);
    } else {
        const newDailyPlayers = [];
        for (let i = 0; i < 3; i++) {
            const player = playerStore.getRandomPlayer();
            newDailyPlayers.push(player.name);
        }
        localStorage.setItem(`dailyPlayers_${today}`, JSON.stringify(newDailyPlayers));
        targetPlayer.value = playerStore.players.find(player => player.name === newDailyPlayers[0]);
    }

    if(targetPlayer.value){
        clues.value.push(generateClues(targetPlayer.value)[0]);
    }

    gameSummaries.value = JSON.parse(localStorage.getItem('gameSummaries') || '[]');
});


onUnmounted(() => {
    window.removeEventListener('keydown', handleDesktopKeyPress);
});

const gamesRemainingToday = computed(() => {
    const playsToday = parseInt(localStorage.getItem('playsToday') || '0');
    return Math.max(0, 3 - playsToday);
});

const cluesGrid = computed(() => {
    const grid = [[], []];
    for (let i = 0; i < 6; i++) {
        const row = Math.floor(i / 3);
        grid[row].push(clues.value[i] || null);
    }
    return grid;
});

const clueIcons = computed(() => {
    return [
        'carbon:number-1',
        'carbon:number-2',
        'carbon:number-3',
        'carbon:number-4',
        'carbon:number-5',
        'carbon:number-6',
    ];
});

const checkDailyPlay = () => {
    const today = new Date().toISOString().slice(0, 10);
    const storedLastPlayed = localStorage.getItem('lastPlayed');
    let playsToday = parseInt(localStorage.getItem('playsToday') || '0');

    if (storedLastPlayed !== today) {
        // New day, reset plays
        playsToday = 0;
        localStorage.setItem('playsToday', '0');
        localStorage.setItem('lastPlayed', today);
        resetGame();
    }

    if (playsToday >= 3) {
        gameOver.value = true;
        alreadyPlayed.value = true;
        try {
            loadSavedGame();
        } catch (e) {
            handleLocalStorageError();
        }
    } else if (gameOver.value) {
        try {
            loadSavedGame();
        } catch (e) {
            handleLocalStorageError();
        }
    } else {
        resetGame();
    }
};

const resetGame = () => {
    guesses.value = [];
    currentGuess.value = '';
    gameOver.value = false;
    won.value = false;
    alreadyPlayed.value = false;
    isGameOverModalOpen.value = false;
    clues.value = [];
}

const loadSavedGame = () => {
    guesses.value = JSON.parse(localStorage.getItem('guesses')) || [];
    won.value = JSON.parse(localStorage.getItem('won')) || false;
    clues.value = JSON.parse(localStorage.getItem('clues')) || [];
}

const handleLocalStorageError = () => {
    console.error('Error parsing local storage data:');
    resetGame();
}

const saveGameData = () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('lastPlayed', today);
    localStorage.setItem('guesses', JSON.stringify(guesses.value));
    localStorage.setItem('won', JSON.stringify(won.value));
    localStorage.setItem('clues', JSON.stringify(clues.value));
};

const clueTitles = [
    'Age',
    'Position',
    'Matches Played',
    'Nationality',
    'Club',
    'Goals + Assists',
];


const generateClues = (player) => {
  return [
    `${player.age}`,
    `${player.position}`,
    `${player.matchesPlayed}`,
    `${player.nationality}`,
    `${player.team}`,
    `${player.goalsAndAssists}`,
  ];
};

const guessesRemaining = computed(() => {
    return Math.max(0, 6 - guesses.value.length);
});

const handleGuess = () => {
    if (gameOver.value) return;

    const guess = currentGuess.value;
    const isCorrectGuess = guess.toLowerCase() === targetPlayer.value.name.toLowerCase();

    guesses.value.push({
        guess: guess,
        correct: isCorrectGuess,
    });

    currentGuess.value = '';

    if (isCorrectGuess) {
        won.value = true;
        gameOver.value = true;
        isGameOverModalOpen.value = true;
        updateStats(true);
    } else if (guesses.value.length === 6) {
        gameOver.value = true;
        isGameOverModalOpen.value = true;
        updateStats(false);
    } else {
        clues.value.push(generateClues(targetPlayer.value)[guesses.value.length]);
    }

    saveGameData();
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
        stats.value.guessesPerWin.push(guesses.value.length);
        stats.value.winStreak++;
        stats.value.lossStreak = 0;

        if (stats.value.winStreak > stats.value.maxWinStreak) {
            stats.value.maxWinStreak = stats.value.winStreak;
		}

		stats.value.lastTenResults.push('win');
    } else {
        stats.value.gamesLost++;
        stats.value.winStreak = 0;
        stats.value.lossStreak++;

        if (stats.value.lossStreak > stats.value.maxLossStreak) {
            stats.value.maxLossStreak = stats.value.lossStreak;
		}
		
        stats.value.lastTenResults.push('lose');
	}
	
    if (stats.value.lastTenResults.length > 10) {
        stats.value.lastTenResults.shift();
	}
	
    calculateMostGuessed();
    saveStats();
	emit('stats-updated');

	// Store game summary
	let gameSummaries = JSON.parse(localStorage.getItem('gameSummaries') || '[]');
    gameSummaries.push({
        targetPlayer: targetPlayer.value,
        guesses: guesses.value,
        won: gameWon,
    });

    // Keep only the last 3 games
    gameSummaries = gameSummaries.slice(0, 3);
    localStorage.setItem('gameSummaries', JSON.stringify(gameSummaries));


    // Increment playsToday here, at the end of the game
    let playsToday = parseInt(localStorage.getItem('playsToday') || '0');
    playsToday++;
    localStorage.setItem('playsToday', playsToday.toString());
};

const calculateMostGuessed = () => {
    const guessedPlayers = {};
    for (const guess of guesses.value) {
        guessedPlayers[guess] = (guessedPlayers[guess] || 0) + 1;
    }

    let mostGuessed = '';
    let maxCount = 0;

    for (const player in guessedPlayers) {
        if (guessedPlayers[player] > maxCount) {
            mostGuessed = player;
            maxCount = guessedPlayers[player];
        }
    }
    if (stats.value.gamesPlayed >= 10){
        stats.value.mostGuessedPlayer = {name: mostGuessed, count: maxCount};
    }
};

const handleKeyboardKeyPress = (key) => {
    if (gameOver.value) return;

    if (key === 'ENTER') {
        handleGuess();
    } else if (key === 'BACK') {
        currentGuess.value = currentGuess.value.slice(0, -1);
    } else {
        currentGuess.value += key;
    }
};

const handleDesktopKeyPress = (event) => {
    if (gameOver.value) return;

    const key = event.key;
    const activeElement = document.activeElement;

    if (key === 'Enter') {
        handleGuess();
    } else if (key === 'Backspace') {
        if (activeElement.tagName !== 'INPUT') {
            currentGuess.value = currentGuess.value.slice(0, -1);
        } else if (activeElement.tagName === 'INPUT' && activeElement.value === ""){
            currentGuess.value = currentGuess.value.slice(0, -1);
        }
    } else if (/^[a-zA-Z\s]+$/.test(key) && activeElement.tagName !== 'INPUT') {
        currentGuess.value += key.toLowerCase();
    }
};

const closeGameOverModal = () => {
    isGameOverModalOpen.value = false;
};

const closeInfoModal = () => {
    isInfoModalOpen.value = false;
};

const startNewGame = () => {
    let playsToday = parseInt(localStorage.getItem('playsToday') || '0');
    if (playsToday >= 3) return;

    guesses.value = [];
    currentGuess.value = '';
    gameOver.value = false;
    won.value = false;
    clues.value = [];

    const today = new Date().toISOString().slice(0, 10);
    const dailyPlayers = JSON.parse(localStorage.getItem(`dailyPlayers_${today}`) || '[]');

    if(dailyPlayers.length > 0){
        let gameNumber = parseInt(localStorage.getItem("playsToday") || "0");
        targetPlayer.value = playerStore.players.find(player => player.name === dailyPlayers[gameNumber]);
    } else {
        targetPlayer.value = playerStore.getRandomPlayer();
    }

    isGameOverModalOpen.value = false;
    saveGameData();

    if(targetPlayer.value){
        clues.value.push(generateClues(targetPlayer.value)[0]);
    }
};
</script>

<style lang="scss" scoped>
	.game {
		align-items: center;
		display: flex;
		flex-direction: column;
		max-width: 400px;
		padding: 2rem;
		width: 100vw;

		.guesses-input-container {
			display: flex;
			flex-direction: column;
			width: 100%;

			.previous-guess {
				background-color: #ffe5e5;
				border-bottom: 1px solid #d24f4f;
				display: flex;
				flex-direction: row;
				justify-content: space-between;
				padding: 0.75rem;
				text-transform: uppercase;
				font-size: .65rem;
				letter-spacing: .1rem;

				&:nth-child(even) {
					background-color: #ffefef;
				}

				span {
					background-color: #d24f4f;
				}

				&.correct-guess {
					background-color: #d6fad7;
					border-bottom: 1px solid #88bd8a;
					font-weight: 500;

					span {
						background-color: #527454;
					}
				}
			}

			.guess-container {
				margin-top: .4rem;
				position: relative;
				width: 100%;

				input {
					background-color: #f3f7ff;
					border: none;
					border-bottom: 2px solid #3f50e9;
					font-size: 1rem;
					letter-spacing: .1rem;
					padding: .75rem;
					text-transform: uppercase;
					width: 100%;

					&:focus {
						outline: none;
					}
				}

				.suggestions {
					list-style: none;
					padding: 0;
					margin: 0;
					border: none;
					border-radius: 4px;
					background-color: #f3f7ff;
					font-size: .8rem;
					max-height: 200px;
					overflow-y: auto;
					text-transform: uppercase;
					position: absolute;
					left: 0;
					top: 100%;
					width: 100%;
					z-index: 10;

					&:focus {
						outline: none;
					}
					
					li {
						border-bottom: 1px solid #e3e6ff;
						display: flex;
						flex-direction: row;
						justify-content: space-between;
						letter-spacing: .1rem;
						padding: .5rem .75rem;
						cursor: pointer;

						&:hover {
							background-color: #c8d2f0;
						}

						&:nth-child(even) {
							background-color: #edf2fa;

							&:hover {
								background-color: #c8d2f0;
							}
						}

						span {
							background-color: #d24f4f;
						}
					}
				}
			}
		}

		.clues {
			background-color: #f0f0f0;
			border: 1px solid #cfcfcf;
			bottom: 1rem;
			margin: 0 2rem;
			max-width: 400px;
			padding: .5rem;
			position: absolute;
			text-align: center;
			width: calc(100% - 4rem);

			h6 {
				padding-bottom: .5rem;
			}

			.win-message {
				background-color: #d6fad7;
				border: 1px solid #88bd8a;
				padding: .75rem;
				width: 100%;

				h4 {
					padding-bottom: 1rem;
				}

				p {
					padding-bottom: .5rem;
				}

				button {
					background-color: #88bd8a;
					border: 1px solid #567c57;
					padding: .75rem;
					width: 100%;
				}
			}

			.lose-message {
				background-color: #ffe5e5;
				border: 1px solid #d24f4f;
				padding: .75rem;
				width: 100%;

				h4 {
					padding-bottom: 1rem;
				}

				p {
					padding-bottom: .5rem;
				}

				button {
					background-color: #f67c7c;
					border: 1px solid #d24f4f;
					padding: .75rem;
					width: 100%;
				}
			}

			.clues-grid {
				display: flex;
				flex-direction: column;
				width: 100%;

				.clues-row {
					display: flex;
					flex-direction: column;
					justify-content: space-between;
					width: 100%;

					.clue-item {
						align-items: center;
						background-color: #f7f7f7;
						border: 1px solid #ddd;
						display: flex;
						flex-direction: row;
						gap: .5rem;
						height: 1rem;
						justify-content: space-between;
						padding: 1rem;
						text-align: center;
						width: 100%;

						.clue-icon {
							font-size: 2.5rem;
							margin: 0 auto;
						}

						.clue {
							font-size: 1.2rem;
						}

						.clue-title {
							font-size: .75rem;
						}
					}
				}
			}
		}

		.game-summaries {
			background-color: #f0f0f0;
			border: 1px solid #cfcfcf;
			display: flex;
			flex-direction: column;
			gap: .5rem;
			margin-top: 1rem;
			padding: .5rem;
			text-align: center;
			width: 100%;

			.prev-games {
				display: flex;
				flex-direction: column;
				gap: .3rem;
				padding: .5rem;
				width: 100%;

				.title {
					align-items: center;
					display: flex;
					gap: .5rem;
					justify-content: center;
					padding-bottom: .5rem;
				}

				&.game-won {
					background-color: #d6fad7;
					border: 1px solid #88bd8a;

					.title {
						border-bottom: 1px solid #88bd8a;
					}
				}

				&.game-lost {
					background-color: #ffe5e5;
					border: 1px solid #d24f4f;

					.title {
						border-bottom: 1px solid #d24f4f;
					}
				}

				.summary-row {
					display: flex;
					flex-direction: row;
					justify-content: space-between;
				}
			}
		}

		&.dark {
			input,
			button,
			.clues,
			.guesses-display {
				background-color: #333;
				color: #fff;
				border-color: #555;
			}

			button {
				background-color: #66bb6a;
			}

			.win-message {
				background-color: #4a7a4c;
			}
		}
	}
</style>