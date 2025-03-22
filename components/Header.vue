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

	const emit = defineEmits(['openLeaderboard', 'openStats', 'openInfo', 'toggleDarkMode']);


	const openLeaderboard = () => {
		emit('openLeaderboard');
	};

	const openStats = () => {
		emit('openStats');
	};

	const openInfo = () => {
		emit('openInfo');
	};

	const toggleDarkMode = () => {
		emit('toggleDarkMode');
	};
</script>

<style lang="scss" scoped>
	.header {
		align-items: center;
		border-bottom: 1px solid #cfcfcf;
		box-shadow: 0px 0px 15px 0px #d8d8d8;
		display: flex;
		justify-content: space-between;
		padding: 1rem;
		width: 100%;
		z-index: 2;

		.icons {
			display: flex;
			gap: .8rem;
			padding: 0.2rem 0.4rem;

			.iconify {
				height: 1.5rem;
				width: 1.5rem;
			}
		}
	}
</style>