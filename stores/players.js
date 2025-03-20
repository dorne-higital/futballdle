// stores/players.js
import { defineStore } from 'pinia';
import { collection, getDocs } from 'firebase/firestore';
import { ref } from 'vue';

export const usePlayerStore = defineStore('players', () => {
    const players = ref([]);
    const { $firestore } = useNuxtApp();

    async function fetchPlayers() {
        try {
            const querySnapshot = await getDocs(collection($firestore, 'players'));
            players.value = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
        } catch (error) {
            console.error('Error fetching players:', error);
        }
    }

    function getRandomPlayer() {
        if (players.value.length === 0) {
            return null;
        }
        const randomIndex = Math.floor(Math.random() * players.value.length);
        return players.value[randomIndex];
    }

    function getPlayerDetails(playerName) {
        return players.value.find((player) => player.name === playerName) || {};
    }

    // New method to get player by difficulty level
    function getRandomPlayerByDifficulty(difficulty) {
        if (players.value.length === 0) {
            return null;
        }
        
        // Filter players by difficulty level
        const filteredPlayers = players.value.filter(player => 
            Number(player.difficulty) === Number(difficulty)
        );
        
        // If no players found for this difficulty, fallback to any player
        if (filteredPlayers.length === 0) {
            console.warn(`No players found for difficulty ${difficulty}. Using random player.`);
            return getRandomPlayer();
        }
        
        const randomIndex = Math.floor(Math.random() * filteredPlayers.length);
        return filteredPlayers[randomIndex];
    }

    return {
        players,
        fetchPlayers,
        getRandomPlayer,
        getPlayerDetails,
        getRandomPlayerByDifficulty,
    };
});