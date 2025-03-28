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
						<span class="avg-guesses">Avg G/W</span>
					</div>
				
					<div 
						v-for="(player, index) in topPlayers" 
						:key="index" 
						class="leaderboard-item" 
						:class="{ 'current-user': player.userId === currentUserId }"
					>
						<span class="rank">{{ index + 1 }}</span>
						<span class="user-id">
							{{ getPlayerDisplayName(player) }}
							<Icon v-if="player.userId === currentUserId" name="carbon:user-avatar-filled-alt"/>
						</span>
						<span class="points">{{ player.points }}</span>
						<span class="avg-guesses">{{ player.avgGuessesPerWin || 'N/A' }}</span>
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

				<sup>*Avg G/W calculates how many guesses it takes per game win. This does not count games that have lost. 
					If level on points, the person with the lowest Avg G/W will be ahead.</sup>
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
		try {
			const leaderboardQuery = query(
				collection(db, "users"),
				orderBy("stats.totalPoints", "desc"),
				limit(25)
			);
			
			const querySnapshot = await getDocs(leaderboardQuery);
			
			topPlayers.value = querySnapshot.docs.map((doc) => {
				const userData = doc.data();
				const displayName = userData.displayName || null;

				const guessesArray = userData.stats?.guessesPerWin || [];
				const totalGuesses = guessesArray.reduce((sum, guesses) => sum + guesses, 0);
				const avgGuessesPerWin = guessesArray.length > 0 ? (totalGuesses / guessesArray.length).toFixed(1) : 0; // Set to Infinity if no games played

				if (displayName) {
					displayNameCache.value.set(doc.id, displayName);
				}

				return {
					userId: doc.id,
					displayName: displayName,
					points: userData.stats?.totalPoints || 0,
					avgGuessesPerWin: avgGuessesPerWin, 
				};
			});

			// Sorting: First by points (desc), then by avg guesses (asc)
			topPlayers.value.sort((a, b) => {
				if (b.points !== a.points) {
					return b.points - a.points; // Higher points first
				}
				return a.avgGuessesPerWin - b.avgGuessesPerWin; // Lower avgGuessesPerWin first
			});

			saveDisplayNameCache();
						
			let currentUserFound = topPlayers.value.some(player => player.userId === props.currentUserId);
			
			if (!currentUserFound && props.currentUserId) {
				const userDoc = await getDoc(doc(db, "users", props.currentUserId));
				if (userDoc.exists()) {
					const userData = userDoc.data();
					currentUserPoints.value = userData.stats?.totalPoints || 0;
					currentUserDisplayName.value = userData.displayName || getPlayerDisplayName({userId: props.currentUserId});
					
					if (userData.displayName) {
						displayNameCache.value.set(props.currentUserId, userData.displayName);
						saveDisplayNameCache();
					}
					
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
		if (newVal === true) {
			fetchLeaderboard();
		}
	});
</script>
  
<style lang="scss" scoped>
	.leaderboard-modal {
		align-items: center;
		display: flex;
		justify-content: center;
		height: 100%;
		left: 0;
		position: fixed;
		top: 0;
		width: 100%;
		z-index: 1000;
		
		.modal-content {
			background-color: var(--background-primary);
			box-shadow: 0 4px 8px var(--background-secondary);
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
				background-color: var(--background-primary);
				border-bottom: 1px solid var(--background-secondary);
				box-shadow: 0px 0px 15px 0px var(--background-secondary);
				display: flex;
				justify-content: space-between;
				padding: 1rem;
				position: sticky;
				top: 0;
				z-index: 9999;
			}

			.modal-body {
				display: flex;
				flex-direction: column;
				justify-content: space-between;
				height: 100%;
				padding: 0 1rem 1rem;
				
				.leaderboard-list {
					border-radius: var(--global-border-radius);
					width: 100%;
  
					.leaderboard-header, .leaderboard-item {
						display: grid;
						font-weight: 400;
						grid-template-columns: 40px 1fr 50px 70px;
						letter-spacing: .07rem;
						padding: .75rem 0;

						.rank {
							text-align: center;
						}

						.points {
							text-align: center;
						}
					
						.user-id {
							align-items: center;
							display: flex;
							gap: .5rem;
						}

						.avg-guesses {
							text-align: center;
						}
					}

					.leaderboard-header {
						background-color: var(--info);
						border: 1px solid var(--link);
						border-radius: var(--global-border-radius) var(--global-border-radius) 0 0;
						color: var(--text-primary);
						font-size: .8rem;
						font-weight: 400;
					}

					.leaderboard-item {
						background-color: var(--background-primary);
						border: 1px solid var(--link);
						border-top: 0;
						color: var(--text-primary);

						&:nth-child(even) {
							background-color: var(--background-secondary);
						}

						&:last-child {
							border-radius: 0 0  var(--global-border-radius) var(--global-border-radius);
						}

						.rank {
							border-right: 1px solid var(--link);
						}

						&.current-user {
							font-weight: 500;
						}
					
						.user-id {
							padding-left: .5rem;
						}

						.points,
						.avg-guesses {
							border-left: 1px solid var(--link);
						}
					}
					
					.leaderboard-separator {
						text-align: center;
						padding: .5rem 0;
					}
				}
			}
		}
	}
</style>
  