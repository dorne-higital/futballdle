<template>
    <div :class="{ 'dark': darkMode }" class="game">
        <p v-if="guessesRemaining > 0">Guesses remaining: {{ guessesRemaining }}</p>
        <p v-else-if="alreadyPlayed">You have reached your daily play limit.</p>

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
					<!-- <button @click="handleGuess" :disabled="gameOver">Guess</button> -->
				</div>
			</div>

			<div class="clues">
				<div v-if="won" class="win-message">
					<h4>Easy, right!</h4>

					<p>You have {{ gamesRemainingToday }} game<span v-if="gamesRemainingToday > 1">s</span> left to play today...</p>

					<p v-if="gamesRemainingToday === 0">Come back tomorrow for another try</p>

					<button v-else @click="startNewGame">New Game</button>
				</div>

				<div v-else-if="gameOver && !won" class="lose-message">
					<h4>Better luck next time!</h4>
					<p>The correct player was: {{ targetPlayer.name }}</p>
					<p>You have {{ gamesRemainingToday }} game<span v-if="gamesRemainingToday > 1">s</span> left to play today...</p>
					<p v-if="gamesRemainingToday === 0">Come back tomorrow for another try</p>
					<button v-else @click="startNewGame">New Game</button>
				</div>

				<div v-else class="clues-grid">
					<h6>Hints</h6>
					<div v-for="(row, rowIndex) in cluesGrid" :key="rowIndex" class="clues-row">
						<div v-for="(clue, colIndex) in row" :key="colIndex" class="clue-item">
							<Icon v-if="rowIndex * 3 + colIndex >= clues.length" :name="clueIcons[rowIndex * 3 + colIndex]" class="clue-icon" />
							<template v-else>
								<span class="clue">{{ clue }}</span>
								<span class="clue-title">{{ clueTitles[rowIndex * 3 + colIndex] }}</span>
							</template>
						</div>
					</div>
				</div>
			</div>
		</template>

		<div v-if="gameSummaries.length > 0 && alreadyPlayed">
			<h3>Game Summaries:</h3>
			<div v-for="(summary, index) in gameSummaries" :key="index">
				<p>Game {{ index + 1 }}</p>
				<p v-if="summary.won">Winning Player: {{ summary.targetPlayer.name }}</p>
				<p v-else>Answer: {{ summary.targetPlayer.name }}</p>
				<p>Guesses: {{ summary.guesses.length }} / 6</p>
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
const disabledKeys = ref([]);
const stats = ref({
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    winStreak: 0,
    maxWinStreak: 0,
    lossStreak: 0,
    maxLossStreak: 0,
    guessesPerWin: [],
    mostGuessedPlayer: {}
});
const letterStates = ref({});

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
    await playerStore.fetchPlayers(); // Fetch players from Firestore
    loadStats();
    checkDailyPlay();
    window.addEventListener('keydown', handleDesktopKeyPress);

    // Ensure players are fetched before trying to get a random player
    if (!gameOver.value && playerStore.players && playerStore.players.length > 0) {
        targetPlayer.value = playerStore.getRandomPlayer();
        console.log("Target player on mount:", targetPlayer.value);
        clues.value.push(generateClues(targetPlayer.value)[0]);
    } else {
        console.log("Players not loaded or game over.");
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
        isGameOverModalOpen.value = true;
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
    disabledKeys.value = [];
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
    } else {
        stats.value.gamesLost++;
        stats.value.winStreak = 0;
        stats.value.lossStreak++;

        if (stats.value.lossStreak > stats.value.maxLossStreak) {
            stats.value.maxLossStreak = stats.value.lossStreak;
        }
    }
    calculateMostGuessed();
    saveStats();
	emit('stats-updated');

	// Store game summary
	let gameSummaries = JSON.parse(localStorage.getItem('gameSummaries') || '[]');
    gameSummaries.unshift({
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
    if (playsToday >= 3) return; // Prevent new game if limit reached.

    console.log("Starting a New Game");
    console.log("Current targetPlayer before:", targetPlayer.value);
    guesses.value = [];
    currentGuess.value = '';
    gameOver.value = false;
    won.value = false;
    clues.value = [];
    targetPlayer.value = playerStore.getRandomPlayer();
    console.log("New targetPlayer after:", targetPlayer.value);
    isGameOverModalOpen.value = false;
	saveGameData();
	
    clues.value.push(generateClues(targetPlayer.value)[0]);
};
</script>

<style lang="scss" scoped>
.game {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
	width: 100vw;

	.guesses-input-container {
        display: flex;
        flex-direction: column;
        width: 100%;
    }

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


    button {
        padding: 0.5rem 1rem;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-bottom: 1rem;
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
			margin-bottom: 0;
            margin-top: .5rem;
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
			background-color: #d24f4f;
            margin-bottom: 0;
            margin-top: .5rem;
            width: 100%;
        }
    }

    .guesses-display {
        margin-top: 1rem;
        border: 1px solid #ddd;
        padding: 1rem;
        border-radius: 4px;
        width: 80%;
        text-align: left;

        h3 {
            margin-bottom: 0.5rem;
        }

        ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        li {
            padding: 0.25rem 0;
        }
    }

	.clues {
		background-color: #f0f0f0;
		border: 1px solid #cfcfcf;
		bottom: 5rem;
		margin: 0 2rem;
		padding: .5rem;
		position: absolute;
		text-align: center;
		width: calc(100% - 4rem);

		h6 {
			padding-bottom: .5rem;
		}
	}

	.clues-grid {
        display: flex;
        flex-direction: column;
        width: 100%;
    }

    .clues-row {
        display: flex;
        justify-content: space-between;
        width: 100%;
    }

    .clue-item {
		align-items: center;
		background-color: #f7f7f7;
        border: 1px solid #ddd;
		display: flex;
		flex-direction: column;
		gap: .5rem;
		height: 6rem;
		justify-content: space-between;
        padding: 1rem;
        text-align: center;
    	width: 33%;

        .clue-icon {
            font-size: 3.5rem;
        }

		.clue {
			font-size: 1.2rem;
		}

		.clue-title {
			font-size: .75rem;
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