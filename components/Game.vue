<template>
    <div :class="{ 'dark': darkMode }" class="game">
        <p v-if="gamesRemaining > 0">Games remaining: {{ gamesRemaining }}</p>
        <p v-else-if="alreadyPlayed">You have reached your daily play limit.</p>

		<template v-if="!alreadyPlayed">
			<input v-model="currentGuess" placeholder="Enter player name" :disabled="gameOver" />
			<button @click="handleGuess" :disabled="gameOver">Guess</button>

			<div v-if="won" class="win-message">
				<h2>Congratulations! You guessed correctly!</h2>
				<button v-if="gameOver" @click="startNewGame">New Game</button>
			</div>

			<div v-if="guesses.length > 0" class="guesses-display">
				<h3>Guesses:</h3>
				<ul>
					<li v-for="(guess, index) in guesses" :key="index">{{ guess }}</li>
				</ul>
			</div>

			<div v-if="clues.length > 0" class="clues">
				<h3>Clues:</h3>
				<ul>
					<li v-for="(clue, index) in clues" :key="index">{{ clue }}</li>
				</ul>
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

        <Keyboard :darkMode="darkMode" :disabledKeys="disabledKeys" :letterStates="letterStates"
            @key-press="handleKeyboardKeyPress" />

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
        return playerStore.getPlayerDetails(targetPlayer.value.name);
    }
    return null; // Return null if targetPlayer is null
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
const isInfoModalOpen = ref(false);
const clues = ref([]);
const gameSummaries = ref([]);

onMounted(() => {
    loadStats();
    checkDailyPlay();
    window.addEventListener('keydown', handleDesktopKeyPress);
    if (!gameOver.value) {
        targetPlayer.value = playerStore.getRandomPlayer(); // Call the getter once
        console.log("Target player on mount:", targetPlayer.value);
	}

	gameSummaries.value = JSON.parse(localStorage.getItem('gameSummaries') || '[]');
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleDesktopKeyPress);
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

const generateClues = (player) => {
    return [
        `Age: ${player.age}`,
        `Nationality: ${player.nationality}`,
        `Career Club Goals: ${player.careerClubGoals}`,
        `Position: ${player.position}`,
        `League: ${player.league}`,
        `Club: ${player.club}`,
    ];
};

const gamesRemaining = computed(() => {
    const playsToday = parseInt(localStorage.getItem('playsToday') || '0');
    return Math.max(0, 3 - playsToday);
});

const handleGuess = () => {
    if (gameOver.value) return;

    const guess = currentGuess.value;
    guesses.value.push(guess);
    currentGuess.value = '';

    if (guess.toLowerCase() === targetPlayer.value.name.toLowerCase()) {
        won.value = true;
        gameOver.value = true;
        isGameOverModalOpen.value = true;
        updateStats(true);
    } else if (guesses.value.length === 6) {
        gameOver.value = true;
        isGameOverModalOpen.value = true;
        updateStats(false);
    } else {
        clues.value.push(generateClues(targetPlayer.value)[guesses.value.length - 1]);
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
};
</script>

<style lang="scss" scoped>
.game {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;

    input {
        padding: 0.5rem;
        margin-bottom: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
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
        background-color: #66bb6a;
        color: white;
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1rem;
        text-align: center;

        button {
            margin-top: 1rem;
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