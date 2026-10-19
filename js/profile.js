/* ═══════════════════════════════════════
   js/profile.js
   Halaman My Profile — redesign menarik + edit profil
   Depends on: state.js, utils.js, firebase.js
════════════════════════════════════════ */

function renderProfile() {
  if (!currentUserData) return;

  const nama     = currentUserData.nama     || '—';
  const username = currentUserData.username || '—';
  const email    = currentUserData.email    || currentUser?.email || '—';
  const jabatan  = currentUserData.role === 'admin' ? 'Admin Gudang' : 'Staff Gudang';
  const telp     = currentUserData.telp     || '—';
  const status   = currentUserData.status   || 'Aktif';

  /* Inisial avatar dari nama */
  const inisial = nama.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  /* Statistik ringkasan user */
  const totalBarang = allBarang.length;
  const stokRendah  = allBarang.filter(b => getStatus(b) !== 'Aman').length;

  const el = document.getElementById('profile-content');
  if (!el) return;

  el.innerHTML = `
    <!-- Hero Banner -->
    <div class="prof-hero">
      <div class="prof-hero-bg"></div>
      <div class="prof-hero-body">
        <div class="prof-avatar">${inisial}</div>
        <div class="prof-hero-info">
          <div class="prof-hero-name">${nama}</div>
          <div class="prof-hero-role">
            <span class="prof-role-badge ${currentUserData.role === 'admin' ? 'admin' : 'staff'}">
              ${currentUserData.role === 'admin' ? '⭐ Admin Gudang' : '👷 Staff Gudang'}
            </span>
            <span class="prof-status-dot ${status === 'Aktif' ? 'aktif' : 'nonaktif'}"></span>
            <span style="font-size:13px;color:rgba(255,255,255,0.8)">${status}</span>
          </div>
        </div>
        <button class="prof-edit-btn" onclick="openEditProfile()">✏️ Edit Profil</button>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="prof-stats-row">
      <div class="prof-stat-card">
        <div class="prof-stat-icon">📦</div>
        <div class="prof-stat-val">${totalBarang}</div>
        <div class="prof-stat-label">Total Barang</div>
      </div>
      <div class="prof-stat-card">
        <div class="prof-stat-icon">⚠️</div>
        <div class="prof-stat-val" style="color:var(--gold)">${stokRendah}</div>
        <div class="prof-stat-label">Stok Perlu Perhatian</div>
      </div>
      <div class="prof-stat-card">
        <div class="prof-stat-icon">✅</div>
        <div class="prof-stat-val" style="color:var(--green)">${totalBarang - stokRendah}</div>
        <div class="prof-stat-label">Stok Aman</div>
      </div>
    </div>

    <!-- Info Detail -->
    <div class="prof-detail-grid">
      <div class="prof-detail-card">
        <div class="prof-detail-header">Informasi Akun</div>
        <div class="prof-detail-row">
          <span class="prof-detail-icon">👤</span>
          <div>
            <div class="prof-detail-key">Username</div>
            <div class="prof-detail-val">@${username}</div>
          </div>
        </div>
        <div class="prof-detail-row">
          <span class="prof-detail-icon">✉️</span>
          <div>
            <div class="prof-detail-key">Email</div>
            <div class="prof-detail-val">${email}</div>
          </div>
        </div>
        <div class="prof-detail-row">
          <span class="prof-detail-icon">📞</span>
          <div>
            <div class="prof-detail-key">No. Telepon</div>
            <div class="prof-detail-val">${telp}</div>
          </div>
        </div>
      </div>

      <div class="prof-detail-card">
        <div class="prof-detail-header">Informasi Jabatan</div>
        <div class="prof-detail-row">
          <span class="prof-detail-icon">🏢</span>
          <div>
            <div class="prof-detail-key">Jabatan</div>
            <div class="prof-detail-val">${jabatan}</div>
          </div>
        </div>
        <div class="prof-detail-row">
          <span class="prof-detail-icon">🟢</span>
          <div>
            <div class="prof-detail-key">Status Akun</div>
            <div class="prof-detail-val">${status}</div>
          </div>
        </div>
        <div class="prof-detail-row">
          <span class="prof-detail-icon">🔑</span>
          <div>
            <div class="prof-detail-key">Level Akses</div>
            <div class="prof-detail-val">${currentUserData.role === 'admin' ? 'Administrator' : 'Staff / User'}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Logout -->
    <div style="margin-top:8px">
      <button class="btn btn-danger" onclick="handleLogout()"
              style="border-radius:12px;padding:13px 32px;font-size:15px">
        🚪 Keluar Akun
      </button>
    </div>
  `;
}

/* ── Modal Edit Profil ── */
function openEditProfile() {
  if (!currentUserData) return;
  document.getElementById('edit-nama').value     = currentUserData.nama     || '';
  document.getElementById('edit-username').value = currentUserData.username || '';
  document.getElementById('edit-telp').value     = currentUserData.telp     || '';
  document.getElementById('modal-edit-profile').style.display = 'flex';
}

function closeEditProfile() {
  document.getElementById('modal-edit-profile').style.display = 'none';
}

async function simpanEditProfile() {
  const nama     = document.getElementById('edit-nama').value.trim();
  const username = document.getElementById('edit-username').value.trim();
  const telp     = document.getElementById('edit-telp').value.trim();

  if (!nama || !username) {
    showToast('Nama dan username wajib diisi.', 'error'); return;
  }

  showLoading();
  try {
    await db.collection('users').doc(currentUser.uid).update({ nama, username, telp });
    currentUserData = { ...currentUserData, nama, username, telp };
    closeEditProfile();
    hideLoading();
    renderProfile();
    showToast('Profil berhasil diperbarui ✅');
  } catch (e) {
    hideLoading();
    showToast('Gagal: ' + e.message, 'error');
  }
}
