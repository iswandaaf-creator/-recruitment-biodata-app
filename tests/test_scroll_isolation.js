/**
 * tests/test_scroll_isolation.js
 * Empirical Challenger Suite for Viewport Lock & Independent Multi-Pane Scrolling
 * Team: Kuki (QA Lead), Opus (Architect), Hermes (Developer), Cila (Designer)
 */

const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const puppeteer = require('puppeteer');

const mockUser = { id: 1, username: 'admin_test', nama: 'Administrator HR', role: 'superadmin' };
const mockCsrf = 'mock-csrf-token-scroll-999';
const formatDate = () => '25/10/2026';

// Generate 30 mock candidates so the middle area overflows vertically
const mockCandidates = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  created_at: new Date('2026-10-24T10:00:00Z'),
  nama_lengkap: `Kandidat Pelamar #${i + 1} Calon Pegawai`,
  nama_panggilan: `Kandidat ${i + 1}`,
  nomor_ktp: `320123456789${String(i).padStart(4, '0')}`,
  no_rekening: '1234567890',
  no_hp: '08123456789',
  email: `kandidat${i + 1}@example.com`,
  divisi: i % 2 === 0 ? 'Barista' : 'Operasional',
  posisi_dilamar: i % 2 === 0 ? 'Senior Barista' : 'Staff Operasional',
  kesimpulan_status: i % 3 === 0 ? 'Diterima' : (i % 3 === 1 ? 'Belum Diproses' : 'Ditolak'),
  is_duplicate: false,
  duplicate_count: 1,
  foto_kandidat: null,
  share_token: `c-token-${i + 1}`,
  review_count: 1,
  catatan_reviewer: 'Catatan seleksi'
}));

// Generate 30 mock operational records so the BA table overflows vertically
const mockOpsRecords = Array.from({ length: 30 }, (_, i) => ({
  id: 100 + i,
  no_ba: `BA/OPS/2026/${String(i + 1).padStart(3, '0')}`,
  tanggal_pengajuan: '2026-10-25',
  outlet_divisi: 'Outlet Pekalongan',
  departemen: 'Bar & Service',
  pic_pengajuan: `PIC Lapangan ${i + 1}`,
  nama_barang: `Barang Inventaris Outlet #${i + 1}`,
  status_barang: 'Barang Baru',
  total_estimasi: 5000000 + (i * 250000),
  prioritas: i % 2 === 0 ? 'Urgent' : 'Normal',
  status_approval: i % 2 === 0 ? 'Menunggu Approval' : 'Disetujui'
}));

async function runScrollAudit() {
  console.log('========================================================================');
  console.log('  KUKI & OPUS: INDEPENDENT SCROLLING & VIEWPORT LOCK EMPIRICAL AUDIT    ');
  console.log('========================================================================\n');

  const viewsDir = path.join(__dirname, '..', 'views');
  const publicDir = path.join(__dirname, '..', 'public');

  const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, 'http://localhost:3097');
    const pathname = parsedUrl.pathname;

    if (pathname.startsWith('/assets/')) {
      const filePath = path.join(publicDir, pathname);
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath);
        const mimeMap = {
          '.css': 'text/css',
          '.js': 'text/javascript',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.woff2': 'font/woff2',
          '.woff': 'font/woff',
          '.ttf': 'font/ttf'
        };
        res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'text/plain' });
        return res.end(fs.readFileSync(filePath));
      }
    }

    try {
      if (pathname === '/admin') {
        const html = ejs.render(fs.readFileSync(path.join(viewsDir, 'admin.ejs'), 'utf8'), {
          candidates: mockCandidates,
          stats: {
            total: 30,
            pending: 10,
            accepted: 10,
            rejected: 10,
            duplicate: 0,
            by_division: { Barista: 15, Operasional: 15 }
          },
          user: mockUser,
          currentShareUrl: 'http://localhost:3097/?ref=c-master-scroll-token',
          csrfToken: mockCsrf,
          query: {},
          formatDate,
          filename: path.join(viewsDir, 'admin.ejs')
        });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(html);
      }

      if (pathname === '/operasional') {
        const html = ejs.render(fs.readFileSync(path.join(viewsDir, 'operasional_admin.ejs'), 'utf8'), {
          records: mockOpsRecords,
          user: mockUser,
          csrfToken: mockCsrf,
          shareUrl: 'http://localhost:3097/pengajuan-barang?ref=ba-scroll-token',
          query: {},
          formatDate,
          filename: path.join(viewsDir, 'operasional_admin.ejs')
        });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(html);
      }

      res.writeHead(404);
      res.end('Not Found');
    } catch (err) {
      console.error('[SERVER ERROR]', err);
      res.writeHead(500);
      res.end(err.stack);
    }
  });

  await new Promise(r => server.listen(3097, r));
  console.log('✅ Local Mock Server running on http://localhost:3097\n');

  const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kov-scroll-test-'));

  const browser = await puppeteer.launch({
    headless: 'new',
    userDataDir: tempUserDataDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let totalTests = 0;
  let passedTests = 0;

  function report(title, passed, detail = '') {
    totalTests++;
    if (passed) {
      passedTests++;
      console.log(`  ✅ [PASS] ${title} ${detail ? '(' + detail + ')' : ''}`);
    } else {
      console.error(`  ❌ [FAIL] ${title} ${detail ? ': ' + detail : ''}`);
    }
  }

  try {
    const page = await browser.newPage();
    // Desktop Viewport 1440x900
    await page.setViewport({ width: 1440, height: 900 });

    // =========================================================================
    // TEST SUITE 1: HR DASHBOARD 3-PANE INDEPENDENT SCROLLING (/admin)
    // =========================================================================
    console.log('--- 1. AUDIT SCROLL ISOLATION: HR DASHBOARD 3-KOLOM (/admin) ---');
    await page.goto('http://localhost:3097/admin', { waitUntil: 'networkidle0' });

    // Check initial layout state
    const initialAdminState = await page.evaluate(() => {
      const sidebar = document.querySelector('.dd-sidebar');
      const canvas = document.querySelector('.dd-main-canvas');
      const rightPanel = document.querySelector('.dd-right-panel');
      const sidebarRect = sidebar.getBoundingClientRect();
      const rightRect = rightPanel.getBoundingClientRect();

      return {
        windowScrollY: window.scrollY,
        sidebarTop: sidebarRect.top,
        sidebarHeight: sidebarRect.height,
        rightTop: rightRect.top,
        rightHeight: rightRect.height,
        canvasScrollTop: canvas.scrollTop,
        canvasScrollHeight: canvas.scrollHeight,
        canvasClientHeight: canvas.clientHeight
      };
    });

    report('Window ScrollY awal adalah 0', initialAdminState.windowScrollY === 0, `scrollY: ${initialAdminState.windowScrollY}`);
    report('Sidebar terpasang penuh pada viewport (top = 0, height = 900px)', initialAdminState.sidebarTop === 0 && initialAdminState.sidebarHeight === 900, `top: ${initialAdminState.sidebarTop}, height: ${initialAdminState.sidebarHeight}`);
    report('Right Utility Panel terpasang penuh pada viewport (top = 0, height = 900px)', initialAdminState.rightTop === 0 && initialAdminState.rightHeight === 900, `top: ${initialAdminState.rightTop}, height: ${initialAdminState.rightHeight}`);
    report('Canvas tengah memiliki konten panjang yang dapat discroll', initialAdminState.canvasScrollHeight > initialAdminState.canvasClientHeight, `scrollHeight: ${initialAdminState.canvasScrollHeight}px, clientHeight: ${initialAdminState.canvasClientHeight}px`);

    // Perform scroll on center canvas by 500px
    console.log('  -> Melakukan scroll 500px ke bawah pada Kanvas Tengah...');
    await page.evaluate(() => {
      const canvas = document.querySelector('.dd-main-canvas');
      canvas.scrollTo({ top: 500, behavior: 'instant' });
    });
    await new Promise(r => setTimeout(r, 200));

    // Measure post-scroll positions
    const postScrollAdminState = await page.evaluate(() => {
      const sidebar = document.querySelector('.dd-sidebar');
      const canvas = document.querySelector('.dd-main-canvas');
      const rightPanel = document.querySelector('.dd-right-panel');
      const sidebarRect = sidebar.getBoundingClientRect();
      const rightRect = rightPanel.getBoundingClientRect();

      return {
        windowScrollY: window.scrollY,
        sidebarTop: sidebarRect.top,
        sidebarHeight: sidebarRect.height,
        rightTop: rightRect.top,
        rightHeight: rightRect.height,
        canvasScrollTop: canvas.scrollTop
      };
    });

    report('Kanvas Tengah berhasil discroll', postScrollAdminState.canvasScrollTop >= 450, `scrollTop: ${postScrollAdminState.canvasScrollTop}px`);
    report('Window browser TIDAK ikut ter-scroll (window.scrollY tetap 0)', postScrollAdminState.windowScrollY === 0, `window.scrollY: ${postScrollAdminState.windowScrollY}`);
    report('Menu Sidebar KIRI TIDAK ikut naik (tetap menempel di top = 0)', postScrollAdminState.sidebarTop === 0, `sidebar.top: ${postScrollAdminState.sidebarTop}px`);
    report('Panel KANAN TIDAK ikut naik (tetap menempel di top = 0)', postScrollAdminState.rightTop === 0, `rightPanel.top: ${postScrollAdminState.rightTop}px`);

    // Capture visual proof of scrolled canvas with fixed sidebars
    const screenshotAdminPath = path.join(__dirname, '..', '..', '.gemini', 'antigravity-cli', 'brain', '41a9a5d4-6eb7-444c-bcfc-256cd766709f', 'scroll_isolation_admin_proof.png');
    await page.screenshot({ path: screenshotAdminPath });
    console.log(`  📸 Screenshot scroll isolation HR Dashboard tersimpan di: ${screenshotAdminPath}`);


    // =========================================================================
    // TEST SUITE 2: MULTI-PORTAL APPSHELL INDEPENDENT SCROLLING (/operasional)
    // =========================================================================
    console.log('\n--- 2. AUDIT SCROLL ISOLATION: PORTAL OPERASIONAL (/operasional) ---');
    await page.goto('http://localhost:3097/operasional', { waitUntil: 'networkidle0' });

    const initialOpsState = await page.evaluate(() => {
      const sidebar = document.querySelector('.kov-sidebar');
      const mainContent = document.querySelector('.kov-main-content');
      const topbar = document.querySelector('.kov-topbar');
      const sidebarRect = sidebar.getBoundingClientRect();
      const topbarRect = topbar.getBoundingClientRect();

      return {
        windowScrollY: window.scrollY,
        sidebarTop: sidebarRect.top,
        sidebarHeight: sidebarRect.height,
        topbarTop: topbarRect.top,
        mainScrollHeight: mainContent.scrollHeight,
        mainClientHeight: mainContent.clientHeight,
        mainScrollTop: mainContent.scrollTop
      };
    });

    report('Window ScrollY awal portal operasional adalah 0', initialOpsState.windowScrollY === 0, `scrollY: ${initialOpsState.windowScrollY}`);
    report('Sidebar Operasional terpasang di top = 0 dan height = 900px', initialOpsState.sidebarTop === 0 && initialOpsState.sidebarHeight === 900, `top: ${initialOpsState.sidebarTop}, height: ${initialOpsState.sidebarHeight}`);
    report('Konten Operasional memiliki konten tabel panjang yang dapat discroll', initialOpsState.mainScrollHeight > initialOpsState.mainClientHeight, `scrollHeight: ${initialOpsState.mainScrollHeight}px, clientHeight: ${initialOpsState.mainClientHeight}px`);

    // Perform scroll on .kov-main-content by 400px
    console.log('  -> Melakukan scroll 400px ke bawah pada Bagian Tengah Operasional...');
    await page.evaluate(() => {
      const mainContent = document.querySelector('.kov-main-content');
      mainContent.scrollTo({ top: 400, behavior: 'instant' });
    });
    await new Promise(r => setTimeout(r, 200));

    const postScrollOpsState = await page.evaluate(() => {
      const sidebar = document.querySelector('.kov-sidebar');
      const mainContent = document.querySelector('.kov-main-content');
      const topbar = document.querySelector('.kov-topbar');
      const sidebarRect = sidebar.getBoundingClientRect();
      const topbarRect = topbar.getBoundingClientRect();

      return {
        windowScrollY: window.scrollY,
        sidebarTop: sidebarRect.top,
        topbarTop: topbarRect.top,
        mainScrollTop: mainContent.scrollTop
      };
    });

    report('Bagian Tengah Operasional berhasil discroll', postScrollOpsState.mainScrollTop >= 350, `scrollTop: ${postScrollOpsState.mainScrollTop}px`);
    report('Window browser TIDAK ikut ter-scroll (window.scrollY tetap 0)', postScrollOpsState.windowScrollY === 0, `window.scrollY: ${postScrollOpsState.windowScrollY}`);
    report('Sidebar Menu Operasional TIDAK ikut naik (tetap menempel di top = 0)', postScrollOpsState.sidebarTop === 0, `sidebar.top: ${postScrollOpsState.sidebarTop}px`);
    report('Topbar Sticky Operasional tetap terkunci di bagian atas layar (top = 0)', postScrollOpsState.topbarTop === 0, `topbar.top: ${postScrollOpsState.topbarTop}px`);

    const screenshotOpsPath = path.join(__dirname, '..', '..', '.gemini', 'antigravity-cli', 'brain', '41a9a5d4-6eb7-444c-bcfc-256cd766709f', 'scroll_isolation_operasional_proof.png');
    await page.screenshot({ path: screenshotOpsPath });
    console.log(`  📸 Screenshot scroll isolation Operasional tersimpan di: ${screenshotOpsPath}`);

    console.log('\n========================================================================');
    console.log(`  HASIL AKHIR AUDIT SCROLL ISOLATION: ${passedTests} / ${totalTests} PENGUJIAN LULUS (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log('========================================================================\n');

  } finally {
    await browser.close();
    server.close();
  }
}

runScrollAudit().catch(err => {
  console.error('[AUDIT FAILED CRITICALLY]', err);
  process.exit(1);
});
