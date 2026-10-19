/* ═══════════════════════════════════════
   js/users.js — Kelola User (ADMIN)
════════════════════════════════════════ */

async function loadKelolaUsers() {
  const tbody = document.getElementById('admin-users-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Memuat data user...</td></tr>';

  try {
    const snap = await db.collection('users').get();
    if (snap.empty) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Tidak ada user ditemukan.</td></tr>';
      return;
    }

    tbody.innerHTML = snap.docs.map(doc => {
      const u = doc.data();
      const isSelf = doc.id === currentUser.uid;
      return `<tr>
        <td><strong>${u.nama || '—'}</strong></td>
        <td>@${u.username || '—'}</td>
        <td>${u.email}</td>
        <td><span class="badge ${u.role === 'admin' ? 'badge-aman' : 'badge-muted'}">${u.role}</span></td>
        <td><span class="badge ${u.status === 'Aktif' ? 'badge-aman' : 'badge-habis'}">${u.status || 'Aktif'}</span></td>
        <td style="text-align:right">
          ${!isSelf ? `
            <button class="btn btn-sm" onclick="toggleUserRole('${doc.id}', '${u.role}')">🔄 Ubah Role</button>
            <button class="btn btn-sm btn-danger" onclick="toggleUserStatus('${doc.id}', '${u.status || 'Aktif'}')">⚡ Toggle Status</button>
          ` : '<small style="color:var(--muted)">Akun Anda</small>'}
        </td>
      </tr>`;
    }).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--red)">Error: ${e.message}</td></tr>`;
  }
}

async function toggleUserRole(uid, currentRole) {
  const newRole = currentRole === 'admin' ? 'user' : 'admin';
  if (!confirm(`Ubah role pengguna ini menjadi "${newRole}"?`)) return;

  showLoading();
  try {
    await db.collection('users').doc(uid).update({ role: newRole });
    hideLoading();
    showToast(`Role berhasil diperbarui menjadi ${newRole} ✅`);
    loadKelolaUsers();
  } catch (e) {
    hideLoading();
    showToast('Gagal mengubah role: ' + e.message, 'error');
  }
}

async function toggleUserStatus(uid, currentStatus) {
  const newStatus = currentStatus === 'Aktif' ? 'Nonaktif' : 'Aktif';
  showLoading();
  try {
    await db.collection('users').doc(uid).update({ status: newStatus });
    hideLoading();
    showToast(`Status user diperbarui menjadi ${newStatus} ✅`);
    loadKelolaUsers();
  } catch (e) {
    hideLoading();
    showToast('Gagal mengubah status: ' + e.message, 'error');
  }
}

async function loadKelolaUsers() {
  const tbody = document.getElementById('admin-users-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Memuat user...</td></tr>';

  try {
    const snap = await db.collection('users').get();
    tbody.innerHTML = snap.docs.map(doc => {
      const u = doc.data();
      const isSelf = doc.id === currentUser.uid;
      return `<tr>
        <td><strong>${u.nama}</strong></td>
        <td>@${u.username}</td>
        <td><span class="badge ${u.role === 'admin' ? 'badge-aman' : 'badge-muted'}">${u.role}</span></td>
        <td>${u.status || 'Aktif'}</td>
        <td style="text-align:right">
          ${!isSelf ? `<button class="btn btn-sm" onclick="toggleRole('${doc.id}', '${u.role}')">🔄 Switch Role</button>` : '<small style="color:var(--muted)">Akun Saya</small>'}
        </td>
      </tr>`;
    }).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--red)">Error: ${e.message}</td></tr>`;
  }
}

async function toggleRole(uid, currentRole) {
  const newRole = currentRole === 'admin' ? 'user' : 'admin';
  showLoading();
  try {
    await db.collection('users').doc(uid).update({ role: newRole });
    hideLoading();
    showToast(`Role diubah ke ${newRole} ✅`);
    loadKelolaUsers();
  } catch (e) {
    hideLoading();
    showToast('Gagal: ' + e.message, 'error');
  }
}