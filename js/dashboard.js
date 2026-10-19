/* ═══════════════════════════════════════
   js/dashboard.js — Dashboard Admin & User
════════════════════════════════════════ */

/* ── Dashboard Admin ── */
async function renderDashboardAdmin() {
  const totalBarang = allBarang.length;
  const stokRendah  = allBarang.filter(b => getStatus(b) !== 'Aman').length;

  setText('adm-total-barang', totalBarang);
  setText('adm-stok-rendah',  stokRendah);

  // Ambil total pengajuan peminjaman yang 'Menunggu'
  const pendingSnap = await db.collection('peminjaman').where('status', '==', 'Menunggu').get();
  setText('adm-pending-pinjam', pendingSnap.size);
}

/* ── Dashboard User ── */
async function renderDashboardUser() {
  if (!currentUser) return;

  const snap = await db.collection('peminjaman').where('userId', '==', currentUser.uid).get();
  const list = snap.docs.map(d => d.data());

  const dipinjam  = list.filter(p => p.status === 'Disetujui').length;
  const menunggu  = list.filter(p => p.status === 'Menunggu').length;
  const selesai   = list.filter(p => p.status === 'Dikembalikan').length;

  setText('user-dash-dipinjam', dipinjam);
  setText('user-dash-menunggu', menunggu);
  setText('user-dash-selesai',  selesai);
}

async function renderDashboardAdmin() {
  setText('adm-total-barang', allBarang.length);
  setText('adm-stok-rendah', allBarang.filter(b => getStatus(b) !== 'Aman').length);
  
  try {
    const snap = await db.collection('peminjaman').where('status', '==', 'Menunggu').get();
    setText('adm-pending-pinjam', snap.size);
  } catch (e) {}
}

async function renderDashboardUser() {
  if (!currentUser) return;
  try {
    const snap = await db.collection('peminjaman').where('userId', '==', currentUser.uid).get();
    const list = snap.docs.map(d => d.data());

    setText('user-dash-dipinjam', list.filter(p => p.status === 'Disetujui').length);
    setText('user-dash-menunggu', list.filter(p => p.status === 'Menunggu').length);
    setText('user-dash-selesai', list.filter(p => p.status === 'Dikembalikan').length);
  } catch (e) {}
}