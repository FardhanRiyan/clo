/* ═══════════════════════════════════════
js/navigation.js — Navigasi & Sidebar Berdasarkan Role
════════════════════════════════════════ */

function renderSidebarByRole() {
  const role = currentUserData?.role || 'user';
  
  // Tampilkan/Sembunyikan menu berdasarkan class CSS (.role-admin / .role-user)
  document.querySelectorAll('.role-admin').forEach(el => {
    el.style.display = (role === 'admin') ? 'block' : 'none';
  });
  
  document.querySelectorAll('.role-user').forEach(el => {
    el.style.display = (role === 'user') ? 'block' : 'none';
  });
}

function showPage(id) {
  document.querySelectorAll('.page, .auth-page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  window.scrollTo(0, 0);
}

function navTo(pageId) {
  showPage(pageId);
  renderSidebarByRole();

  switch (pageId) {
    case 'page-dashboard-admin':
      renderDashboardAdmin();
      setTimeout(initTrendChart, 100);
      break;
    case 'page-dashboard-user':
      renderDashboardUser();
      break;
    case 'page-data-barang':
      renderDataBarang();
      break;
    case 'page-barang-masuk':
      loadRiwayat('masuk');
      break;
    case 'page-barang-keluar':
      updateStokInfo();
      loadRiwayat('keluar');
      break;
    case 'page-kelola-peminjaman':
      loadKelolaPeminjamanAdmin();
      break;
    case 'page-kelola-user':
      loadKelolaUsers();
      break;
    case 'page-pinjam-barang':
      renderBarangPinjamSelect();
      break;
    case 'page-riwayat-peminjaman':
      loadRiwayatPeminjamanUser();
      break;
    case 'page-profile':
      renderProfile();
      break;
  }
}

function showPage(id) {
  document.querySelectorAll('.page, .auth-page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  window.scrollTo(0, 0);
}

function navTo(pageId) {
  showPage(pageId);

  switch (pageId) {
    case 'page-dashboard-admin':
      renderDashboardAdmin();
      if (typeof initTrendChart === 'function') setTimeout(initTrendChart, 100);
      break;
    case 'page-dashboard-user':
      renderDashboardUser();
      break;
    case 'page-data-barang':
      renderDataBarang();
      break;
    case 'page-barang-masuk':
      renderBarangSelect();
      loadRiwayat('masuk');
      break;
    case 'page-barang-keluar':
      renderBarangSelect();
      updateStokInfo();
      loadRiwayat('keluar');
      break;
    case 'page-kelola-peminjaman':
      loadKelolaPeminjamanAdmin();
      break;
    case 'page-kelola-user':
      loadKelolaUsers();
      break;
    case 'page-riwayat-peminjaman':
      loadRiwayatPeminjamanUser();
      break;
    case 'page-profile':
      renderProfile();
      break;
  }
}