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

	<Menu
		:isVisible="menuOpen"
		:userId="currentUserId"
		:initialDisplayName="userDisplayName"
		@closeMenu="closeMenu"
		@nameUpdated="handleNameUpdate"
		@navigate="handleNavigation"
	/>
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
	const currentUserId = ref(null);
	const userDisplayName = ref(null);
	
	const emit = defineEmits(['openLeaderboard', 'openStats', 'openInfo', 'openSettings', 'toggleDarkMode']);

    onMounted(() => {
        if (process.client) {
            currentUserId.value = localStorage.getItem('userId');
            userDisplayName.value = localStorage.getItem('playerDisplayName');
            console.log("Header - currentUserId:", currentUserId.value); // Add this line
            console.log("Header - userDisplayName:", userDisplayName.value); // Add this line
        }
	});
	
	const openMenu = () => {
		menuOpen.value = true;
	};

	const closeMenu = () => {
		menuOpen.value = false;
	};

	const handleNavigation = (section) => {
		console.log(`Navigating to: ${section}`);
	};

	const handleNameUpdate = (newName) => {
		userDisplayName.value = newName;
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