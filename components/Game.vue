<template>
    <div :class="[{ 'dark': darkMode },currentDifficultyClass]" class="game">
        <div v-if="loading" class="loading-container">
            <Loader />
        </div>
        <template v-else>
            <span v-if="!alreadyPlayed && guessesRemaining > 0" class="game-info">
                <p class="caption">Game {{ currentGame }}</p>

                <p class="caption">Guess {{ currentGuessNumber }} / 6</p>
            </span>

            <p v-else-if="alreadyPlayed" class="opening-comms">You have reached your daily play limit. See the summary below of your games, and check back tomorrow for another try!</p>

            <template v-if="!alreadyPlayed">
                <div class="guesses-input-container">
                    <div class="guess-container">
                        <input v-if="!won && !gameOver" v-model="currentGuess" placeholder="Enter player name" :disabled="gameOver" />
                        <ul v-if="filteredSuggestions.length > 0" class="suggestions">
                            <li v-for="suggestion in filteredSuggestions" :key="suggestion.name" class="caption player-suggestion" @click="selectSuggestion(suggestion.name)">
                                {{ suggestion.name }}

                                <Icon 
                                    v-if="suggestion.guessed"
                                    class="guessed-indicator"
                                    name="solar:close-square-bold-duotone"
                                />
                            </li>
                        </ul>
                    </div>

                    <span 
                        v-for="(guessObj, index) in guesses" 
                        :key="index" 
                        class="previous-guess" 
                        :class="{
                            'correct-guess': guessObj.correct,             
                            'single-guess': guesses.length === 1 
                        }"
                    >
                        {{ guessObj.guess }}

                        <Icon
                            v-if="guessObj.correct"
                            class="guessed-indicator"
                            name="solar:check-square-bold"
                        />

                        <Icon 
                            v-else
                            class="guessed-indicator"
                            name="solar:close-square-bold-duotone"
                        />
                    </span>
                </div>

                <div v-if="won" class="clue-container winner">
                    <span class="label">Winner</span>

                    <div class="content-row">
                        <p class="caption">Player</p>

                        <p>{{ targetPlayer.name }}</p>
                    </div>

                    <div class="content-row">
                        <p class="caption">Guesses</p>

                        <p>{{ currentGuessNumber - 1 }} / 6</p>
                    </div>

                    <p class="caption splitter">Nice win - Ready to go again?</p>

                    <p v-if="gamesRemainingToday === 0">Come back tomorrow for another try!!!</p>

                    <button v-else class="button secondary full" @click="startNewGame">New Game</button>
                </div>

                <div v-else-if="gameOver && !won" class="clue-container loser">
                    <span class="label">Loser</span>

                    <div class="content-row">
                        <p class="caption">Player</p>

                        <p>{{ targetPlayer.name }}</p>
                    </div>

                    <div class="content-row">
                        <p class="caption">Guesses</p>

                        <p>Failure</p>
                    </div>

                    <p class="caption splitter">Unlucky - Try again on the next game</p>

                    <p v-if="gamesRemainingToday === 0">Come back tomorrow for another try!!!</p>

                    <button v-else class="button danger full" @click="startNewGame">New Game</button>
                </div>

                <div v-else class="clue-container">
                    <span class="label">Clues</span>

                    <div v-for="(row, rowIndex) in cluesGrid" :key="rowIndex" class="clues-row">
                        <div v-for="(clue, colIndex) in row" :key="colIndex" class="clue-item">
                            <p v-if="rowIndex * 3 + colIndex >= clues.length" class="clue-icon">{{ rowIndex * 3 + colIndex + 1 }}</p>

                            <template v-else>
                                <span class="clue-title">{{ getClueTitle(rowIndex * 3 + colIndex) }}</span>
                                <span class="clue">{{ clue }}</span>
                            </template>
                        </div>
                    </div>
                </div>
            </template>

            <div v-if="gameSummaries.length > 0 && alreadyPlayed" class="clue-container" :key="gameSummaries.length">
                <span class="label">Game Over</span>

                <div v-for="(summary, index) in [...gameSummaries].reverse()" :key="index" class="prev-games">
                    <p class="caption">Game {{ index + 1 }}</p>
                    <span class="summary-row">
                        <p>{{ summary.targetPlayer.name }}</p>

                        <p v-if="summary.won">{{ summary.guesses.length }} / 6</p>
                        <p v-else>Failed</p>
                    </span>
                </div>

                <div class="row">  
                    <nuxt-link class="button primary full" to="/stats">Stats</nuxt-link>

                    <nuxt-link class="button primary full" to="/leaderboard">Leaderboard</nuxt-link>
                </div>

                <HeadingSeparator text="or" class="subtle"/>

                <div class="game-over-cta">
                    <nuxt-link class="link caption" to="/">
                        Home

                        <Icon name="solar:alt-arrow-right-linear"/>
                    </nuxt-link>
                </div>
            </div>

            <GameOverModal :darkMode="darkMode" :isOpen="isGameOverModalOpen" :won="won" :targetPlayer="targetPlayer"
                :guesses="guesses" :alreadyPlayed="alreadyPlayed" :difficulty="currentDifficulty"
                @close="closeGameOverModal" @newGame="startNewGame" />
        </template>
    </div>
</template>

<script setup>
	import { ref, computed, onMounted, defineEmits, onUnmounted, nextTick } from 'vue';
	import { usePlayerStore } from '~/stores/players';
	import { useStatsStore } from '~/stores/stats';
	import GameOverModal from '~/components/GameOverModal.vue';
	import { doc, setDoc, getDoc } from 'firebase/firestore'; // Import firebase functions
	import { v4 as uuidv4 } from 'uuid';

    const { $firestore: db } = useNuxtApp();
    const loading = ref(true);

    const DIFFICULTY = {
        EASY: 1,
        MEDIUM: 2, 
        HARD: 3
    };

    const getOrCreateUserId = () => {
        if (process.client) { // Check if running on the client
            let userId = localStorage.getItem('userId');
            if (!userId) {
                userId = uuidv4();
                localStorage.setItem('userId', userId);
            }
            return userId;
        } else {
            return null; // or generate a server-side ID if needed.
        }
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

    const currentGame = computed(() => {
        switch (currentDifficulty.value) {
            case DIFFICULTY.EASY: return '1';
            case DIFFICULTY.MEDIUM: return '2';
            case DIFFICULTY.HARD: return '3';
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

    onMounted(async () => {
        if (process.client) { // Check if running on the client
            checkDailyPlay();
            window.addEventListener('keydown', handleDesktopKeyPress);
        }

        if (process.client) { // Check if running on the client
            const storedSummaries = localStorage.getItem('gameSummaries');
            if (storedSummaries) {
                gameSummaries.value = JSON.parse(storedSummaries);
            }
        }

        await playerStore.fetchPlayers();
        await loadStats();

        if (!gameOver.value && playerStore.players && playerStore.players.length > 0) {
            currentDifficulty.value = getCurrentDifficulty();
            targetPlayer.value = playerStore.getRandomPlayerByDifficulty(currentDifficulty.value);
            clues.value.push(generateClues(targetPlayer.value, currentDifficulty.value)[0]);
        }

        await nextTick();
        loading.value = false;
    });

    onUnmounted(() => {
        if (process.client) { // Check if running on the client
            window.removeEventListener('keydown', handleDesktopKeyPress);
        }
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

    const checkDailyPlay = () => {
        if (process.client) { // Check if running on the client
            const today = new Date().toISOString().slice(0, 10);
            const storedLastPlayed = localStorage.getItem('lastPlayed');
            let playsToday = parseInt(localStorage.getItem('playsToday') || '0');

            if (storedLastPlayed !== today) {
                playsToday = 0;
                localStorage.setItem('playsToday', '0');
                localStorage.setItem('lastPlayed', today);
                resetGame();
                gameSummaries.value = [];
                localStorage.setItem('gameSummaries', JSON.stringify(gameSummaries.value));
            }

            if (playsToday >= 3) {
                gameOver.value = true;
                alreadyPlayed.value = true;
            } else {
                alreadyPlayed.value = false;
            }
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
        if (process.client) { // Check if running on the client
            const today = new Date().toISOString().slice(0, 10);
            localStorage.setItem('lastPlayed', today);
            localStorage.setItem('guesses', JSON.stringify(guesses.value));
            localStorage.setItem('won', JSON.stringify(won.value));
            localStorage.setItem('clues', JSON.stringify(clues.value));
            localStorage.setItem('currentDifficulty', currentDifficulty.value.toString());
        }
    };

    // Define clue sets per difficulty level
    const getClueTitle = (index) => {
        // Different clue sets based on difficulty
        const easyClueTitles = [
            'Club',
            'Initials',
            'Position',
            'Nationality',
            'Age',
            'Goals + Assists',
        ];

        const mediumClueTitles = [
            'Team Nickname',
            'Name',
            'Position',
            'Nationality',
            'Age Range',
            'Initials',
        ];

        const hardClueTitles = [
            'Kit Colour',
            'Position',
            'Nationality',
            'Age Range',
            'Games Played',
            'Name',
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

    const getAgeRange = (age) => {
        if (age < 23) return 'Under 23';
        if (age < 28) return '23-27';
        if (age < 32) return '28-31';
        return '32+';
    };

    const getContinent = (nationality) => {
        const europeanCountries = ['England', 'France', 'Spain', 'Germany', 'Italy', 'Portugal', 'Netherlands', 'Belgium', 'Scotland', 'Wales', 'Ireland', 'Republic of Ireland', 'Croatia', 'Serbia', 'Norway', 'Sweden', 'Denmark', 'Poland', 'Ukraine', 'Russia', 'Switzerland', 'Austria'];
        const southAmericanCountries = ['Brazil', 'Argentina', 'Uruguay', 'Colombia', 'Chile', 'Ecuador', 'Paraguay', 'Peru', 'Venezuela', 'Bolivia'];
        const africanCountries = ['Senegal', 'Ghana', 'Nigeria', 'Ivory Coast', 'Egypt', 'Morocco', 'Algeria', 'Tunisia', 'Cameroon', 'South Africa'];
        
        if (europeanCountries.includes(nationality)) return 'European';
        if (southAmericanCountries.includes(nationality)) return 'South American';
        if (africanCountries.includes(nationality)) return 'African';
        if (['USA', 'Canada', 'Mexico', 'Jamaica', 'Costa Rica', 'Honduras'].includes(nationality)) return 'North American';
        if (['Japan', 'South Korea', 'China', 'Australia', 'Saudi Arabia', 'Iran', 'Qatar', 'UAE', 'New Zealand'].includes(nationality)) return 'Asian/Oceania';
        
        return 'Other';
    };

    const kitColour = (team) => {
        const redColour = ['Arsenal', 'Liverpool', 'Man United', 'Forest'];
        const claretAndBlueColour = ['Aston Villa', 'West Ham'];
        const redAndBlackColour = ['Bournemouth'];
        const redAndWhiteColour = ['Brentford', 'Southampton'];
        const blueAndWhiteColour = ['Brighton'];
        const blueColour = ['Chelsea', 'Everton', 'Ipswich', 'Leicester', 'Man City'];
        const blueAndRedColour = ['Crystal Palace'];
        const whiteColour = ['Spurs', 'Fulham'];
        const blackAndWhiteColour = ['Newcastle'];
        const goldColour = ['Wolves'];

        
        if (redColour.includes(team)) return 'Red';
        if (claretAndBlueColour.includes(team)) return 'Claret & Blue';
        if (redAndBlackColour.includes(team)) return 'Red & Black';
        if (redAndWhiteColour.includes(team)) return 'Red & White';
        if (blueAndWhiteColour.includes(team)) return 'Blue & White';
        if (blueColour.includes(team)) return 'Blue';
        if (blueAndRedColour.includes(team)) return 'Blue & Red';
        if (whiteColour.includes(team)) return 'White';
        if (blackAndWhiteColour.includes(team)) return 'Black & White';
        if (goldColour.includes(team)) return 'Gold';
        
        return 'Other Colour';
    };

    const generateClues = (player, difficulty) => {
        const nameLength = player.name.split(' ')
            .map(part => '_'.repeat(part.length))
            .join('/');

        const nameInitials = player.name.split(' ')
            .map(part => part[0] + '_'.repeat(part.length - 1))
            .join(' ');

        const nameInitialsEnd = player.name.split(' ')
            .map(part => {
                if (part.length === 1) {
                    return part; // If it's just one letter, show it
                }
                return part[0] + '_'.repeat(part.length - 2) + part[part.length - 1];
            })
            .join(' ');

        switch (difficulty) {
            case DIFFICULTY.EASY:
                return [
                    `${player.team}`,
                    `${nameInitials}`,
                    `${player.position}`,
                    `${player.nationality}`,
                    `${player.age}`,
                    `${player.goalsAndAssists}`,
                ];
            case DIFFICULTY.MEDIUM:
                return [
                    `${player.nickname}`,
                    `${nameLength}`,
                    `${player.position}`,
                    `${player.nationality}`,
                    `${getAgeRange(player.age)}`,
                    `${nameInitialsEnd}`,
                ];
            case DIFFICULTY.HARD:
                return [
                    `${kitColour(player.team)}`,
                    `${player.position}`,
                    `${getContinent(player.nationality)}`,
                    `${getAgeRange(player.age)}`,
                    `${player.matchesPlayed}`,
                    `${nameInitials}`,
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

    const currentGuessNumber = computed(() => {
        return guesses.value.length + 1;
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
                resetStats();
            }
        } catch (e) {
            console.error("Error loading stats:", e);
            resetStats();
        }
    };

    const saveStats = async () => {
        try {
            await setDoc(doc(db, "users", userId.value), {
                stats: stats.value,
            });
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
        statsStore.stats.gamesPlayed++;

        // Update difficulty-specific stats
        switch (currentDifficulty.value) {
            case DIFFICULTY.EASY:
                statsStore.stats.easyGamesPlayed++;
                if (gameWon) {
                    statsStore.stats.easyGamesWon++;

                    if (guesses.value.length <= 2) {
                        statsStore.stats.totalPoints += 3;
                    } else if (guesses.value.length <= 4) {
                        statsStore.stats.totalPoints += 2;
                    } else {
                        statsStore.stats.totalPoints += 1;
                    }
                }
                break;
            case DIFFICULTY.MEDIUM:
                statsStore.stats.mediumGamesPlayed++;
                if (gameWon) {
                    statsStore.stats.mediumGamesWon++;

                    if (guesses.value.length <= 2) {
                        statsStore.stats.totalPoints += 6;
                    } else if (guesses.value.length <= 4) {
                        statsStore.stats.totalPoints += 4;
                    } else {
                        statsStore.stats.totalPoints += 2;
                    }
                }
                break;
            case DIFFICULTY.HARD:
                statsStore.stats.hardGamesPlayed++;
                if (gameWon) {
                    statsStore.stats.hardGamesWon++;

                    if (guesses.value.length <= 2) {
                        statsStore.stats.totalPoints += 9;
                    } else if (guesses.value.length <= 4) {
                        statsStore.stats.totalPoints += 6;
                    } else {
                        statsStore.stats.totalPoints += 3;
                    }
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

        if (process.client) { // Check if running on the client
            gameSummaries.value = gameSummaries.value || [];
            gameSummaries.value.unshift({
                targetPlayer: targetPlayer.value,
                guesses: guesses.value,
                won: gameWon,
                difficulty: currentDifficulty.value
            });

            gameSummaries.value = gameSummaries.value.slice(0, 3);
            localStorage.setItem('gameSummaries', JSON.stringify(gameSummaries.value));

            let playsToday = parseInt(localStorage.getItem('playsToday') || '0');
            playsToday++;
            localStorage.setItem('playsToday', playsToday.toString());
            checkDailyPlay();
        }
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
        if (process.client) { // Check if running on the client
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
        }
    };

    const closeGameOverModal = () => {
        isGameOverModalOpen.value = false;
    };

    const startNewGame = () => {
        if (process.client) { // Check if running on the client
            let playsToday = parseInt(localStorage.getItem('playsToday') || '0');
            if (playsToday >= 3) return;
        }

        guesses.value = [];
        currentGuess.value = '';
        gameOver.value = false;
        won.value = false;
        clues.value = [];

        currentDifficulty.value = getCurrentDifficulty();
        targetPlayer.value = playerStore.getRandomPlayerByDifficulty(currentDifficulty.value);
        isGameOverModalOpen.value = false;

        if (process.client) { // Check if running on the client
            saveGameData();
        }

        clues.value.push(generateClues(targetPlayer.value, currentDifficulty.value)[0]);
    };
</script>

<style lang="scss" scoped>
	.game {
		align-items: center;
		display: flex;
		flex-direction: column;
		max-width: 600px;
		padding: 2rem;
		width: 100vw;

        .game-info {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            margin-bottom: 1rem;
            width: 100%;
        }

        .opening-comms {
            padding-bottom: 1rem;
            text-align: center;
        }

		.guesses-input-container {
			display: flex;
			flex-direction: column;
			width: 100%;

			.previous-guess {
                align-items: center;
                color: var(--border);
				display: flex;
				flex-direction: row;
				justify-content: space-between;
				padding: .15rem .25rem;
				text-transform: uppercase;
				font-size: .65rem;
				letter-spacing: .1rem;

                .guessed-indicator {
                    height: 1.5rem;
                    width: 1.5rem;

                    &.i-carbon\:close {
                        color: var(--color-3);
                    }

                    &.i-carbon\:checkmark {
                        color: var(--color-2);
                    }
                }

				&.correct-guess {
                    color: var(--text-primary);
					font-weight: 500;
				}
			}

			.guess-container {
				margin-top: .4rem;
				position: relative;
				width: 100%;

				input {
					background-color: var(--background-secondary);
					border: 1px solid var(--border);
					border-bottom: 3px solid var(--border);
                    border-radius: var(--global-border-radius);
                    color: var(--text-primary);
					font-size: 1rem;
					letter-spacing: .1rem;
					padding: .75rem;
					text-transform: uppercase;
					width: 100%;

					&:focus {
						outline: none;
					}

                    &:not(:placeholder-shown) {
                        border-radius: var(--global-border-radius) var(--global-border-radius) 0 0;
						outline: none;
                    }
				}

				.suggestions {
					list-style: none;
					padding: 0;
					margin: 0;
					border: 1px solid var(--border);
                    border-radius: 0 0 var(--global-border-radius) var(--global-border-radius);
					background-color: var(--background-secondary);
                    color: var(--text-secondary);
					font-size: .8rem;
					max-height: 200px;
					overflow-y: auto;
					text-transform: uppercase;
					position: absolute;
					left: 0;
					top: calc(100% - 3px);
					width: 100%;
					z-index: 10;

					&:focus {
						outline: none;
					}
					
					li {
						display: flex;
						flex-direction: row;
						justify-content: space-between;
						letter-spacing: .1rem;
						padding: .5rem .75rem;
						cursor: pointer;

						&:hover {
							background-color: var(--background-secondary);
						}

						&:nth-child(even) {
							background-color: var(--background-primary);

							&:hover {
								background-color: var(--background-secondary);
							}
						}

						span {
							background-color: var(--danger);
						}
					}
				}
			}
		}

        .clue-container {
            position: absolute; 
            border: 1px solid var(--border);
            border-radius: var(--global-border-radius);
            bottom: 1rem;
            max-width: 600px;
            padding: 1rem;
            width: calc(100% - 4rem);

			.prev-games {
                border-radius: var(--global-border-radius-sm);
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

				.summary-row {
					display: flex;
					flex-direction: row;
					justify-content: space-between;
				}
			}

            &.winner {
                border: 2px solid var(--color-2);

                .label {
                    color: var(--color-2);
                    font-weight: 500;
                }

                .splitter {
                    border-top: 1px solid var(--color-2);
                    margin-top: .5rem;
                    padding: .5rem 0;
                    text-align: center;
                    width: 100%;
                }
            }

            &.loser {
                border: 2px solid var(--color-3);

                .label {
                    color: var(--color-3);
                    font-weight: 500;
                }

                .splitter {
                    border-top: 1px solid var(--color-3);
                    margin-top: .5rem;
                    padding: .5rem 0;
                    text-align: center;
                    width: 100%;
                }
            }

            .section {
                padding: .5rem;
                text-align: center;
                width: 100%;
            }

            .row {
                display: flex;
                gap: .5rem;
                margin-top: 1rem;
                text-align: center;
                width: 100%;
            }

            .content-row {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
            }
            .game-over-cta{
                align-items: center;
                display: flex;
                justify-content: center;
                width: 100%;

                a {
                    width: fit-content;
                }
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

            .clues-row {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                width: 100%;

                .clue-item {
                    align-items: center;
                    display: flex;
                    flex-direction: row;
                    gap: .5rem;
                    height: 1rem;
                    justify-content: space-between;
                    padding: 1rem 0;
                    text-align: center;
                    width: 100%;

                    .clue-icon {
                        font-size: 1rem;
                        margin: 0 auto;
                    }

                    .clue {
                        font-size: 1rem;
                        letter-spacing: 2px;
                    }

                    .clue-title {
                        font-size: .75rem;
                    }
                }
            }
        }

		.clues {
			background-color: var(--background-secondary);
			border: 1px solid var(--border);
            border-radius: var(--global-border-radius);
			bottom: 1rem;
			margin: 0 2rem;
			max-width: 600px;
			padding: .5rem;
			position: absolute;
			text-align: center;
			width: calc(100% - 4rem);

			h6 {
				padding-bottom: .5rem;
			}

			.win-message {
				background-color: var(--color-easy);
				border: 1px solid var(--border);
                border-radius: var(--global-border-radius-sm);
                color: var(--text-secondary);
				padding: .75rem;
				width: 100%;

				h4 {
					padding-bottom: 1rem;
				}

				p {
					padding-bottom: .5rem;
				}

				button {
					background-color: var(--success);
					border: 1px solid var(--color-easy);
                    border-radius: var(--global-border-radius-sm);
					color: var(--text-primary);
					padding: .75rem;
					width: 100%;
				}
			}

			.lose-message {
				background-color: var(--danger);
				border: 1px solid var(--border);
                border-radius: var(--global-border-radius-sm);
                color: var(--text-secondary);
				padding: .75rem;
				width: 100%;

				h4 {
					padding-bottom: 1rem;
				}

				p {
					padding-bottom: .5rem;
				}

				button {
					background-color: var(--color-hard);
					border: 1px solid var(--color-hard-hover);
                    border-radius: var(--global-border-radius-sm);
					color: var(--text-primary);
					padding: .75rem;
					width: 100%;
				}
			}

			.clues-grid {
				display: flex;
				flex-direction: column;
				width: 100%;

                .difficulty-badge {
                    border-radius: var(--global-border-radius) var(--global-border-radius) 0 0;
                }

				.clues-row {
					display: flex;
					flex-direction: column;
					justify-content: space-between;
					width: 100%;

                    &:last-child {
                        .clue-item {
                            &:last-child {
                                border-radius: 0 0 var(--global-border-radius-sm) var(--global-border-radius-sm);
                            }
                        }
                    }

					.clue-item {
						align-items: center;
						background-color: var(--background-primary);
						border: 1px solid var(--border);
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
							font-size: 1rem;
                            letter-spacing: 2px;
						}

						.clue-title {
							font-size: .75rem;
						}
					}
				}
			}
		}
	}
</style>