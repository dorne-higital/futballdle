<template>
	<div v-if="isOpen" :class="{ 'dark': darkMode }" class="settings-modal">
		<div class="modal-content">
			<div class="modal-header">
				<h1>Settings</h1>

				<Icon class="close-button" name="solar:close-square-outline" @click="closeModal" />
			</div>

			<div class="modal-body">
				<div class="setting-section user-profile-section">
					<h6>Display Name</h6>

					<div v-if="!isEditingName" class="display-name-container">
						<span class="display-name">{{ displayName || 'Anonymous Player' }}</span>

						<Icon name="carbon:edit" class="edit-icon" @click="startEditName" />
					</div>

					<div v-else class="name-edit-container">
						<input
							v-model="newDisplayName"
							type="text"
							class="name-input"
							placeholder="Enter display name"
							ref="nameInput"
							@keyup.enter="saveName"
						/>

						<div class="name-buttons">
							<Icon name="carbon:checkmark" class="save-btn" @click="saveName" />

							<Icon name="carbon:close" class="cancel-btn" @click="cancelEdit" />
						</div>
					</div>
				</div>

				<div class="setting-section theme-section">
					<h6>Game theme</h6>

					<div class="theme-buttons">
						<button
							class="theme-button"
							:class="{ 'active': !darkMode }"
							@click="setLightMode"
							title="Light Mode"
						>
							<Icon name="carbon:sun" />
						</button>

						<button
							class="theme-button"
							:class="{ 'active': darkMode }"
							@click="setDarkMode"
							title="Dark Mode"
						>
							<Icon name="carbon:moon"  />
						</button>
					</div>
				</div>

				<div class="setting-section delete-section">
					<h6 class="danger-text">Danger Zone</h6>

					<p class="caption">By deleting, you are agreeing to remove all progress you have made.</p>

					<p class="caption">All stats you have will be removed, and your position on the leaderboard will be taken.</p>

					<p class="caption">This data can not be returned to you at a later date, should you request it.</p>

					<div class="buttons">
						<button 
							v-if="!confirmResetVisible" 
							class="button danger" 
							@click="confirmReset"
						>
							Delete & Reset
						</button>

						<p v-if="confirmResetVisible" class="confirmation-message">
							Are you sure?

							<span class="group">
								<button 
									class="button danger" 
									@click="resetAndDelete"
								>
									Yes, delete
								</button>

								<button	
									class="button link" 
									@click="cancelReset"
								>
									Cancel
								</button>
							</span>
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
	import { ref, defineProps, defineEmits, onMounted, nextTick } from 'vue';
	import { useNuxtApp } from '#app';
	import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
	import { getAuth, deleteUser, onAuthStateChanged } from 'firebase/auth';

	const props = defineProps({
		isOpen: Boolean,
		darkMode: Boolean,
		userId: String,
		initialDisplayName: String,
	});

	const emit = defineEmits(['close', 'toggleDarkMode', 'nameUpdated']);

	const { $firestore: db } = useNuxtApp();
	const auth = getAuth();
	const isEditingName = ref(false);
	const displayName = ref(props.initialDisplayName || '');
	const newDisplayName = ref('');
	const nameInput = ref(null);
	const isDarkMode = ref(false);
	const confirmResetVisible = ref(false);

	const closeModal = () => {
		emit('close');
	};

	// Display Name Logic
	const startEditName = () => {
		newDisplayName.value = displayName.value;
		isEditingName.value = true;
		nextTick(() => {
			if (nameInput.value) {
				nameInput.value.focus();
			}
		});
	};

	const saveName = async () => {
		if (!newDisplayName.value.trim()) {
			cancelEdit();
			return;
		}
		try {
			const trimmedName = newDisplayName.value.trim();
		if (props.userId) {
			await updateDoc(doc(db, 'users', props.userId), {
				displayName: trimmedName,
			});
		}
		displayName.value = trimmedName;
		isEditingName.value = false;
		localStorage.setItem('playerDisplayName', trimmedName);
		emit('nameUpdated', trimmedName);
		} catch (error) {
			console.error('Error updating display name:', error);
			localStorage.setItem('playerDisplayName', newDisplayName.value.trim());
			displayName.value = newDisplayName.value.trim();
			isEditingName.value = false;
		}
	};

	const cancelEdit = () => {
		isEditingName.value = false;
		newDisplayName.value = '';
	};

	const setDarkMode = () => {
		emit('toggleDarkMode', true);
	};

	const setLightMode = () => {
		emit('toggleDarkMode', false);
	};

	// Reset and Delete User
	const confirmReset = () => {
		confirmResetVisible.value = true;
	};

	const cancelReset = () => {
		confirmResetVisible.value = false;
	};

	const resetAndDelete = async () => {
		if (!props.userId) {
			console.error('resetAndDelete: userId is undefined or null');
			return;
		}

		try {
			const userDocRef = doc(db, 'users', props.userId);
			const docSnap = await getDoc(userDocRef);

			if (!docSnap.exists()) {
				clearGameState();
				location.reload();
				return;
			}

			// Delete the user document first
			await deleteDoc(userDocRef);
			console.log('resetAndDelete: User document deleted successfully:', props.userId);

			// Then, delete the associated Firebase Auth user
			const user = auth.currentUser;
			if (user) {
				await deleteUser(user)
				.then(() => {
					console.log('resetAndDelete: Firebase Auth user deleted successfully.');
				})
				.catch((authError) => {
					console.error('resetAndDelete: Error deleting Firebase Auth user:', authError);
				});
			} else {
				console.warn('resetAndDelete: No Firebase Auth user to delete.');
			}

			// Clear localStorage
			clearGameState();
			location.reload();
		} catch (error) {
			console.error('resetAndDelete: Error deleting user data:', error);
			clearGameState();
			location.reload();
		}
	};

	function clearGameState() {
		localStorage.removeItem('clues');
		localStorage.removeItem('currentDifficulty');
		localStorage.removeItem('displayNameCache');
		localStorage.removeItem('gameState');
		localStorage.removeItem('gameStats');
		localStorage.removeItem('guesses');
		localStorage.removeItem('lastPlayed');
		localStorage.removeItem('playerDisplayName');
		localStorage.removeItem('playsToday');
		localStorage.removeItem('won');
	}

	onMounted(() => {
		const storedDarkMode = localStorage.getItem('darkMode');
		if (storedDarkMode === 'true') {
			isDarkMode.value = true;
		}

		displayName.value = props.initialDisplayName || localStorage.getItem('playerDisplayName') || 'Anonymous Player';

		onAuthStateChanged(auth, (user) => {
			if (user) {
				console.log('onAuthStateChanged: User is signed in:', user.uid);
			} else {
				console.log('onAuthStateChanged: User is signed out');
			}
		});
	});
</script>

<style lang="scss" scoped>
	.settings-modal {
		align-items: center;
		background-color: var(--background-primary);
		display: flex;
		height: 100%;
		justify-content: center;
		left: 0;
		position: fixed;
		top: 0;
		width: 100%;
		z-index: 1000;

		.modal-content {
			background-color: var(--background-primary);
			display: flex;
			flex-direction: column;
			gap: 1rem;
			height: 100%;
			overflow: scroll;
			position: absolute;
			top: 0;
			max-width: 600px;
			width: 100%;

			.modal-header {
				align-items: center;
				background-color: var(--background-primary);
				border-bottom: 1px solid var(--background-secondary);
				box-shadow: 0px 0px 8px 0px var(--background-secondary);
				display: flex;
				justify-content: space-between;
				padding: 1rem;
				position: sticky;
				top: 0;
				z-index: 9999;
			}

			.modal-body {
				display: flex;
				flex-direction: column;
				gap: 1rem;
				margin-bottom: 3.5rem;
				padding: 0 1rem 1rem;

				.setting-section {
					display: flex;
					flex-direction: column;
					gap: .5rem;
					padding: .5rem;
					width: 100%;
				}

				.user-profile-section {
					margin-bottom: 1rem;
					padding: .5rem 0;
					border-bottom: 1px solid var(--background-secondary);

					.display-name-container {
						display: flex;
						align-items: center;
						justify-content: space-between;

						.display-name {
							border: 1px solid transparent;
							color: var(--text-primary);
							font-weight: 400;
							padding: .75rem .5rem;
						}

						.edit-icon {
						color: var(--text-secondary);
						cursor: pointer;
						opacity: 0.7;

							&:hover {
								scale: 1.2;
								opacity: 1;
							}
						}
					}

					.name-edit-container {
						align-items: center;
						display: flex;
						flex-direction: row;
						justify-content: space-between;
						width: 100%;

						.name-input {
							border: 1px solid var(--background-secondary);
							border-radius: var(--global-border-radius-sm);
							background-color: var(--background-secondary);
							color: var(--text-primary);
							padding: .75rem .5rem;
							width: 80%;

							&:focus {
								outline: none;
							}

						}

						.name-buttons {
							display: flex;
							justify-content: space-around;
							width: 20%;

							.save-btn, .cancel-btn {
								border: none;
								cursor: pointer;
								font-weight: bold;
								font-size: 1.5rem;
								padding: .5rem .75rem;
							}

							.save-btn {
								background-color: var(--color-easy-hover);

								&:hover {
									scale: 1.2;
								}
							}

							.cancel-btn {
								background-color: var(--color-hard-hover);

								&:hover {
									scale: 1.2;
								}
							}
						}
					}
				}

				.theme-section {
					.theme-buttons {
						display: flex;
						gap: .75rem;
						margin-top: .5rem;

						.theme-button {
							background-color: var(--background-primary);
							border-radius: var(--global-border-radius-sm);
							border: 2px solid var(--background-secondary);
							cursor: pointer;
							transition: 0.3s ease;
							padding: .5rem;
							width: 4rem;

							span {
								color: var(--text-primary);
								font-size: 1.5rem;
							}

							&.active {
								background-color: var(--info);
								border-color: var(--text-secondary);
							}

							&:hover {
								background-color: var(--info);
								border-color: var(--text-secondary);
								transition: .5s ease;
							}
						}
					}
				}

				.delete-section {
					background-color: var(--color-hard);
					border: 1px solid var(--color-hard-hover);
					border-radius: var(--global-border-radius);
					color: var(--text-secondary);

					.danger-text {
						border-bottom: 1px solid var(--color-hard-hover);
						color: var(--text-primary);
						font-weight: 500;
						padding-bottom: .5rem;
					}

					.buttons {
						border-top: 1px solid var(--color-hard-hover);
						padding-top: .5rem;
						width: 100%;

						button {
							width: 100%;
						}

						.confirmation-message {
							align-items: center;
							display: flex;
							font-size: .85rem;
							justify-content: space-between;

							.group {
								display: flex;
								flex-direction: row;

								button {
									white-space: nowrap;
								}
							}
						}
					}
				}
			}
		}
	}
</style>
