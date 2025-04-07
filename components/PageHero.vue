<template>
	<section class="page-hero" :class="theme">
		<nuxt-link v-if="link?.length" :to="link" class="link caption">
			<Icon name="solar:alt-arrow-left-linear"/>

			{{ linkText }}
		</nuxt-link>

		<div class="content">
			<h2 v-if="heading?.length">{{ heading }}</h2>
			<p v-if="subheading?.length" class="caption">{{ subheading }}</p>
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
			default: ''
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
		max-width: 600px;
		padding: 2rem 1rem;
		text-align: right;
		width: 100%;

		&.win {
			background-color: var(--color-2);
			text-align: left;
		}

		&.lose {
			background-color: var(--color-3);
			text-align: left;

			h2, .caption {
				color: var(--background-secondary);
			}
		}
	}
</style>
  