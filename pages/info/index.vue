<template>
	<section class="info-page">
		<h2>How to play</h2>
		<h6>Guess the Premier League player in 6 tries</h6>

		<div class="content">
			<HeadingSeparator text="Game" theme="color-1" />

			<ul>
				<li>
					<p>You get 3 games per day</p>
				</li>

				<li>
					<p>6 tries each game to guess the player</p>
				</li>

				<li>
					<p>Each game increases in difficulty</p>
				</li>

				<li>
					<p>Use the clues to your advantage</p>
				</li>
			</ul>

			<div class="clue-container">
				<span class="label">Clues</span>

				<div class="clues-row">
					<div class="clue-item">
						<span class="clue-title">Club</span>
						<span class="clue">Manchester United</span>
					</div>
					<div class="clue-item">
						<span class="clue-title">Nationality</span>
						<span class="clue">Portugal</span>
					</div>
					<div class="clue-item">
						<span class="clue-title">Age</span>
						<span class="clue">30</span>
					</div>
					<div class="clue-item">
						<span class="clue-title">Games Played</span>
						<span class="clue">23</span>
					</div>
					<div class="clue-item">
						<span class="clue-title">Position</span>
						<span class="clue">Midfielder</span>
					</div>
					<div class="clue-item">
						<span class="clue-title">Initials</span>
						<span class="clue">_____/________</span>
					</div>
				</div>
			</div>

			<HeadingSeparator text="Stats" theme="color-1" />

			<p>Don't forget to check your stats to see how you fair on each game.</p>

			<HeadingSeparator text="Leaderboard" theme="color-1" />

			<p>Check on the leaderboard and see how you stack up against other players.</p>

			<HeadingSeparator text="Ready to go?" theme="color-1" />

			<nuxt-link to="/game" class="button primary full">Play Now</nuxt-link>

		</div>
	</section>
</template>

<style lang="scss" scoped>
	.info-page {
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;

		.content {
			display: flex;
			flex-direction: column;
			gap: .5rem;
			margin: 1rem 0;
			width: 100%;

			ul {				
				li {
					padding: .25rem 0;
				}
			}

			.clue-container {
				position: relative; 
				border: 2px solid var(--color-3);
				border-radius: var(--global-border-radius);
				margin: 1rem 0;
				padding: 1rem;
				width: 100%;

				.label {
					background-color: var(--background-primary);
					color: var(--color-3);
					font-weight: 500;
					left: 50%;
					padding: 0 .75rem;
					position: absolute;
					text-transform: uppercase;
					top: 0;
					transform: translate(-50%, -50%);
				}

				.clues-row {
					display: flex;
					flex-direction: column;
					justify-content: space-between;
					width: 100%;

					.clue-item {
						align-items: center;
						display: flex;
						flex-direction: row;
						gap: .5rem;
						height: 1rem;
						justify-content: space-between;
						padding: 1rem 0;
						text-align: center;
						width: 100%;

						.clue-icon {
							font-size: 1rem;
							margin: 0 auto;
						}

						.clue {
							font-size: 1rem;
							letter-spacing: 2px;
						}

						.clue-title {
							font-size: .75rem;
						}
					}
				}
			}
		}
	}
</style>