<template>
    <!-- <div 
        v-if="isLoading" 
        class="loader-container"
    >
        <Loader />
    </div> -->

    <section 
        :class="{ 'dark': isDarkMode }"
        class="content-container"
    >
        <div v-if="alreadyPlayed" class="game-summaries-container content">
            <p>It looks like you have already played. See your scores for today, and come back tomorrow for more games.</p>
            <div v-for="(summary, index) in [...gameSummaries].reverse()" :key="index" :class="{ 'game-won': summary.won, 'game-lost': !summary.won }" class="prev-games">
                <h1 class="game-number">
                    <span class="">{{ index + 1 }}</span>
                </h1>
                <span class="summary-row">
                    <p>{{ summary.targetPlayer.name }}</p>
                    <p v-if="summary.won">{{ summary.guesses.length }} / 6</p>
                    <p v-else>Failed</p>
                </span>
            </div>
        </div>

        <div v-else class="content">
            <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est eopksio laborum.</p>

            <nuxt-link to="/game" class="button secondary full">Play Now</nuxt-link>

            <HeadingSeparator text="or" theme="subtle"/>

            <nuxt-link to="/info" class="link caption">
                Learn how to play

                <Icon name="solar:alt-arrow-right-linear"/>
            </nuxt-link>
        </div>

        <div v-if="statsExist" class="stat-block">
            <HeadingSeparator text="Stats" />

            <div class="stats">
                <div class="item">
                    <h1 class="hero">{{ totalGamesPlayed }}</h1>
                    <p class="caption">Played</p>
                </div>
                <div class="item">
                    <h1 class="hero">{{ totalGamesWon }}</h1>
                    <p class="caption">Won</p>
                </div>
                <div class="item">
                    <h1 class="hero">{{ totalGamesLost }}</h1>
                    <p class="caption">Lost</p>
                </div>
            </div>

            <nuxt-link to="/stats" class="link caption">
                View all

                <Icon name="solar:alt-arrow-right-linear"/>
            </nuxt-link>
        </div>

        <!-- <Leaderboard
            :darkMode="isDarkMode"
            :currentUserId="userId"
            @close="closeLeaderboardModal"
        /> -->
    </section>
</template>
  
<script setup>
    import { ref, onMounted, computed } from 'vue';
    import Game from '../components/Game.vue';
    import Leaderboard from '../components/Leaderboard.vue';
    import HeadingSeparator from '../components/HeadingSeparator.vue';
    import StatsModal from '../components/StatsModal.vue';
    import InfoModal from '../components/InfoModal.vue';
    import SettingsModal from '../components/SettingsModal.vue';
    import Header from '../components/Header.vue';
    import Loader from '../components/Loader.vue';
    import { usePlayerStore } from '~/stores/players';
    import { useStatsStore } from '~/stores/stats';
    import { useNuxtApp } from '#app';
    import { doc, getDoc } from 'firebase/firestore';

    const isLoading = ref(true);
    const isStatsOpen = ref(false);
    const isInfoModalOpen = ref(false);
    const isSettingsModalOpen = ref(false);
    const isDarkMode = ref(false);
    const playerStore = usePlayerStore();
    const statsStore = useStatsStore();
    const userId = ref('');
    const totalGamesPlayed = ref(0);
    const totalGamesWon = ref(0);
    const totalGamesLost = ref(0);
    const statsExist = ref(false);
    const alreadyPlayed = ref(false);
    const gameSummaries = ref([]);

    const { $firestore: db } = useNuxtApp();
    
    const gameStats = computed(() => {
        return statsStore.getStats;
    });

    const fetchStats = async () => {
        try {
            const userDoc = await getDoc(doc(db, "users", userId.value));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.stats) {
                    totalGamesPlayed.value = userData.stats.gamesPlayed || 0;
                    totalGamesWon.value = userData.stats.gamesWon || 0;
                    totalGamesLost.value = userData.stats.gamesLost || 0;
                    statsExist.value = true;
                } else {
                    statsExist.value = false;
                }
            } else {
                statsExist.value = false;
            }
        } catch (error) {
            console.error("Error fetching user stats:", error);
        }
    };

    onMounted(async() => {
        const storedDarkMode = localStorage.getItem('darkMode');
        if (storedDarkMode === 'true') {
            isDarkMode.value = true;
        }

        let storedUserId = localStorage.getItem('userId');
        if (!storedUserId) {
            // Generate a new UUID for the user
            storedUserId = generateUUID(); // You'll need to implement this function
            localStorage.setItem('userId', storedUserId);
        }
        userId.value = storedUserId;

        if (userId.value) {
            await fetchStats();
        }

        setTimeout(() => {
            isLoading.value = false;
        }, 1500);


        // load game summaries
        const storedSummaries = localStorage.getItem('gameSummaries');
        if (storedSummaries) {
            gameSummaries.value = JSON.parse(storedSummaries);
        }

        checkDailyPlay();
    });


    const checkDailyPlay = () => {
        const today = new Date().toISOString().slice(0, 10);
        const storedLastPlayed = localStorage.getItem('lastPlayed');
        let playsToday = parseInt(localStorage.getItem('playsToday') || '0');

        if (storedLastPlayed !== today) {
            playsToday = 0;
            localStorage.setItem('playsToday', '0');
            localStorage.setItem('lastPlayed', today);
            gameSummaries.value = []; // Clear the summaries
            localStorage.setItem('gameSummaries', JSON.stringify(gameSummaries.value)); // Save the cleared summaries
        }

        if (playsToday >= 3) {
            alreadyPlayed.value = true;
        } else {
            alreadyPlayed.value = false;
        }
    };


    const handleNameUpdate = (newName) => {
        console.log("User display name updated:", newName);
    };

    const openStats = () => {
        isStatsOpen.value = true;
    };

    const closeStats = () => {
        isStatsOpen.value = false;
    };

    const openInfo = () => {
        isInfoModalOpen.value = !isInfoModalOpen.value;
    };

    const closeInfoModal = () => {
        isInfoModalOpen.value = false;
    };

    const openSettings = () => {
        isSettingsModalOpen.value = !isSettingsModalOpen.value;
    };

    const closeSettingsModal = () => {
        isSettingsModalOpen.value = false;
    };

    const toggleDarkMode = () => {
        isDarkMode.value = !isDarkMode.value;
        console.log("Toggled");
        localStorage.setItem('darkMode', String(isDarkMode.value));
    };
</script>

<style lang="scss" scoped>
    .content-container {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
        padding: 2rem 1rem;

        .content {
            align-items: center;
            color: var(--text-primary);
            display: flex;
            flex-direction: column;
            gap: 1rem;
            text-align: center;

            .prev-games {
                border: 1px solid var(--border);
                border-radius: var(--global-border-radius);
                display: flex;
                flex-direction: row;
                width: 100%;

                &.game-won {
                    .game-number {
                        background-color: var(--color-2);
                    }
                }

                &.game-lost {
                    .game-number {
                        background-color: var(--color-3);
                        color: var(--background-primary);
                    }
                }

                .game-number {
                    border-radius: var(--global-border-radius) 0 0 var(--global-border-radius);
                    font-weight: 400;
                    min-width: 3rem;
                    padding: 1.5rem 1rem;
                }

                .summary-row {
                    align-items: flex-start;
                    background-color: var(--background-secondary);
                    border-radius: 0 var(--global-border-radius) var(--global-border-radius) 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-around;
                    padding: 1rem;
                    width: 100%;
                }
            }
        }

        .stat-block {
            align-items: center;
            color: var(--text-primary);
            display: flex;
            flex-direction: column;
            text-align: center;

            .stats {
                display: flex;
                flex-direction: row;
                gap: .5rem;
                justify-content: space-evenly;
                margin-bottom: 1rem;
                padding: 0 1rem;
                width: 100%;

                .item {
                    align-items: center;
                    border-radius: var(--global-border-radius);
                    display: flex;
                    flex-direction: column;
                    padding: 1rem;
                    width: 33%;

                    p {
                        padding: .5rem;
                    }
                }
            }
        }
    }
</style>