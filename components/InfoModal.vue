<template>
	<div 
		v-if="isOpen" 
		:class="{ 'dark': darkMode }"
		class="info-modal"
	>
		<div class="modal-content">
			<div class="modal-header">
				<h2>How to Play</h2>
					
				<Icon 
					class="close-button"
					name="carbon:close-filled" 
					@click="closeModal"
				/>
			</div>

			<div class="modal-body">
				<p class="description">You have 6 tries to guess the Premier League Footballer. The tiles will change colour to show you how close you get.</p>
				
				<div class="example">
					<div class="letter-box correct">
						<p>S</p>
					</div>
					<div class="letter-box">
						<p>A</p>
					</div>
					<div class="letter-box">
						<p>L</p>
					</div>
					<div class="letter-box">
						<p>A</p>
					</div>
					<div class="letter-box">
						<p>H</p>
					</div>
				</div>
				<p class="caption">The letter S is in the correct spot.</p>

				<div class="example">
					<div class="letter-box">
						<p>B</p>
					</div>
					<div class="letter-box">
						<p>O</p>
					</div>
					<div class="letter-box">
						<p>W</p>
					</div>
					<div class="letter-box present">
						<p>E</p>
					</div>
					<div class="letter-box">
						<p>N</p>
					</div>
				</div>
				<p class="caption">The letter E is in the player name but in the wrong spot.</p>

				<div class="example">
					<div class="letter-box">
						<p>V</p>
					</div>
					<div class="letter-box absent">
						<p>A</p>
					</div>
					<div class="letter-box">
						<p>R</p>
					</div>
					<div class="letter-box">
						<p>D</p>
					</div>
					<div class="letter-box">
						<p>Y</p>
					</div>
				</div>
				<p class="caption">The letter A is not in the player name in any spot.</p>
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
			background-color: rgba(50, 50, 50, 0.5);

			.modal-content {
				background-color: #1f1f1f;

				.modal-header{
					.close-button {
						color: #aeaeae;
					}
				}

				.modal-body {
					.example {
						.letter-box {
							background-color: #818080;
							border: 1px solid #000000;

							&.correct {
								background-color: #79a375;
								border-color: #000000;
							}

							&.present {
								background-color: #afa163;
								border-color: #000000;
							}

							&.absent {
								background-color: #535758;
								border-color: #000000;
							}
						}
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

				.description {
					padding-bottom: 1rem;
				}

				.example {
					align-items: center;
					display: flex;
					flex-direction: row;

					.letter-box {
						align-items: center;
						border: 1px solid #aaaaaa;
						border-radius: .25rem;
						display: flex;
						font-size: 1.2rem;
						justify-content: center;
						height: 3.5rem;
						text-transform: uppercase;
						width: 3.5rem;

						&.correct {
							background-color: #6aaa64;
							border-color: #6aaa64;
							color: white;
						}

						&.present {
							background-color: #c9b458;
							border-color: #c9b458;
							color: white;
						}

						&.absent {
							background-color: #787c7e;
							border-color: #787c7e;
							color: white;
						}
					}
				}
			}
		}
	}
</style>