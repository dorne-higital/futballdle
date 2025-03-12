<template>
    <div v-if="isLoading" class="loader-container">
        <Loader />
    </div>
	<div 
		v-else
		:class="{ 'dark': isDarkMode }"
		class="container"
	>
		<Header
			:darkMode="isDarkMode"
			@openStats="openStats"
			@openInfo="openInfo"
			@toggleDarkMode="toggleDarkMode"
		/>

		<Game 
			:darkMode="isDarkMode"
			@stats-updated="loadStats" 
		/>

		<StatsModal 
			:darkMode="isDarkMode"
			:isOpen="isStatsOpen" 
			:stats="stats" 
			@close="closeStats" 
		/>

		<InfoModal 
			:darkMode="isDarkMode"
			:isOpen="isInfoModalOpen" 
			@close="closeInfoModal" 
		/>
	</div>
</template>
  
<script setup>
    import { ref, onMounted } from 'vue';
    import Game from '../components/Game.vue';
    import StatsModal from '../components/StatsModal.vue';
    import InfoModal from '../components/InfoModal.vue';
    import Header from '../components/Header.vue';
	import Loader from '../components/Loader.vue';

	const isLoading = ref(true);

    const stats = ref({
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        winStreak: 0,
        maxWinStreak: 0,
        lossStreak: 0,
        maxLossStreak: 0,
        guessesPerWin: [], // Add this line
        mostGuessedPlayer: {} // Add this line
    });

    const isStatsOpen = ref(false);
    const isInfoModalOpen = ref(false);
    const isDarkMode = ref(false);

    const loadStats = () => {
        const storedStats = JSON.parse(localStorage.getItem('stats'));
        if (storedStats) {
            stats.value = storedStats;
        }
    };

    onMounted(() => {
        loadStats();
        const storedDarkMode = localStorage.getItem('darkMode');
        if (storedDarkMode === 'true') {
            isDarkMode.value = true;
		}

		setTimeout(() => {
            isLoading.value = false;
        }, 1500);
    });

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

    const toggleDarkMode = () => {
        isDarkMode.value = !isDarkMode.value;
        localStorage.setItem('darkMode', String(isDarkMode.value));
    };
</script>

<style lang="scss" scoped>
    .container {
        align-items: center;
        display: flex;
        flex-direction: column;
        height: 100dvh;
        transition: background-color 0.3s, color 0.3s;
    }
</style>