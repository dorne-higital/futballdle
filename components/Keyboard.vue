<template>
	<div 
		:class="{ 'dark': darkMode }"
		class="keyboard"
	>
		<div 
			v-for="(row, rowIndex) in keyboardLayout" 
			:key="rowIndex" 
			class="keyboard-row"
		>
			<button
				v-for="(key, keyIndex) in row"
				:key="keyIndex"
				:class="getKeyClass(key)"
				class="keyboard-key"
				@click="handleKeyPress(key)"
			>
				{{ key }}
			</button>
		</div>
	</div>
</template>
  
<script setup>
	import { defineProps, defineEmits, computed } from 'vue';

	const props = defineProps({
		letterStates: {
			type: Object,
			default: () => ({}),
		},
        darkMode: {
            type: Boolean,
            default: false,
        },
	});

	const emit = defineEmits(['key-press']);

	const keyboardLayout = [
		['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
		['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
		['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
	];

	const handleKeyPress = (key) => {
		emit('key-press', key);
	};

	const getKeyClass = (key) => {
		if (props.letterStates[key] === 'correct') {
			return 'correct';
		} else if (props.letterStates[key] === 'present') {
			return 'present';
		} else if (props.letterStates[key] === 'absent') {
			return 'absent';
		} else {
			return '';
		}
	};
</script>
  
<style lang="scss" scoped>
	.keyboard {
		align-items: center;
		display: flex;
		flex-direction: column;
		margin-top: 1.25rem;
		width: 100%;

		&.dark {
			.keyboard-row .keyboard-key {
				background-color: #272727;
				border: 1px solid #000000;
				color: #e2e2e2;
			}
		}
  
		.keyboard-row {
			display: flex;
			margin-bottom: 0.25rem;
			width: 100%;
  
			.keyboard-key {
				align-items: center;
				background-color: #f6f6f6;
				border: 1px solid #ccc;
				cursor: pointer;
				display: flex;
				flex: 1;
				font-weight: 400;
				height: 3.25rem;
				justify-content: center;
				margin: 0.125rem;
				text-transform: uppercase;

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
					cursor: default;
				}
  
				&.active {
					background-color: #ddd;
				}
			}
		}
	}
</style>