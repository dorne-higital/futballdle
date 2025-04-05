<template>
    <div :class="{ 'dark': darkMode }" class="leaderboard-modal">
        <PageHero 
            heading="Leaderboard"
            subheading="See how you stack up against other players"
            link="/"
            linkText="Home"
        />

        <div class="modal-content">
            <div class="modal-body">
                <div class="leaderboard-list">
                    <div class="leaderboard-header">
                        <p class="rank caption"></p>
                        <p class="user-id caption">Player</p>
                        <p class="points caption">Pts</p>
                        <p class="avg-guesses caption">Avg G/W</p>
                    </div>
                    <div v-for="(player, index) in sortedPlayers" :key="player.userId" class="leaderboard-item"
                        :class="{ 'current-user': player.userId === currentUserId }">
                        <span class="rank">{{ index + 1 }}</span>
                        <span class="user-id">
                            {{ player.displayName || player.userId.substring(0, 10) + (player.userId.length > 10 ? '...' : '') }}
                            <Icon v-if="player.userId === currentUserId" name="solar:user-bold" />
                        </span>
                        <span class="points">{{ player.points }}</span>
                        <span class="avg-guesses">{{ player.avgGuessesPerWin || 'N/A' }}</span>
                    </div>
                </div>
                <sup>*Avg G/W calculates how many guesses it takes per game win. This does not count games that have lost.
                    If level on points, the person with the lowest Avg G/W will be ahead.</sup>
            </div>
        </div>
    </div>
</template>

<script setup>
	import { ref, onMounted, defineProps, defineEmits, computed } from 'vue';
	import { collection, query, orderBy, getDocs } from 'firebase/firestore';
	import { useNuxtApp } from '#app';
	import PageHero from '../components/PageHero.vue';

	const props = defineProps({
		isOpen: Boolean,
		darkMode: Boolean,
		currentUserId: String,
	});

	const emit = defineEmits(['close']);

	const allPlayers = ref([]);
	const { $firestore: db } = useNuxtApp();

	const fetchAllPlayers = async () => {
		try {
			const playersQuery = query(collection(db, 'users'));
			const querySnapshot = await getDocs(playersQuery);

			allPlayers.value = querySnapshot.docs.map((doc) => {
				const userData = doc.data();
				const guessesArray = userData.stats?.guessesPerWin || [];
				const totalGuesses = guessesArray.reduce((sum, guesses) => sum + guesses, 0);
				const avgGuessesPerWin = guessesArray.length > 0 ? (totalGuesses / guessesArray.length).toFixed(1) : 0;

				return {
					userId: doc.id,
					displayName: userData.displayName,
					points: userData.stats?.totalPoints || 0,
					avgGuessesPerWin: avgGuessesPerWin,
				};
			});
		} catch (error) {
			console.error('Error fetching players:', error);
		}
	};

	const sortedPlayers = computed(() => {
		return allPlayers.value.slice().sort((a, b) => {
			if (b.points !== a.points) {
				return b.points - a.points;
			}
			return (a.avgGuessesPerWin || Infinity) - (b.avgGuessesPerWin || Infinity);
		});
	});

	onMounted(() => {
		fetchAllPlayers();
	});

	watch(() => props.isOpen, (newVal) => {
		if (newVal === true) {
			fetchAllPlayers();
		}
	});
</script>
  
<style lang="scss" scoped>
	.leaderboard-modal {
		align-items: center;
		display: flex;
		flex-direction: column;
		justify-content: center;
		left: 0;
		width: 100%;
		z-index: 1000;
		
		.modal-content {
			background-color: var(--background-primary);
			display: flex;
			flex-direction: column;
			gap: 1rem;
			height: 100%;
            margin-top: 1rem;
			max-width: 600px;
			width: 100%;

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
							justify-content: space-between;
							padding-right: .5rem;
						}

						.avg-guesses {
							text-align: center;
						}
					}

					.leaderboard-header {
						background-color: var(--border);
						border: 1px solid var(--border);
						border-radius: var(--global-border-radius) var(--global-border-radius) 0 0;
						color: var(--text-primary);
						font-size: .8rem;
						font-weight: 400;
					}

					.leaderboard-item {
						background-color: var(--background-primary);
						border: 1px solid var(--border);
						border-top: 0;
						color: var(--text-primary);

						&:nth-child(even) {
							background-color: var(--background-secondary);
						}

						&:last-child {
							border-radius: 0 0  var(--global-border-radius) var(--global-border-radius);
						}

						.rank {
							border-right: 1px solid var(--border);
						}

						&.current-user {
							font-weight: 500;
						}
					
						.user-id {
							padding-left: .5rem;
						}

						.points,
						.avg-guesses {
							border-left: 1px solid var(--border);
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
  