<template>
	<div :class="{ 'dark': darkMode }" class="leaderboard-modal">
	  <div class="modal-content">
		<div class="modal-header">
		  <h3>Leaderboard</h3>
		  <Icon 
			class="close-button"
			name="carbon:close-filled" 
			@click="closeModal"
		  />
		</div>
		
		<div class="modal-body">
		  <div class="leaderboard-list">
			<div class="leaderboard-header">
			  <span class="rank">Rank</span>
			  <span class="user-id">Player</span>
			  <span class="points">Points</span>
			</div>
			
			<div v-for="(player, index) in topPlayers" :key="index" 
				 class="leaderboard-item" 
				 :class="{ 'current-user': player.userId === currentUserId }">
			  <span class="rank">{{ index + 1 }}</span>
			  <span class="user-id">{{ formatUserId(player.userId, player) }}</span>
			  <span class="points">{{ player.points }}</span>
			</div>
			
			<!-- Separator if user is not in top 25 -->
			<div v-if="currentUserRank > 25" class="leaderboard-separator">...</div>
			
			<!-- Current user's position if not in top 25 -->
			<div v-if="currentUserRank > 25" class="leaderboard-item current-user">
			  <span class="rank">{{ currentUserRank }}</span>
			  <span class="user-id">{{ formatUserId(player.userId, player) }}</span>
			  <span class="points">{{ currentUserPoints }}</span>
			</div>
		  </div>
		</div>
	  </div>
	</div>
  </template>
  
  <script setup>
  import { ref, onMounted, defineProps, defineEmits, watch } from 'vue';
  import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
  import { useNuxtApp } from '#app';
  
  const props = defineProps({
	isOpen: Boolean,
	darkMode: Boolean,
	currentUserId: String
  });
  
  const emit = defineEmits(['close']);
  
  const topPlayers = ref([]);
  const currentUserRank = ref(0);
  const currentUserPoints = ref(0);
  const { $firestore: db } = useNuxtApp();
  
  const closeModal = () => {
	emit('close');
  };
  
  // Format user ID function (implement as needed)
const formatUserId = (userId, playerObj) => {
	if (playerObj && playerObj.displayName) {
		return playerObj.displayName;
	}
	// You may want to truncate long IDs or format them in some way
	return userId ? userId.substring(0, 15) + (userId.length > 15 ? '...' : '') : 'Unknown';
  };
  
const fetchLeaderboard = async () => {
  console.log("Fetching leaderboard data...");
  console.log("Current user ID:", props.currentUserId);
  
  try {
    // Get top 25 users by points
    const leaderboardQuery = query(
      collection(db, "users"),
      orderBy("stats.totalPoints", "desc"),
      limit(25)
    );
    
    console.log("Executing query...");
    const querySnapshot = await getDocs(leaderboardQuery);
    console.log("Query results:", querySnapshot.size, "documents");
    
    topPlayers.value = querySnapshot.docs.map((doc) => {
      const userData = doc.data();
      console.log("Document data:", doc.id, userData.stats?.totalPoints, userData.displayName);
      return {
        userId: doc.id,
        displayName: userData.displayName || null, // Include displayName if it exists
        points: userData.stats?.totalPoints || 0
      };
    });
    
    console.log("Top players:", topPlayers.value);
    
    // Rest of your code remains the same...
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
  }
};
  
  onMounted(() => {
	console.log("Leaderboard component mounted, isOpen:", props.isOpen);
	if (props.isOpen) {
	  fetchLeaderboard();
	}
  });
  
  // Watch for changes to isOpen prop
  watch(() => props.isOpen, (newVal) => {
	console.log("isOpen changed to:", newVal);
	if (newVal === true) {
	  fetchLeaderboard();
	}
  });
  </script>
  
  <style scoped>
  .leaderboard-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
  }
  
  .modal-content {
	background-color: white;
	border-radius: 8px;
	width: 90%;
	max-width: 500px;
	max-height: 80vh;
	overflow-y: auto;
  }
  
  .dark .modal-content {
	background-color: #1a1a1a;
	color: white;
  }
  
  .modal-header {
	padding: 15px;
	display: flex;
	justify-content: space-between;
	border-bottom: 1px solid #eee;
  }
  
  .dark .modal-header {
	border-bottom: 1px solid #333;
  }
  
  .close-button {
	cursor: pointer;
	font-size: 20px;
  }
  
  .modal-body {
	padding: 15px;
  }
  
  .leaderboard-list {
	width: 100%;
  }
  
  .leaderboard-header, .leaderboard-item {
	display: grid;
	grid-template-columns: 60px 1fr 80px;
	padding: 8px 0;
  }
  
  .leaderboard-header {
	font-weight: bold;
	border-bottom: 1px solid #eee;
  }
  
  .dark .leaderboard-header {
	border-bottom: 1px solid #333;
  }
  
  .leaderboard-item {
	border-bottom: 1px solid #f5f5f5;
  }
  
  .dark .leaderboard-item {
	border-bottom: 1px solid #222;
  }
  
  .leaderboard-separator {
	text-align: center;
	padding: 8px 0;
  }
  
  .current-user {
	background-color: rgba(0, 128, 255, 0.1);
	font-weight: bold;
  }
  
  .rank {
	text-align: center;
  }
  
  .points {
	text-align: right;
  }
  </style>
  