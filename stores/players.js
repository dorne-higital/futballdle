// stores/players.js
import { defineStore } from 'pinia';

export const usePlayerStore = defineStore('players', {
  state: () => ({
    players: [
      {
        name: 'Salah',
        age: 31,
        nationality: 'Egypt',
        careerClubGoals: 230,
        position: 'Forward',
        league: 'Premier League',
        club: 'Liverpool',
      },
      {
        name: 'James',
        age: 23,
        nationality: 'England',
        careerClubGoals: 10,
        position: 'Defender',
        league: 'Premier League',
        club: 'Chelsea',
      },
      {
        name: 'Vardy',
        age: 36,
        nationality: 'England',
        careerClubGoals: 170,
        position: 'Forward',
        league: 'Premier League',
        club: 'Leicester City',
      },
      {
        name: 'Bowen',
        age: 26,
        nationality: 'England',
        careerClubGoals: 80,
        position: 'Forward',
        league: 'Premier League',
        club: 'West Ham United',
      },
      {
        name: 'Toney',
        age: 27,
        nationality: 'England',
        careerClubGoals: 150,
        position: 'Forward',
        league: 'Premier League',
        club: 'Brentford',
      },
      {
        name: 'Gakpo',
        age: 24,
        nationality: 'Netherlands',
        careerClubGoals: 60,
        position: 'Forward',
        league: 'Premier League',
        club: 'Liverpool',
      },
    ],
  }),
  getters: {
    getRandomPlayer: (state) => () => { // Convert to function that returns a function
      const randomIndex = Math.floor(Math.random() * state.players.length);
      console.log("Random index generated:", randomIndex);
      console.log("Player selected:", state.players[randomIndex]);
      return state.players[randomIndex];
    },
    getPlayerDetails: (state) => (playerName) => {
      return state.players.find((player) => player.name === playerName) || {};
    },
  },
});