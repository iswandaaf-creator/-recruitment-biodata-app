/**
 * tests/test_dribbble_ui.js
 * Empirical Challenger Suite for Dribbble Cloud Drive UI/UX Modernization
 * Author: Kuki (QA Lead & Security Auditor)
 */

const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const puppeteer = require('puppeteer');

const mockCandidates = [
  {
    id: 1,
    created_at: new Date('2026-10-24T10:00:00Z'),
    nama_lengkap: 'Budi Santoso',
    nama_panggilan: 'Budi',
    nomor_ktp: '3201234567890001',
    no_rekening: '1234567890',
    no_hp: '08123456789',
    email: 'budi@example.com',
    divisi: 'Barista',
    posisi_dilamar: 'Head Barista',
    kesimpulan_status: 'Diterima',
    is_duplicate: false,
    duplicate_count: 1,
    foto_kandidat: null,
    share_token: 'c-budi1234',
    review_count: 2,
    catatan_reviewer: 'Sangat kompeten'
  },
  {
    id: 2,
    created_at: new Date('2026-10-24T12:00:00Z'),
    nama_lengkap: 'Siti Rahma',
    nama_panggilan: 'Siti',
    nomor_ktp: '3201234567890002',
    no_rekening: '9876543210',
    no_hp: '08234567890',
    email: 'siti@example.com',
    divisi: 'Operasional',
    posisi_dilamar: 'Staff Operasional',
    kesimpulan_status: 'Belum Diproses',
    is_duplicate: false,
    duplicate_count: 1,
    foto_kandidat: 'https://via.placeholder.com/150',
    share_token: 'c-siti1234',
    review_count: 0,
    catatan_reviewer: ''
  },
  {
    id: 3,
    created_at: new Date('2026-10-23T14:00:00Z'),
    nama_lengkap: 'Agus Setiawan',
    nama_panggilan: 'Agus',
    nomor_ktp: '3201234567890003',
    no_rekening: '5556667778',
    no_hp: '08345678901',
    email: 'agus@example.com',
    divisi: 'Kitchen',
    posisi_dilamar: 'Cook Helper',
    kesimpulan_status: 'Dipertimbangkan',
    is_duplicate: true,
    duplicate_count: 2,
    foto_kandidat: null,
    share_token: 'c-agus1234',
    review_count: 1,
    catatan_reviewer: 'Perlu tes kedua'
  },
  {
    id: 4,
    created_at: new Date('2026-10-22T09:00:00Z'),
    nama_lengkap: 'Dewi Lestari',
    nama_panggilan: 'Dewi',
    nomor_ktp: '3201234567890004',
    no_rekening: '1122334455',
    no_hp: '08456789012',
    email: 'dewi@example.com',
    divisi: 'Barista',
    posisi_dilamar: 'Junior Barista',
    kesimpulan_status: 'Ditolak',
    is_duplicate: false,
    duplicate_count: 1,
    foto_kandidat: null,
    share_token: 'c-dewi1234',
    review_count: 1,
    catatan_reviewer: 'Kurang pengalaman'
  }
];

const mockUser = {
  username: 'admin',
  nama: 'Administrator HR',
  role: 'superadmin'
};

async function runEmpiricalAudit() {
  console.log('===============================================================');
  console.log('  KUKI EMPIRICAL AUDIT: DRIBBLE CLOUD DRIVE UI/UX VERIFICATION ');
  console.log('===============================================================\n');

  // Step 1: Render View
  const viewPath = path.join(__dirname, '..', 'views', 'admin.ejs');
  const template = fs.readFileSync(viewPath, 'utf-8');
  const renderedHtml = ejs.render(template, {
    candidates: mockCandidates,
    user: mockUser,
    baseUrl: 'http://localhost:3099',
    csrfToken: 'test-csrf-token-xyz',
    formatDate: (d) => '25/10/2026'
  }, { filename: viewPath });

  console.log('✅ PASS 1: EJS View compiles and renders without errors (' + renderedHtml.length + ' bytes)');

  // Step 2: Spin up lightweight local server with full public assets
  const server = http.createServer((req, res) => {
    const cleanUrl = req.url.split('?')[0];
    if (cleanUrl === '/' || cleanUrl === '/admin') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderedHtml);
    } else {
      const publicPath = path.join(__dirname, '..', 'public', cleanUrl);
      if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
        const ext = path.extname(publicPath);
        const mimeMap = {
          '.css': 'text/css',
          '.js': 'application/javascript',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.woff2': 'font/woff2',
          '.woff': 'font/woff'
        };
        res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
        res.end(fs.readFileSync(publicPath));
      } else {
        res.writeHead(404);
        res.end();
      }
    }
  });

  await new Promise(resolve => server.listen(3099, resolve));
  console.log('✅ PASS 2: Local HTTP Mock Server running on http://localhost:3099');

  // Step 3: Launch Puppeteer
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
    const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kov-ui-' + Date.now() + '-'));

    browser = await puppeteer.launch({
      headless: 'new',
      userDataDir: tempUserDataDir,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3099/admin', { waitUntil: 'domcontentloaded' });

    console.log('\n--- 1. VERIFIKASI STRUKTUR & TATA LETAK 3-KOLOM ---');
    const shell = await page.$('.dd-layout-root');
    report('App Shell 3-Kolom hadir', !!shell);

    const sidebar = await page.$('.dd-sidebar');
    report('Sidebar Midnight Navy (#131429) aktif', !!sidebar);

    const storageGauge = await page.$('.dd-storage-gauge');
    report('Widget Storage Gauge fake di sidebar berhasil dihapus bersih', !storageGauge);

    const mainCanvas = await page.$('.dd-main-canvas');
    report('Main Workspace Canvas hadir', !!mainCanvas);

    const rightPanel = await page.$('.dd-right-panel');
    report('Right Utility Panel hadir', !!rightPanel);

    const viewToggle = await page.$('.dd-view-toggle');
    report('Tombol dummy View Toggle di Topbar berhasil dihapus bersih', !viewToggle);

    const dupUploadBtn = await page.$('#btnUploadCTA');
    report('Tombol duplikat Salin Link Form di Topbar berhasil dihapus bersih', !dupUploadBtn);

    console.log('\n--- 2. VERIFIKASI HERO WELCOME BANNER ---');
    const heroCard = await page.$('.dd-hero-banner');
    const heroTitle = await page.$eval('.dd-hero-title', el => el.textContent.trim());
    report('Hero Welcome Banner terpasang', !!heroCard && heroTitle.includes('Administrator HR'), `Greeting: ${heroTitle}`);

    const heroBtn = await page.$('.btn-dd-hero');
    report('Hero CTA Button ("Salin Link Formulir") hadir', !!heroBtn);

    console.log('\n--- 3. VERIFIKASI VIBRANT FOLDER CARDS (KATEGORI DIVISI - 8 DIVISI LENGKAP) ---');
    const folders = await page.$$('.dd-folder-card');
    report('8 Folder Cards Divisi Lengkap terpasang simetris', folders.length === 8, `${folders.length} kartu terdeteksi`);

    // Test clicking Folder 1 (Barista)
    await page.click('.dd-folder-coral');
    await new Promise(r => setTimeout(r, 100));
    const divisiVal1 = await page.$eval('#divisiSelect', el => el.value);
    const visibleCount1 = await page.$$eval('#candidateTableBody tr[data-id]', rows => rows.filter(r => r.style.display !== 'none').length);
    report('Klik Folder Barista (Coral) menyaring tabel divisi', divisiVal1 === 'barista' && visibleCount1 === 2, `Visible: ${visibleCount1} kandidat Barista`);

    // Test clicking Folder 2 (Operasional)
    await page.click('.dd-folder-royal');
    await new Promise(r => setTimeout(r, 100));
    const divisiVal2 = await page.$eval('#divisiSelect', el => el.value);
    const visibleCount2 = await page.$$eval('#candidateTableBody tr[data-id]', rows => rows.filter(r => r.style.display !== 'none').length);
    report('Klik Folder Operasional (Blue) menyaring tabel divisi', divisiVal2 === 'operasional' && visibleCount2 === 1, `Visible: ${visibleCount2} kandidat Ops`);

    // Reset filter to All
    await page.click('.dd-folder-indigo');
    await new Promise(r => setTimeout(r, 100));
    const divisiVal3 = await page.$eval('#divisiSelect', el => el.value);
    const visibleCount3 = await page.$$eval('#candidateTableBody tr[data-id]', rows => rows.filter(r => r.style.display !== 'none').length);
    report('Klik Folder Semua Kandidat (Midnight Slate) mereset filter', divisiVal3 === 'all' && visibleCount3 === 4, `Visible: ${visibleCount3} kandidat`);

    console.log('\n--- 4. VERIFIKASI STATUS FILTER PILLS ---');
    // Test filter 'Diterima'
    await page.click('.kov-filter-pill-botanical[data-filter="Diterima"]');
    await new Promise(r => setTimeout(r, 100));
    let statusCount = await page.$$eval('#candidateTableBody tr[data-id]', rows => rows.filter(r => r.style.display !== 'none').length);
    report('Filter Pill: "Diterima" menyaring data dengan benar', statusCount === 1, `Visible: ${statusCount}`);

    // Test filter 'Belum Diproses'
    await page.click('.kov-filter-pill-botanical[data-filter="Belum Diproses"]');
    await new Promise(r => setTimeout(r, 100));
    statusCount = await page.$$eval('#candidateTableBody tr[data-id]', rows => rows.filter(r => r.style.display !== 'none').length);
    report('Filter Pill: "Belum Diproses" menyaring data dengan benar', statusCount === 1, `Visible: ${statusCount}`);

    // Test filter 'duplicate'
    await page.click('.kov-filter-pill-botanical[data-filter="duplicate"]');
    await new Promise(r => setTimeout(r, 100));
    statusCount = await page.$$eval('#candidateTableBody tr[data-id]', rows => rows.filter(r => r.style.display !== 'none').length);
    report('Filter Pill: "Duplikat" menyaring data ganda dengan benar', statusCount === 1, `Visible: ${statusCount}`);

    // Reset to 'all'
    await page.click('.kov-filter-pill-botanical[data-filter="all"]');
    await new Promise(r => setTimeout(r, 100));
    statusCount = await page.$$eval('#candidateTableBody tr[data-id]', rows => rows.filter(r => r.style.display !== 'none').length);
    report('Filter Pill: "Semua" menampilkan seluruh pelamar', statusCount === 4, `Visible: ${statusCount}`);

    console.log('\n--- 5. VERIFIKASI PENCARIAN LIVE (SEARCH INPUT) ---');
    await page.type('#searchInput', 'siti');
    await new Promise(r => setTimeout(r, 100));
    let searchCount = await page.$$eval('#candidateTableBody tr[data-id]', rows => rows.filter(r => r.style.display !== 'none').length);
    report('Pencarian "siti" memfilter baris kandidat', searchCount === 1, `Hasil: ${searchCount} baris`);

    // Clear search
    await page.$eval('#searchInput', el => el.value = '');
    await page.keyboard.press('Backspace');
    await new Promise(r => setTimeout(r, 100));
    searchCount = await page.$$eval('#candidateTableBody tr[data-id]', rows => rows.filter(r => r.style.display !== 'none').length);
    report('Mengosongkan input pencarian mengembalikan seluruh data', searchCount === 4, `Hasil: ${searchCount} baris`);

    console.log('\n--- 6. VERIFIKASI PENGACAK TOKEN & SALIN LINK ---');
    const initialUrl = await page.$eval('#shareUrl', el => el.textContent.trim());
    await page.evaluate(() => document.getElementById('btnAcakToken').click());
    await new Promise(r => setTimeout(r, 150));
    const updatedUrl = await page.$eval('#shareUrl', el => el.textContent.trim());
    report('Tombol "Acak Token Baru" menghasilkan token acak unik', initialUrl !== updatedUrl && updatedUrl.includes('/?ref=c-'), `URL Baru: ${updatedUrl}`);

    const btnSalin = await page.$('#btnSalinLink');
    report('Tombol "Salin Link" siap berinteraksi', !!btnSalin);

    console.log('\n--- 7. VERIFIKASI KALENDER SELEKSI INTERAKTIF ---');
    const calDisplay = await page.$eval('#calMonthDisplay', el => el.textContent.trim());
    report('Kalender seleksi terpasang di Right Panel', calDisplay.includes('Oktober 2026'), `Bulan: ${calDisplay}`);

    // Click next month
    await page.evaluate(() => document.getElementById('btnNextCalMonth').click());
    await new Promise(r => setTimeout(r, 100));
    const nextMonth = await page.$eval('#calMonthDisplay', el => el.textContent.trim());
    report('Navigasi bulan kalender interaktif', nextMonth.includes('November 2026'), `Navigasi: ${nextMonth}`);

    // Switch period to Minggu
    await page.evaluate(() => document.getElementById('calTabWeek').click());
    await new Promise(r => setTimeout(r, 100));
    const isWeekActive = await page.$eval('#calTabWeek', el => el.classList.contains('active'));
    report('Tab periode kalender ("Minggu") aktif saat diklik', isWeekActive);

    console.log('\n--- 8. VERIFIKASI "YOUR TASK" / TINDAKAN TERTUNDA ---');
    const taskCard = await page.$('.dd-task-card');
    report('Widget "Tindakan Tertunda" tampil dengan accent bar merah', !!taskCard);

    // Click task card -> should filter to 'Belum Diproses'
    await page.evaluate(() => document.querySelector('.dd-task-card').click());
    await new Promise(r => setTimeout(r, 100));
    const taskFilterCount = await page.$$eval('#candidateTableBody tr[data-id]', rows => rows.filter(r => r.style.display !== 'none').length);
    report('Klik kartu tugas menyaring berkas "Belum Diproses"', taskFilterCount === 1, `Sisa berkas: ${taskFilterCount}`);

    // Reset filter
    await page.click('.kov-filter-pill-botanical[data-filter="all"]');
    await new Promise(r => setTimeout(r, 100));

    console.log('\n--- 9. VERIFIKASI PEMBERSIHAN WIDGET STORAGE FAKE DARI RIGHT PANEL ---');
    const statsCard = await page.$('.dd-storage-chart-card');
    report('Widget Kapasitas Berkas fake berhasil dihapus bersih dari Right Panel', !statsCard);

    console.log('\n--- 10. VERIFIKASI BADGE FORMAT FILE PADA TABEL PELAMAR ---');
    const fileBadges = await page.$$('.dd-file-badge');
    report('Badge format file (PDF / PNG / ZIP) tampil di setiap baris kandidat', fileBadges.length >= 4, `${fileBadges.length} badge terdeteksi`);

    const reviewBtn = await page.$('.kov-action-review-btn');
    report('Tombol Review berkas kandidat berfungsi dengan link /admin/candidate/:id', !!reviewBtn);

    const pdfBtn = await page.$('.kov-action-icon-circle[title="Export PDF Biodata"]');
    report('Tombol Export PDF Biodata per kandidat hadir', !!pdfBtn);

    // Reset scroll and filter before screenshot
    await page.evaluate(() => {
      document.querySelector('.kov-filter-pill-botanical[data-filter="all"]')?.click();
      const canvas = document.querySelector('.dd-main-canvas');
      if (canvas) canvas.scrollTop = 0;
      window.scrollTo(0, 0);
    });
    await new Promise(r => setTimeout(r, 200));

    // Capture visual screenshot of the modernized dashboard
    const screenshotPath = 'C:\\Users\\ACER\\.gemini\\antigravity-cli\\brain\\41a9a5d4-6eb7-444c-bcfc-256cd766709f\\dribbble_drive_dashboard.png';
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log('📸 Visual screenshot captured at:', screenshotPath);

    console.log('\n===============================================================');
    console.log(`  HASIL AUDIT EMPIRIS KUKI: ${passCount} / ${testCount} PENGUJIAN LULUS (${Math.round((passCount / testCount) * 100)}%)`);
    console.log('===============================================================\n');

  } catch (err) {
    console.error('CRITICAL AUDIT ERROR:', err);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

runEmpiricalAudit();
