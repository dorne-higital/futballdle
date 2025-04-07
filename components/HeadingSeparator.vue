<template>
	<div class="heading-separator" :class="theme">
		<h6 class="label">{{ text }}</h6>
	</div>
</template>
  
<script setup>
	import { defineProps } from 'vue';

	defineProps({
		text: {
			type: String,
			required: true
		},
		theme: {
			type: String,
			default: 'default' // Default style if no theme is provided
		}
	});
</script>
  
<style lang="scss" scoped>
	.heading-separator {
		align-items: center;
		display: flex;
		margin: 1rem 0;
		position: relative;
		text-align: center;
		width: 100%;

		&:before,
		&:after {
			content: "";
			flex: 1;
			height: 2px;
			background-color: var(--border);
		}

		.label {
			margin: 0 1rem;
			text-transform: uppercase;
			white-space: nowrap;
		}

		&.bold {
			.label {
				font-weight: 900;
				color: var(--text-primary);
			}

			&:before, &:after {
				background-color: var(--text-primary);
			}
		}

		&.subtle {
			.label {
				color: var(--border);
				font-weight: 300;
			}
			&:before, &:after {
				background-color: var(--border);
				height: 1px;
			}
		}

		&.color-1 {
			.label {
				color: var(--color-1);
			}
			&:before, &:after {
				background-color: var(--color-1);
			}
		}

		&.color-2 {
			.label {
				color: var(--color-2);
			}
			&:before, &:after {
				background-color: var(--color-2);
			}
		}

		&.color-3 {
			.label {
				color: var(--color-3);
			}
			&:before, &:after {
				background-color: var(--color-3);
			}
		}
	}
</style>
  