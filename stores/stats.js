// stores/stats.js
import { defineStore } from 'pinia';
import { ref, computed, onMounted } from 'vue';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNuxtApp } from '#app';
import { v4 as uuidv4 } from 'uuid';

export const useStatsStore = defineStore('stats', () => {
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

    const { $firestore: db } = useNuxtApp();
    const userId = ref(null);

    const getOrCreateUserId = () => {
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = uuidv4();
            localStorage.setItem('userId', userId);
        }
        return userId;
    };

    const loadStats = async () => {
        if (!userId.value) return; // Exit if userId is not yet available

        try {
            const docRef = doc(db, "users", userId.value);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                stats.value = docSnap.data().stats;
            } else {
                console.log("No such document!");
            }
        } catch (e) {
            console.error("Error loading stats:", e);
        }
    };

    const saveStats = async () => {
        if (!userId.value) return; // Exit if userId is not yet available

        try {
            await setDoc(doc(db, "users", userId.value), {
                stats: stats.value,
            });
        } catch (e) {
            console.error("Error saving stats:", e);
        }
    };

    const getStats = computed(() => stats.value);

    onMounted(async () => {
        userId.value = getOrCreateUserId();
        await loadStats();
    });

    return { stats, loadStats, saveStats, getStats };
});