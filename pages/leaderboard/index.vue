<template>
    <Leaderboard
        v-if="userId"
        :currentUserId="userId"
    />
</template>

<script setup>
    import { ref, onMounted } from 'vue';
    import { useNuxtApp } from '#app';
    import { doc, getDoc } from 'firebase/firestore';
    import { v4 as uuidv4 } from 'uuid';

    const userId = ref(null);

    const { $firestore: db } = useNuxtApp();

    const generateUUID = () => {
        return uuidv4();
    };

    onMounted(() => {
        if (process.client){
            let storedUserId = localStorage.getItem('userId');
            if (!storedUserId) {
                storedUserId = generateUUID();
                localStorage.setItem('userId', storedUserId);
            }
            userId.value = storedUserId;
        }
    });

</script>