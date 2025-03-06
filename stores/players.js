// stores/players.js
import { defineStore } from 'pinia';
import { collection, getDocs } from 'firebase/firestore';

export const usePlayerStore = defineStore('players', () => {
    const players = ref([]);
    const { $firestore } = useNuxtApp();

	async function fetchPlayers() {
		try {
			console.log('Fetching players...'); // Add this line
			const querySnapshot = await getDocs(collection($firestore, 'players'));
			console.log('Query snapshot:', querySnapshot); // Add this line
			players.value = querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}));
			console.log('Players fetched:', players.value); // Add this line
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

    return {
        players,
        fetchPlayers,
        getRandomPlayer,
        getPlayerDetails,
    };
});