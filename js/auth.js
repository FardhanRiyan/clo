// js/utils.js

// Variable global untuk timer notification
var toastTimer = null;

// Mengubah teks elemen berdasarkan ID secara aman
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// Menampilkan overlay loading
function showLoading(show = true) {
  const el = document.getElementById('loading-overlay');
  if (el) el.style.display = show ? 'flex' : 'none';
}

// Menyembunyikan overlay loading
function hideLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.style.display = 'none';
}

// Menampilkan notifikasi popup (Toast)
function showToast(msg, type = 'success', duration = 1500) {
  const el = document.getElementById('toast');
  if (!el) return;
  
  el.textContent = msg;
  el.className = 'toast-show' + (type === 'error' ? ' toast-error' : '');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.className = '';
  }, duration);
}

// Menentukan status stok barang
function getStatus(b) {
  if (!b || b.stok <= 0) return 'Habis';
  if (b.stok <= (b.minStok || 5)) return 'Menipis';
  return 'Aman';
}

// Mendapatkan nama class CSS badge berdasarkan status
function badgeClass(status) {
  if (status === 'Habis') return 'badge-habis';
  if (status === 'Menipis') return 'badge-menipis';
  return 'badge-aman';
}