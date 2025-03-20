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

				<p class="descriptive-list">
					Clues will vary from:

					<br>
					<span class="tag-container">
						<span class="tag">Age</span>
						<span class="tag">Nationality</span>
						<span class="tag">Goals & Assists</span>
						<span class="tag">Club</span>
						<span class="tag">Position</span>
						<span class="tag">Games Played</span>
					</span>

				</p>

				<h5>The Game Types</h5>

				<p class="description">
					<span class="difficulty-badge difficulty-easy minimal">Easy</span> | 
					This will be a player from a "Big 6" club, and clues will be slightly easier to get.
				</p>

				<p class="description">
					<span class="difficulty-badge difficulty-medium minimal">Medium</span> |
					Clues will be slightly more cryptic, bit still very gettable. Players from this tend to come from top half, or established 
					Premier League teams not with the "Big 6".
				</p>

				<p class="description">
					<span class="difficulty-badge difficulty-hard minimal">Hard</span> |
					Clues will test your knowledge on Premier League teams. Players will come from less established teams.
				</p>

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

        &.dark {
            background-color: #292929;
            color: #FEFCFB;

            .modal-content {
                background-color: #292929;
                color: #FEFCFB;

                .modal-header {
                    background-color: #292929;
                    color: #FEFCFB;
                }
			}
		}
	
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
				display: flex;
				flex-direction: column;
				gap: .5rem;
				margin-bottom: 3.5rem;
				padding: 0 1rem 1rem;

				.description {
					padding-bottom: 1rem;
				}

				ul {
					padding-left: 1rem;
				}
			}
		}
	}
</style>