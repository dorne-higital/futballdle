<template>
	<section 
		class="menu-overlay" 
		:class="{ 'menu-visible': isVisible }"
	>
		<div class="menu-content">
			<div class="header">
				<nuxt-link class="heading" to="/" @click="closeMenu">Footballdle</nuxt-link>

				<Icon class="close-btn" name="solar:close-square-outline" @click="closeMenu" />
			</div>

			<div class="menu-items">
				<NuxtLink to="/info" class="item" @click="closeMenu">
					How to play

					<span>
						<Icon name="solar:alt-arrow-right-linear"/>
					</span>
				</NuxtLink>

				<NuxtLink to="/stats" class="item" @click="closeMenu">
					Stats

					<span>
						<Icon name="solar:alt-arrow-right-linear"/>
					</span>
				</NuxtLink>

				<NuxtLink to="/leaderboard" class="item" @click="closeMenu">
					Leaderboard

					<span>
						<Icon name="solar:alt-arrow-right-linear"/>
					</span>
				</NuxtLink>
			</div>
		</div>

		<div class="settings-section">
  			<HeadingSeparator text="Settings" />

			<div class="user-profile-section">
				<h6>Display Name</h6>

				<div v-if="!isEditingName" class="display-name-container">
					<h4 class="display-name">{{ displayName || 'Anonymous Player' }}</h4>

					<Icon name="solar:pen-linear" class="edit-icon" @click="startEditName" />
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
						<Icon name="solar:check-square-bold" class="save-btn" @click="saveName" />

						<Icon name="solar:close-square-bold-duotone" class="cancel-btn" @click="cancelEdit" />
					</div>
				</div>
			</div>

			<div class="theme-section">
				<!-- <h6>Theme</h6> -->
			</div>
		</div>
	</section>
</template>
  
<script setup>
    import { defineProps, defineEmits, watch, onMounted } from 'vue';
    import HeadingSeparator from '../components/HeadingSeparator.vue';
    import { doc, updateDoc, getDoc } from 'firebase/firestore';
    import { getAuth } from 'firebase/auth';

    const props = defineProps({
        isVisible: Boolean,
        userId: String,
        initialDisplayName: String,
    });

    const emit = defineEmits(['closeMenu', 'nameUpdated']);
    const { $firestore: db } = useNuxtApp();

    const isEditingName = ref(false);
    const displayName = ref(props.initialDisplayName || '');
    const newDisplayName = ref('');
    const nameInput = ref(null);

    const closeMenu = () => {
        emit('closeMenu');
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
                console.log("Updating display name for userId:", props.userId);
                await updateDoc(doc(db, 'users', props.userId), {
                    displayName: trimmedName,
                });
                console.log("Display name updated successfully.");
                displayName.value = trimmedName;
                isEditingName.value = false;
                localStorage.setItem('playerDisplayName', trimmedName);
                emit('nameUpdated', trimmedName); // Emit the updated name
            } else {
                console.error("userId is not defined.");
            }
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

    const retrieveDisplayName = async (userId) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const storedDisplayName = userData.displayName;
                console.log("Retrieved displayName:", storedDisplayName);
                displayName.value = storedDisplayName;
            } else {
                console.log("User document not found.");
            }
        } catch (error) {
            console.error("Error retrieving display name:", error);
        }
    };

    onMounted(() => {
        if (props.userId) {
            retrieveDisplayName(props.userId);
        }
    });

    watch(
        () => props.initialDisplayName,
        (newDisplayNameProp) => {
            displayName.value = newDisplayNameProp || '';
        }
    );
</script>
  
<style lang="scss" scoped>
	.menu-overlay {
		align-items: center;
		position: fixed;
		right: -100%;
		width: 100%;
		height: 100%;
		background: var(--color-1);
		backdrop-filter: blur(10px);
		transition: right 0.3s ease-in-out;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 1rem;
		z-index: 99;

		&.menu-visible {
			right: 0;
		}

		.menu-content {
			background: var(--color-1);
			max-width: 600px;
			width: 100%;  

			.header {
				align-items: center;
				display: flex;
				flex-direction: row;
				justify-content: space-between;
				margin-bottom: 3rem;

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

				.close-btn {
					height: 1.5rem;
					width: 1.5rem;
				}
			}

			.menu-items {
				.item {
					cursor: pointer;
					display: flex;
					flex-direction: row;
					justify-content: space-between;
					letter-spacing: .1rem;
					padding: .5rem 0;
					text-transform: uppercase;

					.iconify {
						height: 1.5rem;
						width: 1.5rem;
					}
				}
			}
		}

		.settings-section {
			max-width: 600px;
			width: 100%; 

			.user-profile-section {
				margin-bottom: 1rem;
				padding: .5rem 0;

				h6 {
					margin-bottom: .5rem;
				}

				.display-name-container {
					display: flex;
					align-items: center;
					justify-content: space-between;

					.display-name {
						border: 1px solid transparent;
						color: var(--text-primary);
						font-weight: 300;
						padding: .5rem 0;
					}

					.edit-icon {
						color: var(--text-secondary);
						cursor: pointer;
						height: 1.2rem;
						width: 1.2rem;

						&:hover {
							scale: 1.2;
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
						border: 1px solid var(--border);
						border-bottom: 2px solid var(--border);
						border-radius: var(--global-border-radius);
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
		}
	}

</style>
  