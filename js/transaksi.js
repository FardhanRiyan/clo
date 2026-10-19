/* ═══════════════════════════════════════
   js/transaksi.js
   CRUD penuh: Create, Read, Update, Delete
   untuk transaksi barang masuk & keluar
   Depends on: firebase.js, state.js, utils.js
════════════════════════════════════════ */

/* ─────────────────────────────────────
   HELPERS
───────────────────────────────────── */
function updateStokInfo() {
  const sel  = document.getElementById('keluar-barang-select');
  const opt  = sel?.selectedOptions[0];
  const stok = opt?.dataset.stok ?? '—';
  const el   = document.getElementById('stok-info-text');
  if (el) el.textContent = `Stok tersedia: ${stok} pcs`;
}

/* ─────────────────────────────────────
   CREATE — Barang Masuk
───────────────────────────────────── */
async function simpanBarangMasuk() {
  const barangId = document.getElementById('masuk-barang-select').value;
  const jumlah   = parseInt(document.getElementById('masuk-jumlah').value);
  const tanggal  = document.getElementById('masuk-tanggal').value;
  const catatan  = document.getElementById('masuk-catatan')?.value.trim() || '';

  if (!barangId || !jumlah || jumlah < 1) {
    showToast('Pilih barang dan isi jumlah yang valid.', 'error'); return;
  }

  showLoading();
  try {
    const barang   = allBarang.find(b => b.id === barangId);
    const stokBaru = (barang?.stok || 0) + jumlah;

    await db.collection('barang').doc(barangId).update({ stok: stokBaru });
    await db.collection('transaksi').add({
      type: 'masuk', barangId,
      namaBarang: barang?.nama || '',
      jumlah, tanggal, catatan,
      createdBy: currentUser?.uid || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    hideLoading();
    showToast(`Stok ${barang?.nama} bertambah ${jumlah} pcs ✅`);
    document.getElementById('masuk-jumlah').value  = '';
    if (document.getElementById('masuk-catatan')) document.getElementById('masuk-catatan').value = '';
    loadRiwayat('masuk');
  } catch (e) {
    hideLoading();
    showToast('Gagal menyimpan: ' + e.message, 'error');
  }
}

/* ─────────────────────────────────────
   CREATE — Barang Keluar
───────────────────────────────────── */
async function simpanBarangKeluar() {
  const barangId = document.getElementById('keluar-barang-select').value;
  const jumlah   = parseInt(document.getElementById('keluar-jumlah').value);
  const tanggal  = document.getElementById('keluar-tanggal').value;
  const catatan  = document.getElementById('keluar-catatan')?.value.trim() || '';

  if (!barangId || !jumlah || jumlah < 1) {
    showToast('Pilih barang dan isi jumlah yang valid.', 'error'); return;
  }

  const barang = allBarang.find(b => b.id === barangId);
  if (jumlah > (barang?.stok || 0)) {
    showToast(`Stok tidak cukup! Tersedia: ${barang?.stok} pcs`, 'error'); return;
  }

  showLoading();
  try {
    const stokBaru = (barang?.stok || 0) - jumlah;

    await db.collection('barang').doc(barangId).update({ stok: stokBaru });
    await db.collection('transaksi').add({
      type: 'keluar', barangId,
      namaBarang: barang?.nama || '',
      jumlah, tanggal, catatan,
      createdBy: currentUser?.uid || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    hideLoading();
    showToast(`Stok ${barang?.nama} berkurang ${jumlah} pcs ✅`);
    document.getElementById('keluar-jumlah').value = '';
    if (document.getElementById('keluar-catatan')) document.getElementById('keluar-catatan').value = '';
    updateStokInfo();
    loadRiwayat('keluar');
  } catch (e) {
    hideLoading();
    showToast('Gagal menyimpan: ' + e.message, 'error');
  }
}

/* ─────────────────────────────────────
   READ — Load riwayat transaksi
───────────────────────────────────── */
async function loadRiwayat(type) {
  const tbodyId = type === 'masuk' ? 'riwayat-masuk-body' : 'riwayat-keluar-body';
  const tbody   = document.getElementById(tbodyId);
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" style="color:var(--muted);text-align:center;padding:20px">Memuat...</td></tr>`;

  try {
    const snap = await db.collection('transaksi')
      .where('type', '==', type)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="5" style="color:var(--muted);text-align:center;padding:20px">Belum ada riwayat.</td></tr>`;
      return;
    }

    const isPlus = type === 'masuk';
    tbody.innerHTML = snap.docs.map(d => {
      const t   = d.data();
      const tgl = formatTanggalLengkap(t.tanggal);
      const qtyColor = isPlus ? 'var(--green)' : 'var(--red)';
      const qtySign  = isPlus ? '+' : '-';
      return `<tr>
        <td style="color:var(--muted);font-size:12px;white-space:nowrap">${tgl}</td>
        <td><strong>${t.namaBarang}</strong></td>
        <td style="color:${qtyColor};font-weight:700;text-align:center">${qtySign}${t.jumlah} pcs</td>
        <td style="color:var(--muted);font-size:12px">${t.catatan || '—'}</td>
        <td style="text-align:right;white-space:nowrap">
          <button class="btn-tbl-edit"  onclick="openEditTransaksi('${d.id}','${type}',${t.jumlah},'${t.tanggal}','${t.namaBarang}','${(t.catatan||'').replace(/'/g,"\\'")}','${t.barangId}')">✏️</button>
          <button class="btn-tbl-hapus" onclick="hapusTransaksi('${d.id}','${type}','${t.barangId}',${t.jumlah})">🗑️</button>
        </td>
      </tr>`;
    }).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--red)">Error: ${e.message}</td></tr>`;
  }
}

/* ─────────────────────────────────────
   UPDATE — Edit transaksi
───────────────────────────────────── */
let _editData = {};

function openEditTransaksi(id, type, jumlah, tanggal, namaBarang, catatan, barangId) {
  _editData = { id, type, jumlahLama: parseInt(jumlah), barangId };

  document.getElementById('edit-trx-jumlah').value  = jumlah;
  document.getElementById('edit-trx-tanggal').value = tanggal;
  document.getElementById('edit-trx-catatan').value = catatan || '';
  document.getElementById('edit-trx-nama').textContent = namaBarang;
  document.getElementById('edit-trx-type').textContent = type === 'masuk' ? '📥 Masuk' : '📤 Keluar';

  document.getElementById('modal-edit-trx').style.display = 'flex';
}

function closeEditTransaksi() {
  document.getElementById('modal-edit-trx').style.display = 'none';
  _editData = {};
}

async function simpanEditTransaksi() {
  const jumlahBaru = parseInt(document.getElementById('edit-trx-jumlah').value);
  const tanggal    = document.getElementById('edit-trx-tanggal').value;
  const catatan    = document.getElementById('edit-trx-catatan').value.trim();

  if (!jumlahBaru || jumlahBaru < 1) {
    showToast('Jumlah harus lebih dari 0.', 'error'); return;
  }

  const { id, type, jumlahLama, barangId } = _editData;
  const barang   = allBarang.find(b => b.id === barangId);
  const selisih  = jumlahBaru - jumlahLama;

  /* Hitung stok baru berdasarkan selisih perubahan */
  let stokBaru = barang?.stok || 0;
  if (type === 'masuk')  stokBaru += selisih;
  if (type === 'keluar') stokBaru -= selisih;

  if (stokBaru < 0) {
    showToast('Perubahan ini membuat stok menjadi negatif!', 'error'); return;
  }

  showLoading();
  try {
    await db.collection('transaksi').doc(id).update({ jumlah: jumlahBaru, tanggal, catatan });
    await db.collection('barang').doc(barangId).update({ stok: stokBaru });

    closeEditTransaksi();
    hideLoading();
    showToast('Transaksi berhasil diperbarui ✅');
    loadRiwayat(type);
  } catch (e) {
    hideLoading();
    showToast('Gagal memperbarui: ' + e.message, 'error');
  }
}

/* ─────────────────────────────────────
   DELETE — Hapus transaksi
───────────────────────────────────── */
async function hapusTransaksi(id, type, barangId, jumlah) {
  if (!confirm(`Hapus transaksi ini? Stok akan dikembalikan.`)) return;

  const barang  = allBarang.find(b => b.id === barangId);
  let stokBaru  = barang?.stok || 0;

  /* Balikkan efek transaksi ke stok */
  if (type === 'masuk')  stokBaru -= jumlah;
  if (type === 'keluar') stokBaru += jumlah;
  if (stokBaru < 0) stokBaru = 0;

  showLoading();
  try {
    await db.collection('transaksi').doc(id).delete();
    await db.collection('barang').doc(barangId).update({ stok: stokBaru });

    hideLoading();
    showToast('Transaksi berhasil dihapus 🗑️');
    loadRiwayat(type);
  } catch (e) {
    hideLoading();
    showToast('Gagal menghapus: ' + e.message, 'error');
  }
}

/* ─────────────────────────────────────
   FORMAT TANGGAL LENGKAP
───────────────────────────────────── */
function formatTanggalLengkap(str) {
  if (!str) return '—';
  const d = new Date(str);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
