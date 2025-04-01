<template>
    <section :class="{ 'dark': isDarkMode }" class="page-container">
        <Header :darkMode="isDarkMode" />
        <div class="page-content">
          <slot />
        </div>
    </section>
</template>

<script setup>
    const props = defineProps({
      isDarkMode: {
        type: Boolean,
        default: false,
      }
    })
</script>

<style lang="scss" scoped>
    .page-container {
        align-items: center;
        background-color: var(--background-primary);
        color: var(--text-primary);
        display: flex;
        flex-direction: column;
        height: 100dvh;
    }
    .page-content{
        width: 100%;
        height: 100%;
    }
</style>