/* ═══════════════════════════════════════
   js/peminjaman.js — Fitur Peminjaman & Pengembalian
════════════════════════════════════════ */

/* ── Form Pinjam (USER) ── */
function renderBarangPinjamSelect() {
  const sel = document.getElementById('pinjam-barang-select');
  if (!sel) return;

  // Hanya barang dengan stok > 0 yang bisa dipinjam
  const barangTersedia = allBarang.filter(b => b.stok > 0);
  
  sel.innerHTML = '<option value="">— Pilih Barang —</option>' + 
    barangTersedia.map(b => 
      `<option value="${b.id}" data-stok="${b.stok}">${b.kode} — ${b.nama} (Stok: ${b.stok})</option>`
    ).join('');
}

async function ajukanPeminjaman() {
  const barangId = document.getElementById('pinjam-barang-select')?.value;
  const jumlah   = parseInt(document.getElementById('pinjam-jumlah')?.value || 0);
  const tglPinjam = document.getElementById('pinjam-tgl-pinjam')?.value;
  const tglKembali = document.getElementById('pinjam-tgl-kembali')?.value;
  const alasan   = document.getElementById('pinjam-alasan')?.value.trim() || '';

  if (!barangId || jumlah < 1 || !tglPinjam || !tglKembali) {
    showToast('Lengkapi seluruh form peminjaman.', 'error'); return;
  }

  const barang = allBarang.find(b => b.id === barangId);
  if (jumlah > (barang?.stok || 0)) {
    showToast(`Jumlah melebihi stok yang tersedia (${barang?.stok} pcs).`, 'error'); return;
  }

  showLoading();
  try {
    await db.collection('peminjaman').add({
      userId: currentUser.uid,
      namaUser: currentUserData.nama,
      barangId: barangId,
      namaBarang: barang.nama,
      jumlah: jumlah,
      tanggalPinjam: tglPinjam,
      tanggalKembaliRencana: tglKembali,
      tanggalKembaliAktual: null,
      status: 'Menunggu',
      alasan: alasan,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    hideLoading();
    showToast('Pengajuan peminjaman berhasil dikirim! Menunggu persetujuan Admin 🎉');
    navTo('page-riwayat-peminjaman');
  } catch (e) {
    hideLoading();
    showToast('Gagal mengajukan: ' + e.message, 'error');
  }
}

/* ── Riwayat & Pengembalian (USER) ── */
async function loadRiwayatPeminjamanUser() {
  const tbody = document.getElementById('user-peminjaman-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Memuat data...</td></tr>';

  try {
    const snap = await db.collection('peminjaman')
      .where('userId', '==', currentUser.uid)
      .orderBy('createdAt', 'desc')
      .get();

    if (snap.empty) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted)">Belum ada riwayat peminjaman.</td></tr>';
      return;
    }

    tbody.innerHTML = snap.docs.map(doc => {
      const p = doc.data();
      const isDisetujui = p.status === 'Disetujui';
      return `<tr>
        <td><strong>${p.namaBarang}</strong></td>
        <td>${p.jumlah} pcs</td>
        <td>${p.tanggalPinjam} s/d ${p.tanggalKembaliRencana}</td>
        <td><span class="badge badge-${badgePeminjaman(p.status)}">${p.status}</span></td>
        <td>${p.alasan || '—'}</td>
        <td style="text-align:right">
          ${isDisetujui ? `<button class="btn btn-sm btn-primary" onclick="kembalikanBarangUser('${doc.id}', '${p.barangId}',${p.jumlah})">↩️ Kembalikan</button>` : '—'}
        </td>
      </tr>`;
    }).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--red)">Error: ${e.message}</td></tr>`;
  }
}

/* ── Kembalikan Barang (USER) ── */
async function kembalikanBarangUser(peminjamanId, barangId, jumlah) {
  if (!confirm('Apakah Anda ingin mengembalikan barang ini?')) return;

  showLoading();
  try {
    const barang = allBarang.find(b => b.id === barangId);
    const stokBaru = (barang?.stok || 0) + jumlah;

    // Kembalikan stok barang & ubah status peminjaman menjadi 'Dikembalikan'
    await db.collection('barang').doc(barangId).update({ stok: stokBaru });
    await db.collection('peminjaman').doc(peminjamanId).update({
      status: 'Dikembalikan',
      tanggalKembaliAktual: new Date().toISOString().slice(0, 10)
    });

    hideLoading();
    showToast('Barang berhasil dikembalikan! Stok telah diperbarui ✅');
    loadRiwayatPeminjamanUser();
  } catch (e) {
    hideLoading();
    showToast('Gagal mengembalikan: ' + e.message, 'error');
  }
}

/* ── Kelola Peminjaman (ADMIN — Approve / Reject) ── */
async function loadKelolaPeminjamanAdmin() {
  const tbody = document.getElementById('admin-peminjaman-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Memuat data...</td></tr>';

  try {
    const snap = await db.collection('peminjaman').orderBy('createdAt', 'desc').get();
    if (snap.empty) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted)">Belum ada pengajuan peminjaman.</td></tr>';
      return;
    }

    tbody.innerHTML = snap.docs.map(doc => {
      const p = doc.data();
      const isMenunggu = p.status === 'Menunggu';
      return `<tr>
        <td><strong>${p.namaUser}</strong></td>
        <td>${p.namaBarang}</td>
        <td>${p.jumlah} pcs</td>
        <td>${p.tanggalPinjam} s/d ${p.tanggalKembaliRencana}</td>
        <td><span class="badge badge-${badgePeminjaman(p.status)}">${p.status}</span></td>
        <td>${p.alasan || '—'}</td>
        <td style="text-align:right">
          ${isMenunggu ? `
            <button class="btn btn-sm btn-success" onclick="prosesApprovalPeminjaman('${doc.id}', '${p.barangId}',${p.jumlah}, 'setujui')">✅ Setujui</button>
            <button class="btn btn-sm btn-danger" onclick="prosesApprovalPeminjaman('${doc.id}', '${p.barangId}',${p.jumlah}, 'tolak')">❌ Tolak</button>
          ` : '—'}
        </td>
      </tr>`;
    }).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--red)">Error: ${e.message}</td></tr>`;
  }
}

async function prosesApprovalPeminjaman(peminjamanId, barangId, jumlah, aksi) {
  showLoading();
  try {
    if (aksi === 'setujui') {
      const barang = allBarang.find(b => b.id === barangId);
      if ((barang?.stok || 0) < jumlah) {
        hideLoading();
        showToast('Stok barang tidak mencukupi untuk disetujui!', 'error');
        return;
      }

      // Potong stok barang saat disetujui
      const stokBaru = barang.stok - jumlah;
      await db.collection('barang').doc(barangId).update({ stok: stokBaru });
      await db.collection('peminjaman').doc(peminjamanId).update({ status: 'Disetujui' });
      showToast('Peminjaman telah disetujui ✅');
    } else {
      await db.collection('peminjaman').doc(peminjamanId).update({ status: 'Ditolak' });
      showToast('Peminjaman telah ditolak ❌');
    }

    hideLoading();
    loadKelolaPeminjamanAdmin();
  } catch (e) {
    hideLoading();
    showToast('Gagal memproses: ' + e.message, 'error');
  }
}

function badgePeminjaman(status) {
  if (status === 'Disetujui') return 'aman';
  if (status === 'Menunggu')  return 'menipis';
  if (status === 'Ditolak')   return 'habis';
  return 'muted';
}

async function approvePeminjaman(peminjamanId, itemId, jumlahPinjam) {
  try {
    const itemRef = db.collection('items').doc(itemId);
    const itemDoc = await itemRef.get();
    const currentStok = itemDoc.data().stokTersedia;

    // Cek apakah stok cukup
    if (currentStok < jumlahPinjam) {
      alert("Stok barang tidak mencukupi!");
      return;
    }

    // 1. Kurangi stok tersedia
    await itemRef.update({
      stokTersedia: currentStok - jumlahPinjam
    });

    // 2. Ubah status peminjaman
    await db.collection('peminjaman').doc(peminjamanId).update({
      status: 'Dipinjam'
    });

    alert("Peminjaman disetujui!");
  } catch (error) {
    console.error("Gagal menyetujui:", error);
  }
}

async function prosesPengembalian(peminjamanId, itemId, jumlahPinjam) {
  try {
    const itemRef = db.collection('items').doc(itemId);
    const itemDoc = await itemRef.get();
    const currentStok = itemDoc.data().stokTersedia;

    // 1. Kembalikan stok tersedia
    await itemRef.update({
      stokTersedia: currentStok + jumlahPinjam
    });

    // 2. Ubah status peminjaman & catat tanggal kembali
    await db.collection('peminjaman').doc(peminjamanId).update({
      status: 'Dikembalikan',
      tglKembaliReal: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("Barang berhasil dikembalikan!");
  } catch (error) {
    console.error("Gagal memproses pengembalian:", error);
  }
}

let _targetPinjamId = null;

function bukaModalPinjam(barangId) {
  _targetPinjamId = barangId;
  const b = allBarang.find(item => item.id === barangId);
  if (!b) return;

  setText('modal-pinjam-nama', b.nama);
  document.getElementById('pinjam-jumlah').value = 1;
  document.getElementById('modal-pinjam').style.display = 'flex';
}

function tutupModalPinjam() {
  document.getElementById('modal-pinjam').style.display = 'none';
  _targetPinjamId = null;
}

async function ajukanPeminjaman() {
  const jumlah = parseInt(document.getElementById('pinjam-jumlah').value) || 0;
  const tglKembali = document.getElementById('pinjam-tgl-kembali').value;
  const alasan = document.getElementById('pinjam-alasan').value.trim();

  const barang = allBarang.find(b => b.id === _targetPinjamId);
  if (!barang || jumlah < 1 || !tglKembali) {
    showToast('Lengkapi jumlah dan tanggal pengembalian.', 'error'); return;
  }

  if (jumlah > barang.stok) {
    showToast(`Stok tidak mencukupi (Tersedia: ${barang.stok} pcs).`, 'error'); return;
  }

  showLoading();
  try {
    await db.collection('peminjaman').add({
      userId: currentUser.uid,
      namaUser: currentUserData.nama,
      barangId: _targetPinjamId,
      namaBarang: barang.nama,
      jumlah,
      tanggalPinjam: new Date().toISOString().slice(0, 10),
      tanggalKembaliRencana: tglKembali,
      status: 'Menunggu',
      alasan,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    tutupModalPinjam();
    hideLoading();
    showToast('Pengajuan peminjaman berhasil dikirim! 🚀');
    navTo('page-riwayat-peminjaman');
  } catch (e) {
    hideLoading();
    showToast('Gagal: ' + e.message, 'error');
  }
}

async function loadRiwayatPeminjamanUser() {
  const tbody = document.getElementById('user-peminjaman-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Memuat riwayat...</td></tr>';

  try {
    const snap = await db.collection('peminjaman')
      .where('userId', '==', currentUser.uid)
      .get();

    if (snap.empty) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted)">Belum pernah meminjam barang.</td></tr>';
      return;
    }

    tbody.innerHTML = snap.docs.map(doc => {
      const p = doc.data();
      return `<tr>
        <td><strong>${p.namaBarang}</strong></td>
        <td>${p.jumlah} pcs</td>
        <td>${p.tanggalKembaliRencana}</td>
        <td><span class="badge badge-${badgePeminjaman(p.status)}">${p.status}</span></td>
        <td style="text-align:right">
          ${p.status === 'Disetujui' ? `<button class="btn btn-sm btn-primary" onclick="kembalikanBarangUser('${doc.id}', '${p.barangId}',${p.jumlah})">↩️ Kembalikan</button>` : '—'}
        </td>
      </tr>`;
    }).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--red)">Error: ${e.message}</td></tr>`;
  }
}

async function kembalikanBarangUser(peminjamanId, barangId, jumlah) {
  if (!confirm('Kembalikan barang ini ke gudang?')) return;
  showLoading();
  try {
    const barang = allBarang.find(b => b.id === barangId);
    const stokBaru = (barang?.stok || 0) + jumlah;

    await db.collection('barang').doc(barangId).update({ stok: stokBaru });
    await db.collection('peminjaman').doc(peminjamanId).update({
      status: 'Dikembalikan',
      tanggalKembaliAktual: new Date().toISOString().slice(0, 10)
    });

    hideLoading();
    showToast('Barang berhasil dikembalikan! ✅');
    loadRiwayatPeminjamanUser();
  } catch (e) {
    hideLoading();
    showToast('Gagal: ' + e.message, 'error');
  }
}

async function loadKelolaPeminjamanAdmin() {
  const tbody = document.getElementById('admin-peminjaman-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Memuat persetujuan...</td></tr>';

  try {
    const snap = await db.collection('peminjaman').get();
    if (snap.empty) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted)">Belum ada pengajuan.</td></tr>';
      return;
    }

    tbody.innerHTML = snap.docs.map(doc => {
      const p = doc.data();
      return `<tr>
        <td><strong>${p.namaUser}</strong></td>
        <td>${p.namaBarang}</td>
        <td>${p.jumlah} pcs</td>
        <td><span class="badge badge-${badgePeminjaman(p.status)}">${p.status}</span></td>
        <td>${p.alasan || '—'}</td>
        <td style="text-align:right">
          ${p.status === 'Menunggu' ? `
            <button class="btn btn-sm btn-success" onclick="prosesApprovalPeminjaman('${doc.id}', '${p.barangId}',${p.jumlah}, 'setujui')">✅ Setujui</button>
            <button class="btn btn-sm btn-danger" onclick="prosesApprovalPeminjaman('${doc.id}', '${p.barangId}',${p.jumlah}, 'tolak')">❌ Tolak</button>
          ` : '—'}
        </td>
      </tr>`;
    }).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--red)">Error: ${e.message}</td></tr>`;
  }
}

async function prosesApprovalPeminjaman(peminjamanId, barangId, jumlah, aksi) {
  showLoading();
  try {
    if (aksi === 'setujui') {
      const barang = allBarang.find(b => b.id === barangId);
      if ((barang?.stok || 0) < jumlah) {
        hideLoading();
        showToast('Stok tidak mencukupi untuk disetujui!', 'error');
        return;
      }
      await db.collection('barang').doc(barangId).update({ stok: barang.stok - jumlah });
      await db.collection('peminjaman').doc(peminjamanId).update({ status: 'Disetujui' });
      showToast('Peminjaman disetujui ✅');
    } else {
      await db.collection('peminjaman').doc(peminjamanId).update({ status: 'Ditolak' });
      showToast('Peminjaman ditolak ❌');
    }
    hideLoading();
    loadKelolaPeminjamanAdmin();
  } catch (e) {
    hideLoading();
    showToast('Gagal: ' + e.message, 'error');
  }
}

function badgePeminjaman(status) {
  if (status === 'Disetujui') return 'aman';
  if (status === 'Menunggu') return 'menipis';
  if (status === 'Ditolak') return 'habis';
  return 'muted';
}