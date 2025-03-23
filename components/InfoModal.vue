<template>
	<div 
		v-if="isOpen" 
		:class="{ 'dark': darkMode }"
		class="info-modal"
	>
		<div class="modal-content">
			<div class="modal-header">
				<h1>Footballdle</h1>
					
				<Icon 
					class="close-button"
					name="carbon:close-filled" 
					@click="closeModal"
				/>
			</div>

			<div class="modal-body">
				<p class="description">
					You have 6 tries to guess the Premier League Footballer.
				</p>

				<p class="description">
					You will receive a new clue after every guess. These clues are not aimed to give you the answer, but to guide you in the right direction.
				</p>

				<p class="description">
					Clues will differ depending on the difficulty of the game. Some of the clues will be:
				</p>

				<div class="clue-list">
					<p>Clues</p>

					<div class="clues tag-container">
						<span class="tag">Age</span>
						<span class="tag">Nationality</span>
						<span class="tag">Goals & Assists</span>
						<span class="tag">Club</span>
						<span class="tag">Position</span>
						<span class="tag">Games Played</span>
					</div>
				</div>

				<p class="description">
					There are 3 rounds to play each day, these will increase in difficulty after each game.
				</p>

				<div class="difficulty-badge difficulty-easy info-game">
					<span class="minimal">Easy</span>

					<p class="caption">This will be a player from a "Big 6" club, and clues will be slightly easier to get.</p>
				</div>

				<div class="difficulty-badge difficulty-medium info-game">
					<span class="minimal">Medium</span>

					<p class="caption">Clues will be slightly more cryptic, bit still very gettable. Players from this tend to come from top half, or established 
					Premier League teams, not the "Big 6".</p>
				</div>

				<div class="difficulty-badge difficulty-hard info-game">
					<span class="minimal">Hard</span>

					<p class="caption">Clues will test your knowledge on Premier League teams. Players will come from less established teams.</p>
				</div>

				<p class="caption">Ready to go?</p>

				<button
					class="button primary"
					@click="closeModal"
				>
					Play Now
				</button>
			</div>
		</div>
	</div>
</template>
  
<script setup>
	import { defineProps, defineEmits } from 'vue';

	const props = defineProps({
	isOpen: Boolean,
		darkMode: {
			type: Boolean,
			default: false,
		},
	});

	const emit = defineEmits(['close']);

	const closeModal = () => {
		emit('close');
	};
</script>

  
<style lang="scss" scoped>
	.info-modal {
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
				box-shadow: 0px 0px 15px 0px #d8d8d8;
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
				gap: 1rem;
				margin-bottom: 3.5rem;
				padding: 0 1rem 1rem;
				text-align: center;

				.clue-list {
					align-items: center;
					background-color: #f0f0f0;
					border: 1px solid #cfcfcf;
					border-radius: .5rem;
					display: flex;
					flex-direction: column;
					padding: .5rem;
				}

				.info-game {
					align-items: center;
					display: flex;
					flex-direction: column;
					gap: .5rem;
					justify-content: center;
					text-align: center;

					p {
						background-color: #FEFCFB;
						border-radius: .25rem;
						margin: -.25rem;
						padding: .5rem .25rem;
					}
				}

				ul {
					padding-left: 1rem;
				}
			}
		}
	}
</style>