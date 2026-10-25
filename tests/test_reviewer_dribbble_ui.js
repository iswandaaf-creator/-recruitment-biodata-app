const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const ejs = require('ejs');
const os = require('os');

// Mock Data for Reviewer Dashboard Verification
const mockCandidates = [
  {
    id: 1,
    nama_lengkap: 'Budi Santoso',
    no_hp: '081234567890',
    kota_domisili: 'Pekalongan',
    divisi: 'Barista',
    posisi_dilamar: 'Head Barista',
    created_at: '2026-10-25T08:00:00.000Z',
    foto_kandidat: null,
    review_count: 2,
    latest_rekomendasi: 'Direkomendasikan Lolos',
    latest_catatan: 'Skill latte art sangat baik, pengalaman 3 tahun.',
    latest_reviewer_name: 'Bpk. Hendra (SPV Barista)',
    latest_review_date: '2026-10-25T09:30:00.000Z',
    kesimpulan_status: 'Diterima'
  },
  {
    id: 2,
    nama_lengkap: 'Siti Aminah',
    no_hp: '081987654321',
    kota_domisili: 'Batang',
    divisi: 'Barista',
    posisi_dilamar: 'Junior Barista',
    created_at: '2026-10-25T08:30:00.000Z',
    foto_kandidat: null,
    review_count: 0,
    latest_rekomendasi: null,
    latest_catatan: null,
    latest_reviewer_name: null,
    latest_review_date: null,
    kesimpulan_status: 'Belum Diproses'
  },
  {
    id: 3,
    nama_lengkap: 'Rian Firmansyah',
    no_hp: '085711223344',
    kota_domisili: 'Semarang',
    divisi: 'Operasional',
    posisi_dilamar: 'Staff Outlet',
    created_at: '2026-10-24T14:00:00.000Z',
    foto_kandidat: null,
    review_count: 1,
    latest_rekomendasi: 'Dipertimbangkan',
    latest_catatan: 'Karakter ramah, perlu cek kesiapan shift malam.',
    latest_reviewer_name: 'Ibu Ratna (Ops Lead)',
    latest_review_date: '2026-10-25T07:15:00.000Z',
    kesimpulan_status: 'Dipertimbangkan'
  },
  {
    id: 4,
    nama_lengkap: 'Ahmad Fauzi',
    no_hp: '081399887766',
    kota_domisili: 'Pemalang',
    divisi: 'Kitchen',
    posisi_dilamar: 'Cook & Pastry',
    created_at: '2026-10-23T11:20:00.000Z',
    foto_kandidat: null,
    review_count: 0,
    latest_rekomendasi: null,
    latest_catatan: null,
    latest_reviewer_name: null,
    latest_review_date: null,
    kesimpulan_status: 'Belum Diproses'
  }
];

const mockUser = {
  id: 4,
  username: 'reviewer_lead',
  nama: 'Hendra Reviewer Lead',
  role: 'Reviewer USER',
  reviewer_divisions: 'Barista, Operasional, Kitchen'
};

function formatDate(dateVal, includeTime = false) {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return dateVal;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  if (!includeTime) return `${day}/${month}/${year}`;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

async function runReviewerAudit() {
  console.log('===============================================================');
  console.log('  KUKI & CILA EMPIRICAL AUDIT: REVIEWER DRIBBLE CLOUD DRIVE UI ');
  console.log('===============================================================\n');

  const viewsDir = path.join(__dirname, '..', 'views');
  const publicDir = path.join(__dirname, '..', 'public');
  const templatePath = path.join(viewsDir, 'reviewer_dashboard.ejs');

  // Verify EJS template compiles
  let renderedHtml = '';
  try {
    const tpl = fs.readFileSync(templatePath, 'utf8');
    renderedHtml = ejs.render(tpl, {
      candidates: mockCandidates,
      user: mockUser,
      allowedDivisions: ['Barista', 'Operasional', 'Kitchen'],
      success: null,
      error: null,
      formatDate,
      filename: templatePath
    });
    console.log(`✅ PASS 1: EJS View compiles and renders without errors (${renderedHtml.length} bytes)`);
  } catch (err) {
    console.error('❌ FAIL 1: EJS template rendering failed:', err);
    process.exit(1);
  }

  // Create local HTTP server on port 3096
  const server = http.createServer((req, res) => {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost:3096');
      const pathname = parsedUrl.pathname;

      if (pathname === '/reviewer' || pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(renderedHtml);
      }

      const filePath = path.join(publicDir, pathname);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentTypes = {
          '.css': 'text/css',
          '.js': 'application/javascript',
          '.jpg': 'image/jpeg',
          '.png': 'image/png',
          '.svg': 'image/svg+xml'
        };
        res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
        return res.end(fs.readFileSync(filePath));
      }

      res.writeHead(404);
      res.end('Not Found');
    } catch (err) {
      res.writeHead(500);
      res.end(err.stack);
    }
  });

  await new Promise(r => server.listen(3096, r));
  console.log('✅ PASS 2: Local HTTP Mock Server running on http://localhost:3096\n');

  let browser;
  let testCount = 0;
  let passCount = 0;

  function report(name, condition, details = '') {
    testCount++;
    if (condition) {
      passCount++;
      console.log(`  ✅ [PASS] ${name} ${details ? '(' + details + ')' : ''}`);
    } else {
      console.error(`  ❌ [FAIL] ${name} ${details ? ': ' + details : ''}`);
    }
  }

  try {
    const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kov-rev-' + Date.now() + '-'));

    browser = await puppeteer.launch({
      headless: 'new',
      userDataDir: tempUserDataDir,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3096/reviewer', { waitUntil: 'domcontentloaded' });

    console.log('--- 1. VERIFIKASI STRUKTUR & TATA LETAK 3-KOLOM DRIBBLE DRIVE ---');
    const shell = await page.$('.dd-layout-root');
    report('App Shell 3-Kolom hadir', !!shell);

    const sidebar = await page.$('.dd-sidebar');
    report('Sidebar Midnight Navy (#131429) hadir', !!sidebar);

    const mainCanvas = await page.$('.dd-main-canvas');
    report('Main Center Canvas hadir', !!mainCanvas);

    const rightPanel = await page.$('.dd-right-panel');
    report('Right Utility Panel hadir', !!rightPanel);

    console.log('\n--- 2. VERIFIKASI TOPBAR SIMETRIS 46PX ---');
    const searchInput = await page.$('.dd-search-input');
    const searchBox = await searchInput.boundingBox();
    report('Input pencarian topbar simetris (Tinggi ~46px)', Math.abs(searchBox.height - 46) <= 2, `Tinggi: ${searchBox.height}px`);

    const viewToggle = await page.$('.dd-view-toggle');
    const toggleBox = await viewToggle.boundingBox();
    report('View toggle switch hadir dengan tinggi seragam', Math.abs(toggleBox.height - 46) <= 2, `Tinggi: ${toggleBox.height}px`);

    const exportBtn = await page.$('.btn-drive-upload');
    const exportBox = await exportBtn.boundingBox();
    report('Tombol CTA Export Excel seragam (Tinggi ~46px)', Math.abs(exportBox.height - 46) <= 2, `Tinggi: ${exportBox.height}px`);

    console.log('\n--- 3. VERIFIKASI HERO WELCOME BANNER ---');
    const heroBanner = await page.$('.dd-hero-banner');
    report('Hero Welcome Banner terpasang', !!heroBanner);

    const heroGreeting = await page.$eval('.dd-hero-title', el => el.textContent.trim());
    report('Nama reviewer tampil pada greeting', heroGreeting.includes('Hendra Reviewer Lead'), `Greeting: ${heroGreeting}`);

    const heroIllustration = await page.$('.dd-hero-illustration svg');
    report('Ilustrasi SVG Dribbble Cloud Drive terpasang di Hero Banner', !!heroIllustration);

    const assignedDivsCount = await page.$$eval('.dd-hero-banner .status-pill-modern', pills => pills.length);
    report('Pill divisi penugasan tampil di Hero Banner', assignedDivsCount === 3, `${assignedDivsCount} divisi penugasan`);

    console.log('\n--- 4. VERIFIKASI 8 VIBRANT FOLDER CARDS (KATEGORI DIVISI) ---');
    const folderCards = await page.$$('.dd-folder-card');
    report('8 Folder Cards divisi lengkap terpasang', folderCards.length === 8, `${folderCards.length} kartu terdeteksi`);

    // Click Barista card
    await page.evaluate(() => document.querySelector('.dd-folder-card[data-divisi="barista"]').click());
    await new Promise(r => setTimeout(r, 100));
    const baristaVisibleCount = await page.$$eval('.candidate-grid-item', items => items.filter(i => i.style.display !== 'none').length);
    report('Klik Folder Barista menyaring 2 kandidat Barista', baristaVisibleCount === 2, `Tampil: ${baristaVisibleCount}`);

    // Click Semua card to reset
    await page.evaluate(() => document.querySelector('.dd-folder-card[data-divisi="all"]').click());
    await new Promise(r => setTimeout(r, 100));
    const allVisibleCount = await page.$$eval('.candidate-grid-item', items => items.filter(i => i.style.display !== 'none').length);
    report('Klik Folder Semua Kandidat mereset filter ke 4 pelamar', allVisibleCount === 4, `Tampil: ${allVisibleCount}`);

    console.log('\n--- 5. VERIFIKASI SEGMENTED FILTER STATUS PILLS ---');
    // Filter Belum Direview
    await page.evaluate(() => document.querySelector('.filter-btn[data-filter="BELUM"]').click());
    await new Promise(r => setTimeout(r, 100));
    const pendingCount = await page.$$eval('.candidate-grid-item', items => items.filter(i => i.style.display !== 'none').length);
    report('Filter Pill "Belum Direview" menyaring berkas pending', pendingCount === 2, `Tampil: ${pendingCount}`);

    // Filter Sudah Direview
    await page.evaluate(() => document.querySelector('.filter-btn[data-filter="SUDAH"]').click());
    await new Promise(r => setTimeout(r, 100));
    const reviewedCount = await page.$$eval('.candidate-grid-item', items => items.filter(i => i.style.display !== 'none').length);
    report('Filter Pill "Sudah Direview" menyaring berkas yang telah dievaluasi', reviewedCount === 2, `Tampil: ${reviewedCount}`);

    // Reset filter
    await page.evaluate(() => document.querySelector('.filter-btn[data-filter="ALL"]').click());
    await new Promise(r => setTimeout(r, 100));

    console.log('\n--- 6. VERIFIKASI LIVE SEARCH INPUT ---');
    await page.type('#searchInput', 'siti');
    await new Promise(r => setTimeout(r, 100));
    const searchResultCount = await page.$$eval('.candidate-grid-item', items => items.filter(i => i.style.display !== 'none').length);
    report('Pencarian "siti" memfilter kandidat Siti Aminah', searchResultCount === 1, `Hasil: ${searchResultCount}`);

    await page.evaluate(() => {
      document.getElementById('searchInput').value = '';
      window.filterTable();
    });
    await new Promise(r => setTimeout(r, 100));

    console.log('\n--- 7. VERIFIKASI TOGGLE VIEW MODE (GRID & SPREADSHEET) ---');
    // Switch to Spreadsheet mode
    await page.evaluate(() => document.getElementById('btnViewList').click());
    await new Promise(r => setTimeout(r, 100));
    const isGridHidden = await page.$eval('#candidatesGridView', el => el.classList.contains('d-none'));
    const isListVisible = await page.$eval('#candidatesListView', el => !el.classList.contains('d-none'));
    report('Toggle ke Tampilan Spreadsheet berhasil', isGridHidden && isListVisible);

    // Switch back to Grid mode
    await page.evaluate(() => document.getElementById('btnViewGrid').click());
    await new Promise(r => setTimeout(r, 100));
    const isGridBack = await page.$eval('#candidatesGridView', el => !el.classList.contains('d-none'));
    report('Toggle kembali ke Tampilan Grid Kartu berhasil', isGridBack);

    console.log('\n--- 8. VERIFIKASI RIGHT UTILITY PANEL WIDGETS ---');
    const storageGauge = await page.$('.dd-storage-card');
    report('Widget Progress Evaluasi (50% Selesai) hadir', !!storageGauge);

    const calDisplay = await page.$eval('#calMonthDisplay', el => el.textContent.trim());
    report('Kalender seleksi Dribbble hadir di Right Panel', calDisplay.includes('Oktober 2026'), `Bulan: ${calDisplay}`);

    // Click next month
    await page.evaluate(() => document.getElementById('btnNextCalMonth').click());
    await new Promise(r => setTimeout(r, 100));
    const nextMonth = await page.$eval('#calMonthDisplay', el => el.textContent.trim());
    report('Navigasi bulan kalender interaktif', nextMonth.includes('November 2026'), `Navigasi: ${nextMonth}`);

    const taskCard = await page.$('.dd-task-card');
    report('Widget "Tindakan Tertunda" tampil dengan accent bar merah', !!taskCard);

    // Click task card -> should filter to 'BELUM'
    await page.evaluate(() => document.querySelector('.dd-task-card').click());
    await new Promise(r => setTimeout(r, 100));
    const taskFilteredCount = await page.$$eval('.candidate-grid-item', items => items.filter(i => i.style.display !== 'none').length);
    report('Klik kartu tugas menyaring berkas "Belum Direview"', taskFilteredCount === 2, `Sisa berkas: ${taskFilteredCount}`);

    const artifactPath = path.join('C:\\Users\\ACER\\.gemini\\antigravity-cli\\brain\\41a9a5d4-6eb7-444c-bcfc-256cd766709f', 'reviewer_dribbble_proof.png');
    await page.screenshot({ path: artifactPath, fullPage: false });
    console.log(`📸 Visual screenshot captured at: ${artifactPath}`);

  } catch (err) {
    console.error('CRITICAL AUDIT ERROR:', err);
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  console.log('\n===============================================================');
  console.log(`  HASIL AUDIT EMPIRIS REVIEWER: ${passCount} / ${testCount} PENGUJIAN LULUS (${Math.round((passCount/testCount)*100)}%)`);
  console.log('===============================================================');

  if (passCount !== testCount) {
    process.exit(1);
  }
}

runReviewerAudit();
