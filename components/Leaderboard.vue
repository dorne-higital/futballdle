<template>
	<div :class="{ 'dark': darkMode }" class="leaderboard-modal">
		<div class="modal-content">
			<div class="modal-header">
				<h1>Leaderboard</h1>

				<Icon 
					class="close-button"
					name="carbon:close-filled" 
					@click="closeModal"
				/>
			</div>
		
			<div class="modal-body">
				<div class="leaderboard-list">
					<div class="leaderboard-header">
						<span class="rank"></span>
						<span class="user-id">Player</span>
						<span class="points">Pts</span>
					</div>
				
					<div 
						v-for="(player, index) in topPlayers" 
						:key="index" 
						class="leaderboard-item" 
						:class="{ 'current-user': player.userId === currentUserId }"
					>
						<span class="rank">{{ index + 1 }}.</span>
						<span class="user-id">
							{{ getPlayerDisplayName(player) }}
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
							{{ currentUserDisplayName }}
							<Icon name="carbon:user-avatar-filled-alt"/>
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
	import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
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
	const currentUserDisplayName = ref('');
	const { $firestore: db } = useNuxtApp();
	const displayNameCache = ref(new Map()); // Cache display names

	const closeModal = () => {
		emit('close');
	};

	// Get player display name with better fallback mechanism
	const getPlayerDisplayName = (player) => {
		// Check if player has a displayName in object
		if (player.displayName) {
			return player.displayName;
		}
		
		// Check if we have cached this player's display name
		if (displayNameCache.value.has(player.userId)) {
			return displayNameCache.value.get(player.userId);
		}
		
		// If this is the current user, check localStorage
		if (player.userId === props.currentUserId) {
			const localName = localStorage.getItem('playerDisplayName');
			if (localName) {
				// Cache it for future use
				displayNameCache.value.set(player.userId, localName);
				return localName;
			}
		}
		
		// Default to truncated ID
		return player.userId ? player.userId.substring(0, 15) + (player.userId.length > 15 ? '...' : '') : 'Anonymous Player';
	};

	// Load cached display names from localStorage
	const loadCachedDisplayNames = () => {
		const cachedNames = localStorage.getItem('displayNameCache');
		if (cachedNames) {
			try {
				const parsed = JSON.parse(cachedNames);
				displayNameCache.value = new Map(Object.entries(parsed));
			} catch (e) {
				console.error("Error parsing cached display names:", e);
			}
		}
	};

	// Save display name cache to localStorage
	const saveDisplayNameCache = () => {
		const cacheObj = Object.fromEntries(displayNameCache.value);
		localStorage.setItem('displayNameCache', JSON.stringify(cacheObj));
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
				const displayName = userData.displayName || null;
				
				// Cache any display names we find
				if (displayName) {
					displayNameCache.value.set(doc.id, displayName);
				}
				
				return {
					userId: doc.id,
					displayName: displayName,
					points: userData.stats?.totalPoints || 0
				};
			});
			
			// Save updated display name cache
			saveDisplayNameCache();
			
			console.log("Top players:", topPlayers.value);
			
			// Find current user's rank and points if not in top 25
			let currentUserFound = topPlayers.value.some(player => player.userId === props.currentUserId);
			
			if (!currentUserFound && props.currentUserId) {
				// Fetch current user info
				const userDoc = await getDoc(doc(db, "users", props.currentUserId));
				if (userDoc.exists()) {
					const userData = userDoc.data();
					currentUserPoints.value = userData.stats?.totalPoints || 0;
					currentUserDisplayName.value = userData.displayName || getPlayerDisplayName({userId: props.currentUserId});
					
					// Cache this display name
					if (userData.displayName) {
						displayNameCache.value.set(props.currentUserId, userData.displayName);
						saveDisplayNameCache();
					}
					
					// Count how many users have more points
					const rankQuery = query(
						collection(db, "users"),
						orderBy("stats.totalPoints", "desc")
					);
					
					const rankSnapshot = await getDocs(rankQuery);
					let rank = 1;
					
					for (const doc of rankSnapshot.docs) {
						if (doc.id === props.currentUserId) break;
						rank++;
					}
					
					currentUserRank.value = rank;
				}
			}
		} catch (error) {
			console.error("Error fetching leaderboard:", error);
		}
	};

	onMounted(() => {
		console.log("Leaderboard component mounted, isOpen:", props.isOpen);
		// Load cached display names first
		loadCachedDisplayNames();
		
		// Fetch current user's display name from localStorage immediately
		if (props.currentUserId) {
			const localName = localStorage.getItem('playerDisplayName');
			if (localName) {
				currentUserDisplayName.value = localName;
				displayNameCache.value.set(props.currentUserId, localName);
			}
		}
		
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
			height: 100%;
			overflow: scroll;
			position: absolute;
			top: 0;
			max-width: 600px;
			width: 100%;

			.modal-header {
				align-items: center;
				background-color: white;
				border-bottom: 1px solid #cfcfcf;
				display: flex;
				justify-content: space-between;
				padding: 1rem;
				position: sticky;
				top: 0;
				z-index: 9999;
			}

			.modal-body {
				padding: 0 1rem 1rem;
				
				.leaderboard-list {
					width: 100%;
  
					.leaderboard-header, .leaderboard-item {
						display: grid;
						font-weight: 400;
						grid-template-columns: 60px 1fr 80px;
						letter-spacing: .07rem;
						padding: .75rem 0;

						.rank {
							text-align: center;
						}

						.points {
							padding-right: .5rem;
							text-align: right;
						}
					
						.user-id {
							align-items: center;
							display: flex;
							gap: .5rem;
						}
					}

					.leaderboard-header {
						background-color: #6290f3;
						border: 1px solid #346eea;
						color: white;
						font-size: .8rem;
						font-weight: 400;
					}

					.leaderboard-item {
						background-color: #fafafa;
						border: 1px solid #346eea;
						border-top: 0;

						&:nth-child(even) {
							background-color: #ffffff;
						}

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
  