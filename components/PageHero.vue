<template>
	<section class="page-hero" :class="theme">
		<nuxt-link :to="link" class="link caption">
			<Icon name="solar:alt-arrow-left-linear"/>

			{{ linkText }}
		</nuxt-link>

		<div class="content">
			<h2>{{ heading }}</h2>
			<p class="caption">{{ subheading }}</p>
		</div>
	</section>
</template>
  
<script setup>
	import { defineProps } from 'vue';

	defineProps({
		heading: {
			type: String,
			required: true,
			default: 'Heading'
		},
		subheading: {
			type: String,
			default: 'Subheading'
		},
		theme: {
			type: String,
			default: 'default'
		},
		link: {
			type: String,
			default: ''
		},
		linkText: {
			type: String,
			default: ''
		},
	});
</script>
  
<style lang="scss" scoped>
	.page-hero {
		align-items: flex-start;
		background-color: var(--color-1);
		border-radius: 0 0 var(--global-border-radius) var(--global-border-radius);
		display: flex;
		justify-content: space-between;
		padding: 2rem 1rem;
		text-align: right;
		width: 100%;
	}
</style>
  