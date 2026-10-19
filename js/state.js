/* ═══════════════════════════════════════
   js/state.js
   State global yang dipakai lintas modul
════════════════════════════════════════ */

let currentUser     = null;   // Firebase Auth user object
let currentUserData = null;   // Dokumen Firestore /users/{uid}
let allBarang       = [];     // Cache list barang dari Firestore
