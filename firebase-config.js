/*
Configuracion de Firebase v8 (API global).
Este archivo se carga DESPUES de firebase-app.js y firebase-firestore.js
*/

const firebaseConfig = {
  apiKey: "AIzaSyANuIq0Te9cuLg5w5AFqa2wpXxVLR0sVZI",
  authDomain: "oasis-548cf.firebaseapp.com",
  projectId: "oasis-548cf",
  storageBucket: "oasis-548cf.appspot.com",
  messagingSenderId: "604369694270",
  appId: "1:604369694270:web:a46f693c06ab6879172b6f",
  measurementId: "G-DRWKJNJ85L"
};

let db = null;

try {
    if (typeof firebase !== "undefined") {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        console.log("Firebase inicializado correctamente");
    } else {
        console.warn("Firebase no esta cargado. Asegurate de incluir los scripts de Firebase ANTES de este archivo.");
    }
} catch (err) {
    console.error("Error al inicializar Firebase:", err);
}