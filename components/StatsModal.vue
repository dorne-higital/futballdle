<template>
	<div 
		v-if="isOpen" 
		:class="{ 'dark': darkMode }"
		class="stats-modal"
	>
		<div class="modal-content">
			<div class="modal-header">
				<h3>Your Stats</h3>
					
				<Icon 
					class="close-button"
					name="carbon:close-filled" 
					@click="closeModal"
				/>
			</div>

			<div class="modal-body">
				<div class="stat-item">
					<p>Games Played: {{ stats.gamesPlayed }}</p>
				</div>

				<div class="stat-item">
					<p>Win Percentage: {{ winPercentage }}%</p>

					<div class="progress-bar">
						<div 
							:style="{ width: winPercentage + '%' }"
							class="progress" 
						></div>
					</div>
				</div>

				<div class="stat-item">
					<p>Win Streak: {{ stats.winStreak }}</p>

					<div class="streak-bars">
						<div 
							v-for="n in stats.winStreak" 
							:key="n"
							class="streak-bar" 
						></div>
					</div>
				</div>

				<div class="stat-item">
					<p>Max Win Streak: {{ stats.maxWinStreak }}</p>
					<div class="streak-bars">
						<div class="streak-bar max" v-for="n in stats.maxWinStreak" :key="n"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
  
<script setup>
	import { defineProps, defineEmits, computed } from 'vue';

	const isDarkMode = ref(false);
	
	const props = defineProps({
		isOpen: Boolean,
		stats: Object,
        darkMode: {
            type: Boolean,
            default: false,
        },
	});

	const emit = defineEmits(['close']);

	const closeModal = () => {
		emit('close');
	};

	onMounted(() => {
		const storedDarkMode = localStorage.getItem('darkMode');
		if (storedDarkMode === 'true') {
			isDarkMode.value = true;
		}
	});

	const winPercentage = computed(() => {
		if (props.stats.gamesPlayed === 0) return 0;
		return Math.round((props.stats.gamesWon / props.stats.gamesPlayed) * 100);
	});
</script>
  
<style lang="scss" scoped>
	.stats-modal {
		align-items: center;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		height: 100%;
		justify-content: center;
		left: 0;
		position: fixed;
		top: 0;
		width: 100%;
		z-index: 1000;

		&.dark {
			background-color: rgba(50, 50, 50, 0.5);

			.modal-content {
				background-color: #1f1f1f;

				.modal-header{
					.close-button {
						color: #aeaeae;
					}
				}
			}
		}
	
		.modal-content {
			background-color: white;
			box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
			display: flex;
			flex-direction: column;
			gap: 1rem;
			padding: 1.25rem;
			width: 100%;
	
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
				display: flex;
				flex-direction: column;
				gap: .5rem;
		
				.progress-bar {
					background-color: #ff8181;
					border-radius: 0;
					height: 1rem;
					margin-top: 0.5rem;
					width: 100%;
		
					.progress {
						background-color: #4caf50;
						border-radius: 0.25rem;
						height: 100%;
					}
				}
		
				.streak-bars {
					display: flex;
					margin-top: 0.5rem;
			
					.streak-bar {
						background-color: #4caf50;
						border-radius: 0.25rem;
						height: 1rem;
						margin-right: 0.25rem;
						width: 0.5rem;
			
						&.max {
							background-color: #2196f3;
						}
					}
				}
			}
		}
	}
  </style>