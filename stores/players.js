// stores/players.js
import { defineStore } from 'pinia'; // Import defineStore

export const usePlayerStore = defineStore('players', {
	state: () => ({
	  players: [
		'SALAH',
		'JAMES',
		'FABIO',
		'VARDY',
		'BOWEN',
		'TONEY',
		'GAKPO',
	  ],
	  playerDetails: {
		SALAH: {
		  club: 'Liverpool',
		  position: 'Forward',
		  fact: 'Holds the record for most goals in a 38-game Premier League season.',
		},
		JAMES: {
		  club: 'Chelsea',
		  position: 'Defender',
		  fact: 'Known for his powerful crosses and defensive abilities.',
		},
		FABIO: {
		  club: 'Fulham',
		  position: 'Midfielder',
		  fact: 'A talented young midfielder with a bright future.',
		},
		VARDY: {
		  club: 'Leicester City',
		  position: 'Forward',
		  fact: 'A prolific goalscorer known for his pace and clinical finishing.',
		},
		BOWEN: {
		  club: 'West Ham United',
		  position: 'Forward',
		  fact: 'A versatile forward with excellent dribbling skills.',
		},
		TONEY: {
		  club: 'Brentford',
		  position: 'Forward',
		  fact: 'A prolific goalscorer known for his aerial ability.',
		},
		GAKPO: {
		  club: 'Liverpool',
		  position: 'Forward',
		  fact: 'A versatile forward with excellent dribbling and shooting abilities.',
		},
	  },
	}),
	getters: {
	  getRandomPlayer: (state) => {
		const today = new Date().toISOString().slice(0, 10);
		const seed = today.split('-').join('');
		const randomIndex = seed % state.players.length;
		return state.players[randomIndex];
	  },
	  getPlayerDetails: (state) => (playerName) => {
		return state.playerDetails[playerName] || {};
	  },
	},
  });