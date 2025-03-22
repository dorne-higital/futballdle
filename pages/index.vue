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
            @openLeaderboard="openLeaderboard"
            @openStats="openStats"
            @openInfo="openInfo"
            @toggleDarkMode="toggleDarkMode"
        />

        <Game 
            :darkMode="isDarkMode"
        />

        <Leaderboard
            v-if="isLeaderboardModalOpen"
            :isOpen="isLeaderboardModalOpen"
            :darkMode="isDarkMode"
            :currentUserId="userId"
            @close="closeLeaderboardModal"
        />

        <StatsModal 
            :darkMode="isDarkMode"
            :isOpen="isStatsOpen" 
            :stats="gameStats" 
            :userId="userId"
            @close="closeStats" 
            @nameUpdated="handleNameUpdate"
        />

        <InfoModal 
            :darkMode="isDarkMode"
            :isOpen="isInfoModalOpen" 
            @close="closeInfoModal" 
        />
    </div>
</template>
  
<script setup>
    import { ref, onMounted, computed } from 'vue';
    import Game from '../components/Game.vue';
    import Leaderboard from '../components/Leaderboard.vue';
    import StatsModal from '../components/StatsModal.vue';
    import InfoModal from '../components/InfoModal.vue';
    import Header from '../components/Header.vue';
    import Loader from '../components/Loader.vue';
    import { usePlayerStore } from '~/stores/players';
    import { useStatsStore } from '~/stores/stats';

    const isLoading = ref(true);
    const isLeaderboardModalOpen = ref(false);
    const isStatsOpen = ref(false);
    const isInfoModalOpen = ref(false);
    const isDarkMode = ref(false);
    const playerStore = usePlayerStore();
    const statsStore = useStatsStore();
    const userId = ref('');
    
    const gameStats = computed(() => {
        return statsStore.getStats;
    });

    onMounted(() => {
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

        setTimeout(() => {
            isLoading.value = false;
        }, 1500);
    });

    const handleNameUpdate = (newName) => {
        console.log("User display name updated:", newName);
    };

    const openLeaderboard = () => {
        isLeaderboardModalOpen.value = true;
    };

    const closeLeaderboardModal = () => {
        isLeaderboardModalOpen.value = false;
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
    }
</style>