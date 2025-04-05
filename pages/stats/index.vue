<template>
    <div class="stats-page">
        <StatsModal 
            :stats="userStats" 
            :darkMode="isDarkMode"
            :userId="userId"
        />
    </div>
</template>

<script setup>
import StatsModal from '../components/StatsModal.vue';
import { ref, onMounted, computed } from 'vue';
import { useNuxtApp } from '#app';
import { doc, getDoc } from 'firebase/firestore';

const isDarkMode = ref(false);
const userId = ref('');
const userStats = ref(null);

const { $firestore: db } = useNuxtApp();

onMounted(async () => {
    const storedDarkMode = localStorage.getItem('darkMode');
    if (storedDarkMode === 'true') {
        isDarkMode.value = true;
    }

    let storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
        storedUserId = generateUUID();
        localStorage.setItem('userId', storedUserId);
    }
    userId.value = storedUserId;

    if (userId.value) {
        await fetchStats();
    }
});

const fetchStats = async () => {
    try {
        const userDoc = await getDoc(doc(db, "users", userId.value));
        if (userDoc.exists()) {
            userStats.value = userDoc.data().stats;
        } else {
            console.log("User document does not exist.");
        }
    } catch (error) {
        console.error("Error fetching user stats:", error);
    }
};

</script>

<style lang="scss" scoped>
    .stats-page {
        height: 100vh;
        width: 100%;
    }
</style>