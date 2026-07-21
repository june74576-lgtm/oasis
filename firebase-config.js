// Reemplazá esto con el objeto que te da Firebase cuando registrás tu
// app web (Project settings → General → Your apps → </> Web).
//
// Pasos para crear el proyecto (gratis, SIN tarjeta):
// 1. console.firebase.google.com → Add project → nombre "oasis"
// 2. Build → Firestore Database → Create database → modo producción
//    (dejá el plan Spark / gratis — NO actives Blaze, no hace falta)
// 3. Project settings (ícono de tuerca) → General → Your apps → </> Web
//    → registrar → copiar el objeto de acá abajo
// 4. Andá a Firestore → pestaña "Rules" y pegá las reglas del comentario
//    al final de este archivo → Publish
//
// Nota: NO usamos Firebase Storage porque desde 2026 exige tarjeta de
// crédito (plan Blaze) incluso para uso gratuito. En vez de eso, los
// archivos se guardan como texto dentro de Firestore, con un límite de
// ~700 KB por archivo (para PDFs livianos y documentos de texto anda
// perfecto; para archivos muy pesados con muchas imágenes, no entra).
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyANuIq0Te9cuLg5w5AFqa2wpXxVLR0sVZI",
  authDomain: "oasis-548cf.firebaseapp.com",
  projectId: "oasis-548cf",
  storageBucket: "oasis-548cf.firebasestorage.app",
  messagingSenderId: "604369694270",
  appId: "1:604369694270:web:a46f693c06ab6879172b6f",
  measurementId: "G-DRWKJNJ85L"
};

let db = null;

if (!firebaseConfig.apiKey.includes("AIzaSyANuIq0Te9cuLg5w5AFqa2wpXxVLR0sVZI") && window.firebase) {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
} else {
    console.warn("Firebase no está configurado todavía — completá data/firebase-config.js");
}

/*
===== Reglas de Firestore (pestaña "Rules") =====

rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}

Son reglas abiertas (cualquiera puede subir, nadie puede borrar) porque no
hay backend real atrás — pero sí limitan cada documento a menos de 1 MB,
como protección extra además del límite que ya pone el código.
*/