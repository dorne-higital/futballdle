<template>
	<div 
		:class="{ 'dark': darkMode }"
		class="header"
	>
		<h1>Footballdle</h1>

		<div class="icons">
			<Icon 
				name="carbon:trophy" 
				@click="openLeaderboard"
			/>

			<Icon 
				name="carbon:settings-adjust" 
				@click="openStats"
			/>

			<Icon 
				name="carbon:information" 
				@click="openInfo"
			/>

			<Icon 
				name="carbon:settings" 
				@click="openSettings"
			/>

			<!-- <Icon 
				v-if="isDarkMode"
				name="carbon:sun" 
				@click="toggleDarkMode"
			/> -->

			<!-- Hidden for now until work is done -->
			<!-- <Icon 
				v-else
				name="carbon:moon" 
				@click="toggleDarkMode"
			/> -->
		</div>
	</div>
</template>
  
<script setup>
	import { defineProps, defineEmits } from 'vue';
  
	const props = defineProps({
        darkMode: {
            type: Boolean,
            default: false,
        },
	});

	const emit = defineEmits(['openLeaderboard', 'openStats', 'openInfo', 'openSettings', 'toggleDarkMode']);


	const openLeaderboard = () => {
		emit('openLeaderboard');
	};

	const openStats = () => {
		emit('openStats');
	};

	const openInfo = () => {
		emit('openInfo');
	};

	const openSettings = () => {
		emit('openSettings');
	};

	const toggleDarkMode = () => {
		emit('toggleDarkMode');
	};
</script>

<style lang="scss" scoped>
	.header {
		align-items: center;
		background-color: var(--background-primary);
		border-bottom: 1px solid var(--background-secondary);
		box-shadow: 0px 0px 15px 0px var(--background-secondary);
		display: flex;
		justify-content: space-between;
		padding: 1rem;
		width: 100%;
		z-index: 2;

		.icons {
			display: flex;
			gap: .8rem;
			padding: .2rem .4rem;

			.iconify {
				color: var(--text-primary);
				height: 1.5rem;
				width: 1.5rem;
			}
		}
	}
</style>