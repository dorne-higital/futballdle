<template>
	<div 
		:class="{ 'dark': darkMode }"
		class="header"
	>
		<nuxt-link class="heading" to="/">Footballdle</nuxt-link>

		<div class="icons">
			<Icon 
				name="solar:menu-dots-square-outline" 
				@click="openMenu"
			/>
		</div>


	</div>

	<Menu :isVisible="menuOpen" @closeMenu="closeMenu" @navigate="handleNavigation"/>
</template>
  
<script setup>
	import { defineProps, defineEmits } from 'vue';
	import Menu from '@/components/Menu.vue';
  
	const props = defineProps({
        darkMode: {
            type: Boolean,
            default: false,
        },
	});

	const menuOpen = ref(false);
	
	const emit = defineEmits(['openLeaderboard', 'openStats', 'openInfo', 'openSettings', 'toggleDarkMode']);


	const openMenu = () => {
		menuOpen.value = true;
	};

	const closeMenu = () => {
		menuOpen.value = false;
	};

	const handleNavigation = (section) => {
		console.log(`Navigating to: ${section}`);
	};
</script>

<style lang="scss" scoped>
	.header {
		align-items: center;
		background-color: var(--color-1);
		display: flex;
		justify-content: space-between;
		padding: 1rem;
		width: 100%;
		z-index: 2;

		.heading {
			color: var(--text-secondary);
			font-family: "Ubuntu", serif;
			font-weight: 100;
			font-style: normal;
			font-size: 2rem;

			@media (max-width: 600px) {
				font-size: 1.75rem;
			}
		}

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