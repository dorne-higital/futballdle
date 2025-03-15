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
				
					<div 
						v-for="(player, index) in topPlayers" 
						:key="index" 
						class="leaderboard-item" 
						:class="{ 'current-user': player.userId === currentUserId }"
					>
						<span class="rank">{{ index + 1 }}.</span>
						<span class="user-id">
							{{ formatUserId(player.userId, player) }}
							<Icon v-if="player.userId === currentUserId" name="carbon:user-avatar-filled-alt"/>
						</span>
						<span class="points">{{ player.points }}</span>
					</div>
					
					<!-- Separator if user is not in top 25 -->
					<div 
						v-if="currentUserRank > 25" 
						class="leaderboard-separator"
					>
						...
					</div>
					
					<!-- Current user's position if not in top 25 -->
					<div 
						v-if="currentUserRank > 25" 
						class="leaderboard-item current-user"
					>
						<span class="rank">{{ currentUserRank }}</span>
						<span class="user-id">
							{{ formatUserId(player.userId, player) }}
							<Icon v-if="player.userId === currentUserId" name="carbon:user-avatar-filled-alt"/>
						</span>
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
  
<style lang="scss" scoped>
	.leaderboard-modal {
		align-items: center;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		height: 100%;
		left: 0;
		position: fixed;
		top: 0;
		width: 100%;
		z-index: 1000;
  
		.modal-content {
			background-color: white;
			box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
			display: flex;
			flex-direction: column;
			gap: 1rem;
			padding: 1.25rem;
			width: 100%;
			max-width: 600px;

			.modal-header {
				align-items: center;
				display: flex;
				justify-content: space-between;

				.close-button {
					border: none;
					color: #292929;
					cursor: pointer;
					font-size: 1.75rem;
				}
			}

			.modal-body {
				.leaderboard-list {
					width: 100%;
  
					.leaderboard-header, .leaderboard-item {
						display: grid;
						font-weight: 400;
						grid-template-columns: 60px 1fr 80px;
						letter-spacing: .07rem;
						padding: 8px 0;

						.rank {
							text-align: center;
						}

						.points {
							text-align: right;
						}
					
						.user-id {
							align-items: center;
							display: flex;
							gap: .5rem;
						}
					}

					.leaderboard-header {
						font-size: .8rem;
						font-weight: 400;
						border-bottom: 1px solid #eee;
					}

					.leaderboard-item {
						border-bottom: 1px solid #f5f5f5;

						&.current-user {
							background-color: rgba(0, 128, 255, 0.1);
							font-weight: 600;
						}
						.points {
							padding-right: .5rem;
						}
					}
					
					.leaderboard-separator {
						text-align: center;
						padding: 8px 0;
					}
				}
			}
		}
	}
</style>
  