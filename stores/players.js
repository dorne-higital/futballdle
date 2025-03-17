// stores/players.js
import { defineStore } from 'pinia';
import { collection, getDocs } from 'firebase/firestore';
import { ref } from 'vue';

export const usePlayerStore = defineStore('players', () => {
    const players = ref([]);
    const { $firestore } = useNuxtApp();

    async function fetchPlayers() {
        try {
            console.log('Fetching players...'); 
            const querySnapshot = await getDocs(collection($firestore, 'players'));
            console.log('Query snapshot:', querySnapshot);
            players.value = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            console.log('Players fetched:', players.value);
        } catch (error) {
            console.error('Error fetching players:', error);
        }
    }

    function getRandomPlayer() {
        if (players.value.length === 0) {
            return null;
        }
        const randomIndex = Math.floor(Math.random() * players.value.length);
        console.log('Random index generated:', randomIndex);
        console.log('Player selected:', players.value[randomIndex]);
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

        console.log('Looking for players with difficulty:', difficulty);
        console.log('Players available:', players.value.length);
        
        // Filter players by difficulty level
        const filteredPlayers = players.value.filter(player => 
            Number(player.difficulty) === Number(difficulty)
        );

        console.log(`Found ${filteredPlayers.length} players for difficulty ${difficulty}`);
        
        // If no players found for this difficulty, fallback to any player
        if (filteredPlayers.length === 0) {
            console.warn(`No players found for difficulty ${difficulty}. Using random player.`);
            return getRandomPlayer();
        }
        
        const randomIndex = Math.floor(Math.random() * filteredPlayers.length);
        console.log(`Random ${difficulty} difficulty player selected:`, filteredPlayers[randomIndex]);
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