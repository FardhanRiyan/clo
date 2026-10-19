/* ═══════════════════════════════════════
   js/barang.js
   Data Barang: real-time listener, render tabel, filter, tambah barang baru
   Depends on: firebase.js, state.js, utils.js, dashboard.js
════════════════════════════════════════ */

/* ── Real-time listener untuk koleksi barang ── */
function loadAllBarang() {
  db.collection('barang').orderBy('kode').onSnapshot((snap) => {
    allBarang = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderDataBarang();
    renderBarangSelect();
  }, (error) => {
    console.error('Gagal memuat data barang:', error);
    const tbody = document.getElementById('data-barang-body');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="5" style="color:var(--red);text-align:center">Gagal memuat data barang.</td></tr>';
    }
  });
}

/* ── Render tabel Data Barang ── */
function renderDataBarang(list) {
  const data  = list !== undefined ? list : allBarang;
  const tbody = document.getElementById('data-barang-body');
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:var(--muted);text-align:center">Tidak ada barang ditemukan.</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(b => {
    const st = getStatus(b);
    return `<tr>
      <td style="color:var(--muted)">${b.kode || '—'}</td>
      <td>${b.nama}</td>
      <td style="color:var(--muted)">${b.kategori || '—'}</td>
      <td>${b.stok} pcs</td>
      <td style="text-align:right">
        <span class="badge ${badgeClass(st)}">${st}</span>
      </td>
    </tr>`;
  }).join('');
}

/* ── Filter data barang (cari, kategori, status) ── */
function filterBarang() {
  const cari     = (document.getElementById('filter-cari')?.value     || '').toLowerCase();
  const kategori =  document.getElementById('filter-kategori')?.value || '';
  const status   =  document.getElementById('filter-status')?.value   || '';

  const filtered = allBarang.filter(b => {
    const matchCari     = !cari     || b.nama?.toLowerCase().includes(cari) || b.kode?.toLowerCase().includes(cari);
    const matchKategori = !kategori || b.kategori === kategori;
    const matchStatus   = !status   || getStatus(b) === status;
    return matchCari && matchKategori && matchStatus;
  });

  renderDataBarang(filtered);
}

/* ── Isi dropdown barang di form masuk & keluar ── */
function renderBarangSelect() {
  const opts = allBarang.length
    ? allBarang.map(b =>
        `<option value="${b.id}" data-stok="${b.stok}">${b.kode} — ${b.nama}</option>`
      ).join('')
    : '<option value="">Belum ada barang</option>';

  ['masuk-barang-select', 'keluar-barang-select'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<option value="">— Pilih barang —</option>${opts}`;
  });

  /* Default tanggal = hari ini */
  const today = new Date().toISOString().slice(0, 10);
  ['masuk-tanggal', 'keluar-tanggal'].forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.value) el.value = today;
  });
}

/* ── Modal tambah barang baru ── */
function openTambahBarang() {
  document.getElementById('modal-tambah').style.display = 'flex';
}

function closeModalDirect() {
  document.getElementById('modal-tambah').style.display = 'none';
}

function closeModal(e) {
  if (e.target.id === 'modal-tambah') closeModalDirect();
}

async function simpanBarangBaru() {
  const kode    = document.getElementById('new-kode').value.trim();
  const nama    = document.getElementById('new-nama').value.trim();
  const kategori = document.getElementById('new-kategori').value;
  const stok    = parseInt(document.getElementById('new-stok').value)    || 0;
  const minStok = parseInt(document.getElementById('new-minStok').value) || 10;

  if (!nama) { showToast('Nama barang wajib diisi.', 'error'); return; }

  showLoading();
  try {
    await db.collection('barang').add({
      kode, nama, kategori, stok, minStok,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    closeModalDirect();
    hideLoading();
    showToast(`Barang "${nama}" berhasil ditambahkan ✅`);
    ['new-kode', 'new-nama', 'new-stok'].forEach(id => {
      document.getElementById(id).value = '';
    });
  } catch (e) {
    hideLoading();
    showToast('Gagal: ' + e.message, 'error');
  }
}


function renderDataBarang() {
  const tbody = document.getElementById('data-barang-body');
  if (!tbody) return;

  const isAdmin = currentUserData?.role === 'admin';

  tbody.innerHTML = allBarang.map(b => `
    <tr>
      <td>${b.kode}</td>
      <td>${b.nama}</td>
      <td>${b.stok} pcs</td>
      <td style="text-align:right">
        ${isAdmin ? `
          <!-- Aksi khusus Admin -->
          <button onclick="openEditBarang('${b.id}')">✏️ Edit</button>
          <button onclick="hapusBarang('${b.id}')">🗑️ Hapus</button>
        ` : `
          <!-- Aksi khusus User -->
          <button class="btn-primary" onclick="openModalPinjam('${b.id}')">📌 Pinjam</button>
        `}
      </td>
    </tr>
  `).join('');
}

function loadAllBarang() {
  db.collection('barang').orderBy('kode').onSnapshot((snap) => {
    allBarang = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderDataBarang();
    renderBarangSelect();
    renderDashboardStats();
    if (currentUserData?.role === 'admin') renderDashboardAdmin();
    else renderDashboardUser();
  }, (error) => {
    console.error('Gagal memuat data barang:', error);
    ['dash-perhatian-body', 'adm-perhatian-body'].forEach(id => {
      const tbody = document.getElementById(id);
      if (tbody) tbody.innerHTML = '<tr><td colspan="2" style="color:var(--red);text-align:center">Gagal memuat data barang.</td></tr>';
    });
  });
}

function renderDashboardStats() {
  const total = allBarang.length;
  const aman = allBarang.filter(b => getStatus(b) === 'Aman').length;
  const menipis = allBarang.filter(b => getStatus(b) === 'Menipis').length;
  const habis = allBarang.filter(b => getStatus(b) === 'Habis').length;
  const perhatian = allBarang.filter(b => getStatus(b) !== 'Aman');

  [['dash-total', total], ['adm-total', total], ['dash-aman', aman],
    ['dash-menipis', menipis], ['dash-habis', habis],
    ['adm-rendah', menipis + habis]].forEach(([id, value]) => setText(id, value));

  ['dash-perhatian-body', 'adm-perhatian-body'].forEach(id => {
    const tbody = document.getElementById(id);
    if (!tbody) return;
    tbody.innerHTML = perhatian.length
      ? perhatian.map(b => `<tr><td>${b.nama || '—'}</td><td style="text-align:right"><span class="badge ${badgeClass(getStatus(b))}">${getStatus(b)}</span></td></tr>`).join('')
      : '<tr><td colspan="2" style="color:var(--muted);text-align:center">Tidak ada barang yang perlu perhatian.</td></tr>';
  });
}

function renderDataBarang() {
  const tbody = document.getElementById('data-barang-body');
  if (!tbody) return;

  const isAdmin = currentUserData?.role === 'admin';

  if (!allBarang.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted)">Belum ada data barang.</td></tr>';
    return;
  }

  tbody.innerHTML = allBarang.map(b => {
    const st = getStatus(b);
    return `<tr>
      <td>${b.kode || '—'}</td>
      <td><strong>${b.nama}</strong></td>
      <td>${b.kategori || '—'}</td>
      <td>${b.stok} pcs</td>
      <td style="text-align:right">
        ${isAdmin ? `
          <button class="btn btn-sm" onclick="hapusBarang('${b.id}')">🗑️ Hapus</button>
        ` : `
          <button class="btn btn-sm btn-primary" ${b.stok <= 0 ? 'disabled' : ''} onclick="bukaModalPinjam('${b.id}')">📌 Pinjam</button>
        `}
      </td>
    </tr>`;
  }).join('');
}

function openTambahBarang() {
  const modal = document.getElementById('modal-tambah');
  if (modal) modal.style.display = 'flex';
}

function closeModalDirect() {
  const modal = document.getElementById('modal-tambah');
  if (modal) modal.style.display = 'none';
}

let barangYangDiedit = null;

function openEditBarang(id) {
  const barang = allBarang.find(item => item.id === id);
  if (!barang) return;

  barangYangDiedit = id;
  document.getElementById('edit-kode').value = barang.kode || '';
  document.getElementById('edit-nama').value = barang.nama || '';
  document.getElementById('edit-kategori').value = barang.kategori || 'ATK';
  document.getElementById('edit-minStok').value = barang.minStok ?? 10;
  document.getElementById('modal-edit-barang').style.display = 'flex';
}

function closeEditBarang() {
  const modal = document.getElementById('modal-edit-barang');
  if (modal) modal.style.display = 'none';
  barangYangDiedit = null;
}

async function simpanEditBarang() {
  if (!barangYangDiedit) return;

  const kode = document.getElementById('edit-kode').value.trim();
  const nama = document.getElementById('edit-nama').value.trim();
  const kategori = document.getElementById('edit-kategori').value;
  const minStok = parseInt(document.getElementById('edit-minStok').value) || 0;

  if (!nama) {
    showToast('Nama barang wajib diisi.', 'error');
    return;
  }

  showLoading();
  try {
    await db.collection('barang').doc(barangYangDiedit).update({ kode, nama, kategori, minStok });
    closeEditBarang();
    hideLoading();
    showToast(`Barang "${nama}" berhasil diperbarui.`);
  } catch (error) {
    hideLoading();
    showToast('Gagal memperbarui: ' + error.message, 'error');
  }
}

async function simpanBarangBaru() {
  const kode = document.getElementById('new-kode').value.trim();
  const nama = document.getElementById('new-nama').value.trim();
  const kategori = document.getElementById('new-kategori').value;
  const stok = parseInt(document.getElementById('new-stok').value) || 0;

  if (!nama) { showToast('Nama barang wajib diisi.', 'error'); return; }

  showLoading();
  try {
    await db.collection('barang').add({
      kode, nama, kategori, stok,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    closeModalDirect();
    hideLoading();
    showToast(`Barang "${nama}" berhasil ditambahkan ✅`);
  } catch (e) {
    hideLoading();
    showToast('Gagal: ' + e.message, 'error');
  }
}

async function hapusBarang(id) {
  if (!confirm('Hapus barang ini dari daftar inventaris?')) return;
  showLoading();
  try {
    await db.collection('barang').doc(id).delete();
    hideLoading();
    showToast('Barang berhasil dihapus ✅');
  } catch (e) {
    hideLoading();
    showToast('Gagal menghapus: ' + e.message, 'error');
  }
}