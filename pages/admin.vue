<template>
	<div class="admin-page">
	  <h1>Add New Player</h1>
	  <form @submit.prevent="addPlayer">
		<div class="form-group">
		  <label for="name">Name:</label>
		  <input type="text" id="name" v-model="player.name" required />
		</div>

  
		<div class="form-group radio-group">
		  <label>Position:</label>
		  <div class="radio-options">
			<label>
			  <input type="radio" value="Goalkeeper" v-model="player.position" required />
			  Goalkeeper
			</label>
			<label>
			  <input type="radio" value="Defender" v-model="player.position" required />
			  Defender
			</label>
			<label>
			  <input type="radio" value="Midfielder" v-model="player.position" required />
			  Midfielder
			</label>
			<label>
			  <input type="radio" value="Forward" v-model="player.position" required />
			  Forward
			</label>
		  </div>
		</div>
  
		<div class="form-group">
		  <label for="team">Team:</label>
		  <input type="text" id="team" v-model="player.team" required />
		</div>
  
		<div class="form-group">
		  <label for="age">Age:</label>
		  <input type="number" id="age" v-model="player.age" required />
		</div>
  
		<div class="form-group">
		  <label for="yearBorn">Year Born:</label>
		  <input type="number" id="yearBorn" v-model="player.yearBorn" required />
		</div>
  
		<div class="form-group">
		  <label for="matchesPlayed">Matches Played:</label>
		  <input type="number" id="matchesPlayed" v-model="player.matchesPlayed" required />
		</div>
  
		<div class="form-group">
		  <label for="matchesStarted">Matches Started:</label>
		  <input type="number" id="matchesStarted" v-model="player.matchesStarted" required />
		</div>
  
		<div class="form-group">
		  <label for="minutesPlayed">Minutes Played:</label>
		  <input type="number" id="minutesPlayed" v-model="player.minutesPlayed" required />
		</div>
  
		<div class="form-group">
		  <label for="goalsScored">Goals Scored:</label>
		  <input type="number" id="goalsScored" v-model="player.goalsScored" required />
		</div>
  
		<div class="form-group">
		  <label for="assists">Assists:</label>
		  <input type="number" id="assists" v-model="player.assists" required />
		</div>
  
		<div class="form-group">
		  <label for="goalsAndAssists">Goals + Assists:</label>
		  <input type="number" id="goalsAndAssists" v-model="player.goalsAndAssists" required />
		</div>
  
		<div class="form-group">
		  <label for="yellowCards">Yellow Cards:</label>
		  <input type="number" id="yellowCards" v-model="player.yellowCards" required />
		</div>
  
		<div class="form-group">
		  <label for="redCards">Red Cards:</label>
		  <input type="number" id="redCards" v-model="player.redCards" required />
		</div>
  
		<div class="form-group">
		  <label for="expectedGoals">Expected Goals:</label>
		  <input type="number" id="expectedGoals" v-model="player.expectedGoals" required />
		</div>
  
		<button type="submit" class="submit-button">Add Player</button>
	  </form>
	  <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
	  <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
  
	  <h2>Bulk Upload Players</h2>
	  <input type="file" accept=".csv" @change="handleFileUpload" />
	  <button @click="uploadPlayers" :disabled="!csvData.length">Upload CSV</button>
	  <p v-if="uploadMessage">{{ uploadMessage }}</p>
	</div>
  </template>
  
  <script setup>
	import { ref, computed } from 'vue';
	import { collection, addDoc, writeBatch, doc } from 'firebase/firestore'; // Import doc
	import { useNuxtApp } from '#app';
	import Papa from 'papaparse';

	const { $firestore } = useNuxtApp();
  
  const player = ref({
	name: '',
	nationality: '',
	position: '',
	team: '',
	age: null,
	yearBorn: null,
	matchesPlayed: null,
	matchesStarted: null,
	minutesPlayed: null,
	goalsScored: null,
	assists: null,
	goalsAndAssists: null,
	yellowCards: null,
	redCards: null,
	expectedGoals: null,
  });
  
  const successMessage = ref('');
  const errorMessage = ref('');
  
  const nationalitySearch = ref('');
  
  const filteredCountries = computed(() => {
	if (!nationalitySearch.value) {
	  return countries;
	}
	return countries.filter((country) =>
	  country.toLowerCase().startsWith(nationalitySearch.value.toLowerCase())
	);
  });
  
  async function addPlayer() {
	try {
	  await addDoc(collection($firestore, 'players'), player.value);
	  successMessage.value = 'Player added successfully!';
	  errorMessage.value = '';
	  player.value = {
		name: '',
		age: null,
		nationality: '',
		careerClubGoals: null,
		position: '',
		league: '',
		club: '',
	  };
	} catch (error) {
	  console.error('Error adding player:', error);
	  errorMessage.value = 'Error adding player. Please try again.';
	  successMessage.value = '';
	}
  }
  
  const csvData = ref([]);
  const uploadMessage = ref('');
  
  function handleFileUpload(event) {
	const file = event.target.files[0];
	if (file) {
	  Papa.parse(file, {
		header: true,
		complete: (results) => {
		  csvData.value = results.data;
		},
		error: (error) => {
		  console.error('CSV parsing error:', error);
		  uploadMessage.value = 'Error parsing CSV file.';
		},
	  });
	}
  }
  
  async function uploadPlayers() {
  if (!csvData.value.length) return;

  try {
	const batch = writeBatch($firestore);
	csvData.value.forEach((player) => {
	  if (player.name) {
		const playerRef = collection($firestore, 'players');
		const docRef = doc(playerRef); // Create a new document reference
		batch.set(docRef, player); // Use batch.set to add the document
	  }
	});

	await batch.commit();
	uploadMessage.value = 'Players uploaded successfully!';
	csvData.value = [];
  } catch (error) {
	console.error('Error uploading players:', error);
	uploadMessage.value = 'Error uploading players. Please try again.';
  }
}

  </script>

<style lang="scss" scoped>
.admin-page {
	display: flex;
	flex-direction: column;
	padding: 2rem;
	max-width: 600px;
	margin: 0 auto;
	font-family: sans-serif;

	h1 {
		margin-bottom: 2rem;
		text-align: center;
		color: #333;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		width: 100%;
	}

	.form-group {
		display: flex;
		flex-direction: column;

		label {
			margin-bottom: 0.5rem;
			font-weight: 600;
			color: #555;
		}

		input[type="text"],
		input[type="number"] {
			padding: 0.75rem;
			border: 1px solid #ddd;
			font-size: 1rem;
			outline: none;

			&:focus {
				border-color: #007bff;
				box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
			}
		}
	}

	.radio-group {
		.radio-options {
			display: flex;
			gap: 1rem;
			flex-wrap: wrap;

			label {
				display: flex;
				align-items: center;
				gap: 0.5rem;
			}
		}
	}

	.submit-button {
		padding: 0.75rem 1.5rem;
		background-color: #007bff;
		color: white;
		border: none;
		font-size: 1rem;
		cursor: pointer;

		&:hover {
			background-color: #0056b3;
		}
	}

	.success-message {
		color: green;
		margin-top: 1rem;
		text-align: center;
	}

	.error-message {
		color: red;
		margin-top: 1rem;
		text-align: center;
	}
}
</style>