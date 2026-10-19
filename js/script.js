/* ═══════════════════════════════════════
   Gudang Barang Kelompok 2 — script.js
════════════════════════════════════════ */

let trendChartInstance = null;

/* ── Show a page by its element ID ── */
function showPage(id) {
  document.querySelectorAll('.page, .auth-page').forEach(function(p) {
    p.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

/* ── Navigate to an inner page; initialise chart when needed ── */
function navTo(pageId) {
  showPage(pageId);
  if (pageId === 'page-dashboard-admin') {
    setTimeout(initTrendChart, 100);
  }
}

/* ── Initialise the monthly trend line chart (Dashboard Admin) ── */
function initTrendChart() {
  var ctx = document.getElementById('trendChart');
  if (!ctx) return;

  /* Destroy previous instance so the canvas can be reused */
  if (trendChartInstance) {
    trendChartInstance.destroy();
    trendChartInstance = null;
  }

  trendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN'],
      datasets: [
        {
          label: 'Pesanan masuk',
          data: [5, 40, 160, 110, 205, 125],
          borderColor: '#2d7a4f',
          backgroundColor: 'transparent',
          tension: 0.3,
          pointRadius: 4,
          borderWidth: 2.5
        },
        {
          label: 'Pesanan Keluar',
          data: [5, 80, 45, 135, 80, 145],
          borderColor: '#b8860b',
          backgroundColor: 'transparent',
          tension: 0.3,
          pointRadius: 4,
          borderWidth: 2.5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            boxWidth: 24,
            font: { size: 12 },
            color: '#555'
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#888' }
        },
        y: {
          min: 0,
          max: 220,
          ticks: { stepSize: 50, color: '#888' },
          grid: { color: '#eee' }
        }
      }
    }
  });
}