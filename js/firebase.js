/* ═══════════════════════════════════════
   js/firebase.js
   Inisialisasi Firebase — ganti nilai config dengan milik Anda
   Firebase Console → Project Settings → Your apps → SDK setup
════════════════════════════════════════ */

const firebaseConfig = {
  apiKey: "AIzaSyA5u6qw8D7XnhfArUPYCm4GM2uM-2jbm7s",
  authDomain: "inventaris-clo.firebaseapp.com",
  projectId: "inventaris-clo",
  storageBucket: "inventaris-clo.firebasestorage.app",
  messagingSenderId: "419279420751",
  appId: "1:419279420751:web:1d35673ccd46139a0c593a",
  measurementId: "G-YTMNVG0P1N"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.firestore();
