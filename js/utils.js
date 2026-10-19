// ═══════════════════════════════════════════════════════════════
// AUTHENTICATION MODULE (js/auth.js)
// ═══════════════════════════════════════════════════════════════

/**
 * Memproses Login User
 */

function showLoading(show) {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.display = show ? 'flex' : 'none';
  }
}

async function handleLogin() {
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const errorElement = document.getElementById('login-error');

  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value.trim() : '';

  if (errorElement) errorElement.textContent = '';

  // Validasi Input
  if (!email || !password) {
    if (errorElement) errorElement.textContent = 'Email dan password wajib diisi!';
    return;
  }

  showLoading(true);

  try {
    // Login menggunakan Firebase Auth
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Ambil data profil dari Firestore
    const userDoc = await db.collection('users').doc(user.uid).get();

    if (userDoc.exists) {
      currentUser = { uid: user.uid, ...userDoc.data() };
      showToast(`Selamat datang kembali, ${currentUser.nama || 'User'}!`);

      // Arahkan tampilan berdasarkan role
      if (currentUser.role === 'admin') {
        navTo('page-dashboard-admin');
      } else {
        navTo('page-dashboard');
      }
    } else {
      showToast('Data pengguna tidak ditemukan di database.', true);
    }
  } catch (error) {
    console.error('Error saat login:', error);
    let message = 'Gagal melakukan login.';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      message = 'Email atau password salah.';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Format email tidak valid.';
    }
    if (errorElement) errorElement.textContent = message;
  } finally {
    showLoading(false);
  }
}

/**
 * Memproses Pendaftaran User Baru
 */
async function handleRegister() {
  const namaInput = document.getElementById('reg-nama');
  const usernameInput = document.getElementById('reg-username');
  const emailInput = document.getElementById('reg-email');
  const passwordInput = document.getElementById('reg-password');
  const telpInput = document.getElementById('reg-telp');
  const errorElement = document.getElementById('reg-error');

  const nama = namaInput ? namaInput.value.trim() : '';
  const username = usernameInput ? usernameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value.trim() : '';
  const telp = telpInput ? telpInput.value.trim() : '';

  if (errorElement) errorElement.textContent = '';

  // Validasi Form
  if (!nama || !username || !email || !password) {
    if (errorElement) errorElement.textContent = 'Semua bidang wajib diisi!';
    return;
  }

  if (password.length < 6) {
    if (errorElement) errorElement.textContent = 'Password minimal 6 karakter!';
    return;
  }

  showLoading(true);

  try {
    // Buat akun baru di Firebase Auth
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Simpan data profil pengguna ke Firestore
    const userData = {
      uid: user.uid,
      nama: nama,
      username: username,
      email: email,
      telp: telp,
      role: 'user', // Default role untuk pendaftar baru
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(user.uid).set(userData);

    showToast('Pendaftaran berhasil! Silakan login.');
    showPage('page-login');

    // Reset input form
    if (namaInput) namaInput.value = '';
    if (usernameInput) usernameInput.value = '';
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (telpInput) telpInput.value = '';

  } catch (error) {
    console.error('Error saat registrasi:', error);
    let message = 'Gagal mendaftar.';
    if (error.code === 'auth/email-already-in-use') {
      message = 'Email sudah terdaftar!';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Format email tidak valid!';
    }
    if (errorElement) errorElement.textContent = message;
  } finally {
    showLoading(false);
  }
}

/**
 * Memproses Logout
 */
async function handleLogout() {
  try {
    await auth.signOut();
    currentUser = null;
    showToast('Anda telah keluar.');
    showPage('page-login');
  } catch (error) {
    console.error('Error saat logout:', error);
    showToast('Gagal melakukan logout.', true);
  }
}

/**
 * Listener Status Otentikasi
 */
auth.onAuthStateChanged(async (user) => {
  if (user) {
    try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        currentUserData = { uid: user.uid, ...userDoc.data() };
        currentUser = currentUserData;
      }
    } catch (err) {
      console.error('Gagal memuat profil pengguna:', err);
    }
    loadAllBarang();
  } else {
    currentUser = null;
    allBarang = [];
  }
});