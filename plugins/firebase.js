// plugins/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyCqLwV539q81TjG9ZBxcVWJvzQ5QGJzsdk',
    authDomain: 'footballdle-e3635.firebaseapp.com',
    projectId: 'footballdle-e3635',
    storageBucket: 'footballdle-e3635.firebasestorage.app',
    messagingSenderId: '853956062962',
    appId: '1:853956062962:web:f96ddef05bd2ceaaabea6b',
    measurementId: 'G-D2FX1P2T6K',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default defineNuxtPlugin(() => {
    return {
        provide: {
            firestore: db,
        },
    };
});