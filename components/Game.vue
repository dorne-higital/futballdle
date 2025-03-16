<template>
    <div :class="[{ 'dark': darkMode },currentDifficultyClass]" class="game">
        <p v-if="!alreadyPlayed && guessesRemaining > 0">
            Guesses remaining: {{ guessesRemaining }}
        </p>
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
					<h6 class="difficulty-badge" :class="currentDifficultyClass">{{ currentDifficultyLabel }}</h6>

                    <div v-for="(row, rowIndex) in cluesGrid" :key="rowIndex" class="clues-row">
                        <div v-for="(clue, colIndex) in row" :key="colIndex" class="clue-item">
                            <Icon v-if="rowIndex * 3 + colIndex >= clues.length" :name="clueIcons[rowIndex * 3 + colIndex]" class="clue-icon" />
                            <template v-else>
                                <span class="clue-title">{{ getClueTitle(rowIndex * 3 + colIndex) }}</span>
                                <span class="clue">{{ clue }}</span>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <div v-if="gameSummaries.length > 0 && alreadyPlayed" class="game-summaries" :key="gameSummaries.length">
            <h6>Todays games</h6>
            <div v-for="(summary, index) in [...gameSummaries].reverse()" :key="index" :class="{ 'game-won': summary.won, 'game-lost': !summary.won }" class="prev-games">
                <p class="title">
                    <span class="difficulty-badge" :class="getDifficultyClass(index)">{{ getDifficultyLabel(index) }}</span>
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
            :guesses="guesses" :alreadyPlayed="alreadyPlayed" :difficulty="currentDifficulty"
            @close="closeGameOverModal" @newGame="startNewGame" />

        <InfoModal :darkMode="darkMode" :isOpen="isInfoModalOpen" @close="closeInfoModal" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, defineEmits, onUnmounted, nextTick } from 'vue';
import { usePlayerStore } from '~/stores/players';
import { useStatsStore } from '~/stores/stats';
import GameOverModal from './GameOverModal.vue';
import InfoModal from './InfoModal.vue';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const { $firestore: db } = useNuxtApp();

const DIFFICULTY = {
    EASY: 1,
    MEDIUM: 2, 
    HARD: 3
};

const getOrCreateUserId = () => {
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = uuidv4();
        localStorage.setItem('userId', userId);
    }
    return userId;
};

const userId = ref(getOrCreateUserId());

const props = defineProps({
    darkMode: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['stats-updated']);

const playerStore = usePlayerStore();
const statsStore = useStatsStore();
const targetPlayer = ref(null);
const currentDifficulty = ref(DIFFICULTY.EASY);

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
    easyGamesWon: 0,
    mediumGamesWon: 0,
    hardGamesWon: 0,
    easyGamesPlayed: 0,
    mediumGamesPlayed: 0,
    hardGamesPlayed: 0,
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
    filteredSuggestions.value = [];
    handleGuess();
};

// Compute current difficulty based on plays today
const getCurrentDifficulty = () => {
    const playsToday = parseInt(localStorage.getItem('playsToday') || '0');
    
    if (playsToday === 0) return DIFFICULTY.EASY;
    if (playsToday === 1) return DIFFICULTY.MEDIUM;
    return DIFFICULTY.HARD;
};

// Get difficulty label for display
const currentDifficultyLabel = computed(() => {
    switch (currentDifficulty.value) {
        case DIFFICULTY.EASY: return 'Easy';
        case DIFFICULTY.MEDIUM: return 'Medium';
        case DIFFICULTY.HARD: return 'Hard';
        default: return 'Unknown';
    }
});

// Get CSS class for difficulty styling
const currentDifficultyClass = computed(() => {
    switch (currentDifficulty.value) {
        case DIFFICULTY.EASY: return 'difficulty-easy';
        case DIFFICULTY.MEDIUM: return 'difficulty-medium';
        case DIFFICULTY.HARD: return 'difficulty-hard';
        default: return '';
    }
});

// Helper functions for game summaries
const getDifficultyLabel = (index) => {
    // For showing Easy/Medium/Hard in correct order
    if (index === 0) return 'Easy';
    if (index === 1) return 'Medium';
    return 'Hard';

};

const getDifficultyClass = (index) => {
    if (index === 0) return 'difficulty-easy';
    if (index === 1) return 'difficulty-medium';
    return 'difficulty-hard';
};

onMounted(async () => {
    // Load gameSummaries from localStorage first
    const storedSummaries = localStorage.getItem('gameSummaries');
    if (storedSummaries) {
        gameSummaries.value = JSON.parse(storedSummaries);
    }
    console.log('Loaded gameSummaries:', gameSummaries.value);

    await playerStore.fetchPlayers();
    await loadStats();
    checkDailyPlay();
    window.addEventListener('keydown', handleDesktopKeyPress);

    if (!gameOver.value && playerStore.players && playerStore.players.length > 0) {
        currentDifficulty.value = getCurrentDifficulty();
        targetPlayer.value = playerStore.getRandomPlayerByDifficulty(currentDifficulty.value);
        clues.value.push(generateClues(targetPlayer.value, currentDifficulty.value)[0]);
    } else {
        console.log("Players not loaded or game over.");
    }

    await nextTick();
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
        playsToday = 0;
        localStorage.setItem('playsToday', '0');
        localStorage.setItem('lastPlayed', today);
        resetGame();
        gameSummaries.value = []; // Clear the summaries
        localStorage.setItem('gameSummaries', JSON.stringify(gameSummaries.value)); // Save the cleared summaries
    }

    if (playsToday >= 3) {
        gameOver.value = true;
        alreadyPlayed.value = true;
    } else {
        alreadyPlayed.value = false;
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
    currentDifficulty.value = getCurrentDifficulty();
};

const saveGameData = () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('lastPlayed', today);
    localStorage.setItem('guesses', JSON.stringify(guesses.value));
    localStorage.setItem('won', JSON.stringify(won.value));
    localStorage.setItem('clues', JSON.stringify(clues.value));
    localStorage.setItem('currentDifficulty', currentDifficulty.value.toString());
};

// Define clue sets per difficulty level
const getClueTitle = (index) => {
    // Different clue sets based on difficulty
    const easyClueTitles = [
		'Club',
        'Position',
        'Nationality',
        'Age',
        'Goals + Assists',
        'Matches Played',
    ];
    
    const mediumClueTitles = [
        'Position',
        'League', // League instead of specific club
        'Nationality', 
        'Age Range',
        'Goals + Assists',
        'Matches Started',
    ];
    
    const hardClueTitles = [
        'Position Group', // Attack/Midfield/Defense instead of specific position
        'Continent', // Continent instead of country
        'Age Range',
        'League',
        'Goal Contribution Rate', // Per 90 instead of total
        'Minutes Played',
    ];
    
    switch (currentDifficulty.value) {
        case DIFFICULTY.EASY:
            return easyClueTitles[index];
        case DIFFICULTY.MEDIUM:
            return mediumClueTitles[index];
        case DIFFICULTY.HARD:
            return hardClueTitles[index];
        default:
            return easyClueTitles[index];
    }
};

const getPositionGroup = (position) => {
    if (['Striker', 'Forward', 'Center-Forward', 'Right Winger', 'Left Winger'].includes(position)) {
        return 'Attack';
    } else if (['Central Midfield', 'Defensive Midfield', 'Attacking Midfield', 'Right Midfielder', 'Left Midfielder'].includes(position)) {
        return 'Midfield';
    } else {
        return 'Defense';
    }
};

const getAgeRange = (age) => {
    if (age < 23) return 'Under 23';
    if (age < 28) return '23-27';
    if (age < 32) return '28-31';
    return '32+';
};

const getContinent = (nationality) => {
    const europeanCountries = ['England', 'France', 'Spain', 'Germany', 'Italy', 'Portugal', 'Netherlands', 'Belgium', 'Scotland', 'Wales', 'Ireland', 'Croatia', 'Serbia', 'Norway', 'Sweden', 'Denmark', 'Poland', 'Ukraine', 'Russia', 'Switzerland', 'Austria'];
    const southAmericanCountries = ['Brazil', 'Argentina', 'Uruguay', 'Colombia', 'Chile', 'Ecuador', 'Paraguay', 'Peru', 'Venezuela', 'Bolivia'];
    const africanCountries = ['Senegal', 'Ghana', 'Nigeria', 'Ivory Coast', 'Egypt', 'Morocco', 'Algeria', 'Tunisia', 'Cameroon', 'South Africa'];
    
    if (europeanCountries.includes(nationality)) return 'Europe';
    if (southAmericanCountries.includes(nationality)) return 'South America';
    if (africanCountries.includes(nationality)) return 'Africa';
    if (['USA', 'Canada', 'Mexico', 'Jamaica', 'Costa Rica', 'Honduras'].includes(nationality)) return 'North America';
    if (['Japan', 'South Korea', 'China', 'Australia', 'Saudi Arabia', 'Iran', 'Qatar', 'UAE', 'New Zealand'].includes(nationality)) return 'Asia/Oceania';
    
    return 'Other';
};

const getLeague = (team) => {
    const premierLeagueTeams = ['Arsenal', 'Aston Villa', 'Chelsea', 'Everton', 'Liverpool', 'Manchester City', 'Manchester United', 'Newcastle', 'Tottenham', 'West Ham', 'Brighton', 'Brentford', 'Crystal Palace', 'Fulham', 'Leicester', 'Nottingham Forest', 'Southampton', 'Wolves', 'Burnley', 'Sheffield United'];
    const laLigaTeams = ['Barcelona', 'Real Madrid', 'Atletico Madrid', 'Sevilla', 'Valencia', 'Villarreal', 'Real Sociedad', 'Athletic Bilbao', 'Real Betis', 'Getafe'];
    const bundesligaTeams = ['Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen', 'Borussia Monchengladbach', 'Wolfsburg', 'Eintracht Frankfurt', 'Union Berlin', 'SC Freiburg', 'Hoffenheim'];
    const serieATeams = ['AC Milan', 'Inter Milan', 'Juventus', 'Napoli', 'Roma', 'Lazio', 'Atalanta', 'Fiorentina', 'Sassuolo', 'Torino'];
    const ligue1Teams = ['PSG', 'Marseille', 'Lyon', 'Lille', 'Monaco', 'Nice', 'Rennes', 'Strasbourg', 'Lens', 'Nantes'];
    
    if (premierLeagueTeams.includes(team)) return 'Premier League';
    if (laLigaTeams.includes(team)) return 'La Liga';
    if (bundesligaTeams.includes(team)) return 'Bundesliga';
    if (serieATeams.includes(team)) return 'Serie A';
    if (ligue1Teams.includes(team)) return 'Ligue 1';
    
    return 'Other League';
};

const getGoalContributionRate = (player) => {
    const totalMinutes = player.minutesPlayed || 1;
    const totalContributions = player.goalsAndAssists || 0;
    const rate = (totalContributions / totalMinutes) * 90;
    return rate.toFixed(2) + ' per 90';
};

const generateClues = (player, difficulty) => {
    switch (difficulty) {
        case DIFFICULTY.EASY:
            return [
				`${player.team}`,
                `${player.position}`,
                `${player.nationality}`,
                `${player.age}`,
                `${player.goalsAndAssists}`,
                `${player.matchesPlayed}`,
            ];
        case DIFFICULTY.MEDIUM:
            return [
                `${player.position}`,
                `${player.nationality}`,
                `${getAgeRange(player.age)}`,
                `${getLeague(player.team)}`,
                `${player.goalsAndAssists}`,
                `${player.matchesStarted}`,
            ];
        case DIFFICULTY.HARD:
            return [
                `${getPositionGroup(player.position)}`,
                `${getContinent(player.nationality)}`,
                `${getAgeRange(player.age)}`,
                `${getLeague(player.team)}`,
                `${getGoalContributionRate(player)}`,
                `${player.minutesPlayed}`,
            ];
        default:
            return [
                `${player.position}`,
                `${player.nationality}`,
                `${player.age}`,
                `${player.team}`,
                `${player.goalsAndAssists}`,
                `${player.matchesPlayed}`,
            ];
    }
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
        clues.value.push(generateClues(targetPlayer.value, currentDifficulty.value)[guesses.value.length]);
    }

    saveGameData();
};

const loadStats = async () => {
    try {
        const docRef = doc(db, "users", userId.value);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            stats.value = docSnap.data().stats;
            // Handle legacy stats without difficulty fields
            if (stats.value.easyGamesPlayed === undefined) {
                stats.value.easyGamesPlayed = 0;
                stats.value.mediumGamesPlayed = 0;
                stats.value.hardGamesPlayed = 0;
                stats.value.easyGamesWon = 0;
                stats.value.mediumGamesWon = 0;
                stats.value.hardGamesWon = 0;
            }
        } else {
            console.log("No such document!");
            resetStats();
        }
    } catch (e) {
        console.error("Error loading stats:", e);
        resetStats();
    }
};

const saveStats = async () => {
    try {
        console.log('saveStats called');
        await setDoc(doc(db, "users", userId.value), {
            stats: stats.value,
        });
        console.log('saveStats successful');
    } catch (e) {
        console.error("Error saving stats:", e);
    }
};

const resetStats = () => {
    stats.value = {
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
        easyGamesPlayed: 0,
        mediumGamesPlayed: 0,
        hardGamesPlayed: 0,
        easyGamesWon: 0,
        mediumGamesWon: 0,
        hardGamesWon: 0,
		totalPoints: 0,
    };
    gameSummaries.value = [];
};

const updateStats = (gameWon) => {
    console.log('updateStats called');
    statsStore.stats.gamesPlayed++;

    // Update difficulty-specific stats
    switch (currentDifficulty.value) {
        case DIFFICULTY.EASY:
            statsStore.stats.easyGamesPlayed++;
            if (gameWon) {
                statsStore.stats.easyGamesWon++;
                statsStore.stats.totalPoints += 1; // 1 point for easy win
			}
			break;
        case DIFFICULTY.MEDIUM:
            statsStore.stats.mediumGamesPlayed++;
            if (gameWon) {
                statsStore.stats.mediumGamesWon++;
                statsStore.stats.totalPoints += 2; // 2 points for medium win
            }
            break;
        case DIFFICULTY.HARD:
            statsStore.stats.hardGamesPlayed++;
            if (gameWon) {
                statsStore.stats.hardGamesWon++;
                statsStore.stats.totalPoints += 3; // 3 points for hard win
            }
            break;
    }

    if (gameWon) {
        statsStore.stats.gamesWon++;
        statsStore.stats.guessesPerWin.push(guesses.value.length);
        statsStore.stats.winStreak++;
        statsStore.stats.lossStreak = 0;

        if (statsStore.stats.winStreak > statsStore.stats.maxWinStreak) {
            statsStore.stats.maxWinStreak = statsStore.stats.winStreak;
        }

        statsStore.stats.lastTenResults.push('win');
    } else {
        statsStore.stats.gamesLost++;
        statsStore.stats.winStreak = 0;
        statsStore.stats.lossStreak++;

        if (statsStore.stats.lossStreak > statsStore.stats.maxLossStreak) {
            statsStore.stats.maxLossStreak = statsStore.stats.lossStreak;
        }

        statsStore.stats.lastTenResults.push('lose');
    }

    if (statsStore.stats.lastTenResults.length > 10) {
        statsStore.stats.lastTenResults.shift();
    }

    calculateMostGuessed();
    statsStore.saveStats();
    statsStore.loadStats();
    emit('stats-updated');

    gameSummaries.value = gameSummaries.value || [];
    gameSummaries.value.unshift({
        targetPlayer: targetPlayer.value,
        guesses: guesses.value,
        won: gameWon,
        difficulty: currentDifficulty.value
    });

    gameSummaries.value = gameSummaries.value.slice(0, 3);
    localStorage.setItem('gameSummaries', JSON.stringify(gameSummaries.value)); // Save here!

    let playsToday = parseInt(localStorage.getItem('playsToday') || '0');
    playsToday++;
    localStorage.setItem('playsToday', playsToday.toString());
    checkDailyPlay();
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
    if (stats.value.gamesPlayed >= 10) {
        stats.value.mostGuessedPlayer = { name: mostGuessed, count: maxCount };
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
        } else if (activeElement.tagName === 'INPUT' && activeElement.value === "") {
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
    
    // Update difficulty for the next game
    currentDifficulty.value = getCurrentDifficulty();
    
    // Get player based on difficulty level
    targetPlayer.value = playerStore.getRandomPlayerByDifficulty(currentDifficulty.value);
    isGameOverModalOpen.value = false;
    saveGameData();

    // Generate first clue based on difficulty
    clues.value.push(generateClues(targetPlayer.value, currentDifficulty.value)[0]);
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
					color: #000000;
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
					color: #000000;
					padding: .75rem;
					width: 100%;
				}
			}

			.clues-grid {
				display: flex;
				flex-direction: column;
				width: 100%;

				.difficulty-badge {
					display: inline-block;
					padding: .5rem;
					border-radius: 4px;
					font-weight: 400;
					margin-bottom: .5rem;
					width: 100%;

					&.difficulty-easy {
						background-color: #4CAF50;
						color: white;
					}

					&.difficulty-medium {
						background-color: #FF9800;
						color: white;
					}

					&.difficulty-hard {
						background-color: #F44336;
						color: white;
					}
				}

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

					.difficulty-badge {
						display: inline-block;
						padding: .5rem;
						border-radius: 4px;
						font-weight: 400;
						width: 100%;

						&.difficulty-easy {
							background-color: #4CAF50;
							color: white;
						}

						&.difficulty-medium {
							background-color: #FF9800;
							color: white;
						}

						&.difficulty-hard {
							background-color: #F44336;
							color: white;
						}
					}
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