/**
 * tests/empirical_challenger.js
 * Empirical Challenger Verification & Adversarial Stress Harness
 * 
 * Verifies:
 * 1. SQLite WAL mode, busy_timeout, integrity_check, and concurrency stress.
 * 2. Health check endpoint (/health).
 * 3. Candidate delete route (POST /admin/candidate/delete/:id) with Auth gates, CSRF gates,
 *    cascading delete, and malformed parameter handling.
 * 4. Export endpoints (PDF and Excel generation with magic byte validation).
 * 5. Adversarial security tests (CSRF bypass, Path Traversal, Role Escalation, Unauthenticated access).
 */

const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { DatabaseSync } = require('node:sqlite');

const TEST_PORT = 3099;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
const projectRoot = path.join(__dirname, '..');
const dbPath = path.join(projectRoot, 'db', 'database.sqlite');

let passedTests = 0;
let failedTests = 0;
const results = [];

function recordResult(name, success, details = '') {
  if (success) {
    passedTests++;
    console.log(`  ✅ PASS: ${name}`);
    results.push({ name, status: 'PASS', details });
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${name} - ${details}`);
    results.push({ name, status: 'FAIL', details });
  }
}

// HTTP request helper with Cookie jar
class TestClient {
  constructor() {
    this.cookies = {};
    this.csrfToken = null;
  }

  updateCookies(setCookieHeaders) {
    if (!setCookieHeaders) return;
    const headers = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
    for (const h of headers) {
      const parts = h.split(';')[0].split('=');
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        this.cookies[name] = value;
      }
    }
    if (this.cookies['XSRF-TOKEN']) {
      this.csrfToken = decodeURIComponent(this.cookies['XSRF-TOKEN']);
    }
  }

  getCookieString() {
    return Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join('; ');
  }

  request(options, bodyData = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(options.path || '/', BASE_URL);
      const reqOptions = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'EmpiricalChallenger/1.0',
          ...(options.headers || {})
        }
      };

      const cookieStr = this.getCookieString();
      if (cookieStr) {
        reqOptions.headers['Cookie'] = cookieStr;
      }

      let payload = null;
      if (bodyData) {
        if (typeof bodyData === 'string') {
          payload = Buffer.from(bodyData);
          if (!reqOptions.headers['Content-Type']) {
            reqOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
          }
        } else if (Buffer.isBuffer(bodyData)) {
          payload = bodyData;
        } else {
          payload = Buffer.from(JSON.stringify(bodyData));
          if (!reqOptions.headers['Content-Type']) {
            reqOptions.headers['Content-Type'] = 'application/json';
          }
        }
        reqOptions.headers['Content-Length'] = payload.length;
      }

      const req = http.request(reqOptions, (res) => {
        this.updateCookies(res.headers['set-cookie']);
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const bodyText = buffer.toString('utf-8');
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            bodyText,
            bodyBuffer: buffer
          });
        });
      });

      req.on('error', reject);
      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  }

  async login(username, password) {
    // 1. GET login page to obtain initial session and CSRF token
    const getRes = await this.request({ path: '/admin/login', method: 'GET' });
    let token = this.csrfToken;
    if (!token) {
      const match = getRes.bodyText.match(/name="_csrf"\s+value="([^"]+)"/);
      if (match) token = match[1];
    }
    this.csrfToken = token;

    // 2. POST login credentials
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    if (token) params.append('_csrf', token);

    const postRes = await this.request({
      path: '/admin/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }, params.toString());

    return postRes;
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// -------------------------------------------------------------
// MAIN TEST HARNESS
// -------------------------------------------------------------
async function runAllEmpiricalTests() {
  console.log('===============================================================');
  console.log('   EMPIRICAL CHALLENGER: VERIFICATION & ADVERSARIAL HARNESS    ');
  console.log('===============================================================\n');

  // --- SECTION 1: SQLite WAL Mode, Busy Timeout, and Concurrency Stress ---
  console.log('[SECTION 1] SQLite WAL Mode, Integrity & Concurrency');
  try {
    const db = new DatabaseSync(dbPath);
    const jm = db.prepare('PRAGMA journal_mode;').get();
    const ic = db.prepare('PRAGMA integrity_check;').get();
    db.close();

    const dbSource = fs.readFileSync(path.join(projectRoot, 'db.js'), 'utf-8');
    const hasBusyTimeoutConfig = dbSource.includes("PRAGMA busy_timeout = 5000;");

    recordResult('SQLite PRAGMA journal_mode is WAL', jm && jm.journal_mode === 'wal', `Got ${jm ? jm.journal_mode : 'null'}`);
    recordResult('SQLite PRAGMA integrity_check returns ok', ic && ic.integrity_check === 'ok', `Got ${ic ? ic.integrity_check : 'null'}`);
    recordResult('db.js configures PRAGMA busy_timeout = 5000', hasBusyTimeoutConfig, 'Verified in db.js source');

    // Concurrency stress test: 10 parallel connections reading and writing to a temporary test table
    const testDb1 = new DatabaseSync(dbPath);
    testDb1.exec('CREATE TABLE IF NOT EXISTS _wal_concurrency_test (id INTEGER PRIMARY KEY, thread_id INT, val TEXT);');
    testDb1.close();

    let concurrencySuccess = true;
    let concurrencyErrors = [];
    const threads = [];
    for (let i = 0; i < 10; i++) {
      threads.push((async (threadId) => {
        try {
          const conn = new DatabaseSync(dbPath);
          conn.exec('PRAGMA busy_timeout = 5000;');
          for (let step = 0; step < 5; step++) {
            conn.prepare('INSERT INTO _wal_concurrency_test (thread_id, val) VALUES (?, ?);').run(threadId, `step_${step}_${Date.now()}`);
            const count = conn.prepare('SELECT COUNT(*) as c FROM _wal_concurrency_test;').get();
          }
          conn.close();
        } catch (err) {
          concurrencySuccess = false;
          concurrencyErrors.push(`Thread ${threadId}: ${err.message}`);
        }
      })(i));
    }
    await Promise.all(threads);

    const cleanupDb = new DatabaseSync(dbPath);
    cleanupDb.exec('DROP TABLE IF EXISTS _wal_concurrency_test;');
    cleanupDb.close();

    recordResult('SQLite WAL handles concurrent connections without locking error', concurrencySuccess, concurrencyErrors.join('; '));
  } catch (err) {
    recordResult('SQLite WAL & Concurrency check', false, err.message);
  }

  // --- SECTION 2: Spawn Server for HTTP & API Tests ---
  console.log('\n[SECTION 2] Starting Express Application on Port ' + TEST_PORT);
  const serverProcess = spawn('node', ['server.js'], {
    cwd: projectRoot,
    env: { ...process.env, PORT: TEST_PORT.toString() },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // Wait for server health endpoint to become ready (up to 20s)
  let serverReady = false;
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    try {
      const client = new TestClient();
      const res = await client.request({ path: '/health' });
      if (res.statusCode === 200) {
        serverReady = true;
        break;
      }
    } catch (e) {
      // Waiting
    }
  }

  if (!serverReady) {
    recordResult('Server startup and /health responsiveness', false, 'Server failed to start on port ' + TEST_PORT);
    serverProcess.kill();
    process.exit(1);
  }
  recordResult('Server successfully booted and responding on port ' + TEST_PORT, true);

  const directDb = new DatabaseSync(dbPath);

  try {
    // --- SECTION 3: Health Check Endpoint (/health) ---
    console.log('\n[SECTION 3] Health Check Endpoint (/health)');
    const healthClient = new TestClient();
    const healthRes = await healthClient.request({ path: '/health' });
    recordResult('GET /health returns HTTP 200', healthRes.statusCode === 200, `Got HTTP ${healthRes.statusCode}`);

    let healthJson = {};
    try {
      healthJson = JSON.parse(healthRes.bodyText);
    } catch (e) {}

    recordResult('GET /health JSON has status: "ok"', healthJson.status === 'ok', `Got ${healthJson.status}`);
    recordResult('GET /health JSON has database: "connected"', healthJson.database === 'connected', `Got ${healthJson.database}`);
    recordResult('GET /health JSON has positive uptime', typeof healthJson.uptime === 'number' && healthJson.uptime > 0, `Uptime: ${healthJson.uptime}`);

    // --- SECTION 4: Candidate Delete Route (POST /admin/candidate/delete/:id) ---
    console.log('\n[SECTION 4] Candidate Delete Route Verification & Gates');

    // Setup: Create test candidates
    directDb.prepare('DELETE FROM candidate_reviews WHERE candidate_id IN (9988, 9989, 9990, 9991);').run();
    directDb.prepare('DELETE FROM candidates WHERE id IN (9988, 9989, 9990, 9991);').run();

    directDb.prepare('INSERT INTO candidates (id, nama_lengkap, email, posisi_dilamar) VALUES (?, ?, ?, ?);')
      .run(9988, 'Test Candidate Unauth', 'unauth@example.com', 'Barista');
    directDb.prepare('INSERT INTO candidates (id, nama_lengkap, email, posisi_dilamar) VALUES (?, ?, ?, ?);')
      .run(9989, 'Test Candidate Operasional Gate', 'ops@example.com', 'Kitchen');
    directDb.prepare('INSERT INTO candidates (id, nama_lengkap, email, posisi_dilamar) VALUES (?, ?, ?, ?);')
      .run(9990, 'Test Candidate CSRF Gate', 'csrf@example.com', 'Teknisi');
    directDb.prepare('INSERT INTO candidates (id, nama_lengkap, email, posisi_dilamar) VALUES (?, ?, ?, ?);')
      .run(9991, 'Test Candidate Valid Delete', 'valid@example.com', 'HR');

    // Add associated reviews for candidate 9991 to test cascading delete
    directDb.prepare('INSERT INTO candidate_reviews (candidate_id, catatan, divisi, rekomendasi) VALUES (?, ?, ?, ?);')
      .run(9991, 'Evaluasi tahap 1 bagus', 'HR', 'Disarankan');
    directDb.prepare('INSERT INTO candidate_reviews (candidate_id, catatan, divisi, rekomendasi) VALUES (?, ?, ?, ?);')
      .run(9991, 'Evaluasi tahap 2 siap wawancara', 'HR', 'Dipertimbangkan');

    // 4.1 Test Unauthenticated request -> should NOT delete and should return 401 or redirect 302
    const unauthClient = new TestClient();
    const unauthDeleteRes = await unauthClient.request({
      path: '/admin/candidate/delete/9988',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }, '_csrf=some_token');
    
    // Check candidate 9988 is still in DB
    const cand9988 = directDb.prepare('SELECT id FROM candidates WHERE id = 9988;').get();
    recordResult('Unauthenticated DELETE is blocked and redirected to login', 
      (unauthDeleteRes.statusCode === 302 || unauthDeleteRes.statusCode === 401 || unauthDeleteRes.statusCode === 403) && !!cand9988,
      `Status ${unauthDeleteRes.statusCode}, Cand exists: ${!!cand9988}`);

    // 4.2 Test Non-Superadmin request (Operasional role) -> should be blocked with 403 Forbidden
    const opsClient = new TestClient();
    await opsClient.login('operasional', 'operasional123');
    const opsDeleteRes = await opsClient.request({
      path: '/admin/candidate/delete/9989',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-csrf-token': opsClient.csrfToken || ''
      }
    }, `_csrf=${opsClient.csrfToken || ''}`);

    const cand9989 = directDb.prepare('SELECT id FROM candidates WHERE id = 9989;').get();
    recordResult('Non-Superadmin (operasional) DELETE is blocked with HTTP 403 Forbidden',
      opsDeleteRes.statusCode === 403 && !!cand9989,
      `Status ${opsDeleteRes.statusCode}, Cand exists: ${!!cand9989}`);

    // 4.3 Test Superadmin with Missing/Invalid CSRF -> should be blocked with 403 Forbidden
    const adminClient = new TestClient();
    const adminLoginRes = await adminClient.login('admin', 'admin123');
    recordResult('Superadmin login succeeds', adminLoginRes.statusCode === 302, `Status ${adminLoginRes.statusCode}`);

    // Missing CSRF token
    const noCsrfRes = await adminClient.request({
      path: '/admin/candidate/delete/9990',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }, 'foo=bar');
    const cand9990_1 = directDb.prepare('SELECT id FROM candidates WHERE id = 9990;').get();
    recordResult('Superadmin DELETE with MISSING CSRF is blocked with HTTP 403',
      noCsrfRes.statusCode === 403 && !!cand9990_1,
      `Status ${noCsrfRes.statusCode}, Cand exists: ${!!cand9990_1}`);

    // Tampered/Invalid CSRF token
    const badCsrfRes = await adminClient.request({
      path: '/admin/candidate/delete/9990',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }, '_csrf=badtokenbadtokenbadtokenbadtokenbadtokenbadtokenbadtokenbadtoken');
    const cand9990_2 = directDb.prepare('SELECT id FROM candidates WHERE id = 9990;').get();
    recordResult('Superadmin DELETE with TAMPERED CSRF is blocked with HTTP 403',
      badCsrfRes.statusCode === 403 && !!cand9990_2,
      `Status ${badCsrfRes.statusCode}, Cand exists: ${!!cand9990_2}`);

    // CSRF bypass attempt via query string (?_csrf=TOKEN with empty body)
    const queryCsrfRes = await adminClient.request({
      path: `/admin/candidate/delete/9990?_csrf=${adminClient.csrfToken}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }, '');
    const cand9990_3 = directDb.prepare('SELECT id FROM candidates WHERE id = 9990;').get();
    recordResult('Superadmin DELETE via query string CSRF bypass is blocked with HTTP 403',
      queryCsrfRes.statusCode === 403 && !!cand9990_3,
      `Status ${queryCsrfRes.statusCode}, Cand exists: ${!!cand9990_3}`);

    // 4.4 Test Valid Deletion by Superadmin with valid CSRF & Session
    const validDeleteRes = await adminClient.request({
      path: '/admin/candidate/delete/9991',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }, `_csrf=${adminClient.csrfToken}`);

    const cand9991After = directDb.prepare('SELECT id FROM candidates WHERE id = 9991;').get();
    const reviews9991After = directDb.prepare('SELECT COUNT(*) as c FROM candidate_reviews WHERE candidate_id = 9991;').get();

    recordResult('Superadmin DELETE with valid CSRF redirects to /admin (HTTP 302)',
      validDeleteRes.statusCode === 302 && validDeleteRes.headers['location'] === '/admin',
      `Status ${validDeleteRes.statusCode}, Location: ${validDeleteRes.headers['location']}`);
    recordResult('Candidate record 9991 is deleted from database',
      !cand9991After,
      `Record in DB: ${JSON.stringify(cand9991After)}`);
    recordResult('Associated candidate_reviews are cascaded/purged from database',
      reviews9991After.c === 0,
      `Remaining reviews count: ${reviews9991After.c}`);

    // 4.5 Malformed parameters on candidate delete
    const nanRes = await adminClient.request({
      path: '/admin/candidate/delete/non-numeric-id',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }, `_csrf=${adminClient.csrfToken}`);
    recordResult('DELETE with malformed non-numeric ID returns HTTP 400 Bad Request',
      nanRes.statusCode === 400 && nanRes.bodyText.includes('Invalid candidate ID'),
      `Status ${nanRes.statusCode}, Body: ${nanRes.bodyText.slice(0, 50)}`);

    const nonExistentRes = await adminClient.request({
      path: '/admin/candidate/delete/88888888',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }, `_csrf=${adminClient.csrfToken}`);
    recordResult('DELETE with non-existent ID completes safely and redirects (HTTP 302)',
      nonExistentRes.statusCode === 302,
      `Status ${nonExistentRes.statusCode}`);

    // --- SECTION 5: Export Endpoints (PDF & Excel) ---
    console.log('\n[SECTION 5] Export Endpoints Verification');

    // Insert a full candidate for PDF & Excel export testing
    directDb.prepare('DELETE FROM candidates WHERE id = 7777;').run();
    directDb.prepare(`
      INSERT INTO candidates (
        id, nama_lengkap, nama_panggilan, email, no_hp, posisi_dilamar, 
        status_perkawinan, alamat_ktp, jenis_kelamin
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `).run(7777, 'Budi Santoso Challenger', 'Budi', 'budi@challenger.test', '081234567890', 'Barista', 'Belum Menikah', 'Jl. Merdeka No. 10', 'Laki-Laki');

    // 5.1 Unauthenticated export access check (should return 401 Unauthorized for /api/*)
    const unauthPdfRes = await (new TestClient()).request({ path: '/api/export/pdf/7777' });
    recordResult('Unauthenticated GET /api/export/pdf/:id is protected (HTTP 401 or 302)',
      unauthPdfRes.statusCode === 401 || unauthPdfRes.statusCode === 302,
      `Status: ${unauthPdfRes.statusCode}`);

    const unauthExcelRes = await (new TestClient()).request({ path: '/api/export/excel' });
    recordResult('Unauthenticated GET /api/export/excel is protected (HTTP 401 or 302)',
      unauthExcelRes.statusCode === 401 || unauthExcelRes.statusCode === 302,
      `Status: ${unauthExcelRes.statusCode}`);

    // 5.2 Authenticated Candidate Excel export
    const excelRes = await adminClient.request({ path: '/api/export/excel' });
    const isXlsx = excelRes.bodyBuffer.slice(0, 4).toString('hex') === '504b0304'; // PK\x03\x04
    recordResult('GET /api/export/excel returns HTTP 200 with valid XLSX magic bytes',
      excelRes.statusCode === 200 && isXlsx && excelRes.bodyBuffer.length > 1000,
      `Status ${excelRes.statusCode}, Size ${excelRes.bodyBuffer.length} bytes, Magic: ${excelRes.bodyBuffer.slice(0, 4).toString()}`);

    // 5.3 Authenticated Operasional Excel export
    const opsExcelRes = await opsClient.request({ path: '/api/operasional/export/excel' });
    const isOpsXlsx = opsExcelRes.bodyBuffer.slice(0, 4).toString('hex') === '504b0304';
    recordResult('GET /api/operasional/export/excel returns HTTP 200 with valid XLSX format',
      opsExcelRes.statusCode === 200 && isOpsXlsx,
      `Status ${opsExcelRes.statusCode}, Magic: ${opsExcelRes.bodyBuffer.slice(0, 4).toString()}`);

    // 5.4 Authenticated PO Excel export
    const poExcelRes = await opsClient.request({ path: '/api/operasional/po/export/excel' });
    const isPoXlsx = poExcelRes.bodyBuffer.slice(0, 4).toString('hex') === '504b0304';
    recordResult('GET /api/operasional/po/export/excel returns HTTP 200 with valid XLSX format',
      poExcelRes.statusCode === 200 && isPoXlsx,
      `Status ${poExcelRes.statusCode}, Magic: ${poExcelRes.bodyBuffer.slice(0, 4).toString()}`);

    // 5.5 Authenticated IT Excel export
    const itClient = new TestClient();
    await itClient.login('it', 'it123');
    const itExcelRes = await itClient.request({ path: '/api/it/export/excel' });
    const isItXlsx = itExcelRes.bodyBuffer.slice(0, 4).toString('hex') === '504b0304';
    recordResult('GET /api/it/export/excel returns HTTP 200 with valid XLSX format',
      itExcelRes.statusCode === 200 && isItXlsx,
      `Status ${itExcelRes.statusCode}, Magic: ${itExcelRes.bodyBuffer.slice(0, 4).toString()}`);

    // 5.6 Authenticated Candidate PDF generation (Puppeteer)
    console.log('  Testing Puppeteer Candidate PDF generation (may take 2-4 seconds)...');
    const pdfRes = await adminClient.request({ path: '/api/export/pdf/7777' });
    const isPdf = pdfRes.bodyBuffer.slice(0, 4).toString() === '%PDF';
    recordResult('GET /api/export/pdf/:id returns HTTP 200 with valid %PDF header',
      pdfRes.statusCode === 200 && isPdf && pdfRes.bodyBuffer.length > 10000,
      `Status ${pdfRes.statusCode}, Size ${pdfRes.bodyBuffer.length} bytes, Header: ${pdfRes.bodyBuffer.slice(0, 5).toString()}`);

    // --- SECTION 6: Adversarial Security Tests ---
    console.log('\n[SECTION 6] Adversarial Edge-Case Tests');

    // 6.1 Vulnerability Probe: Invoice download endpoint middleware order
    // In server.js, /api/it/invoices/download/:filename is defined at line 123, BEFORE session middleware at line 231!
    // As a result, even an authenticated IT user is redirected to /admin/login because req.session is undefined!
    const invoiceProbeRes = await itClient.request({ path: '/api/it/invoices/download/nonexistent.pdf' });
    const isMiddlewareBugPresent = (invoiceProbeRes.statusCode === 302 && invoiceProbeRes.headers['location'] === '/admin/login');
    recordResult('[VULNERABILITY PROBE] GET /api/it/invoices/download/:filename accessible by authenticated IT user',
      !isMiddlewareBugPresent,
      `Route mounted before session middleware in server.js (line 123 vs line 231) causes premature redirect (HTTP ${invoiceProbeRes.statusCode} to ${invoiceProbeRes.headers['location']})`);

    // 6.2 Public form submission without token on /api/submit
    const publicSubmitRes = await (new TestClient()).request({
      path: '/api/submit',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { nama_lengkap: 'Hacker Payload' });
    recordResult('Form submit on /api/submit without HR token is rejected with HTTP 403',
      publicSubmitRes.statusCode === 403,
      `Status ${publicSubmitRes.statusCode}`);

    // 6.3 Admin dashboard unauthenticated protection
    const adminPages = ['/admin', '/admin/users', '/admin/it', '/admin/operasional', '/reviewer'];
    let allProtected = true;
    for (const page of adminPages) {
      const pageRes = await (new TestClient()).request({ path: page });
      if (pageRes.statusCode !== 302 || pageRes.headers['location'] !== '/admin/login') {
        allProtected = false;
        break;
      }
    }
    recordResult('All admin/reviewer dashboards redirect unauthenticated users to /admin/login',
      allProtected,
      `Checked: ${adminPages.join(', ')}`);

    // Clean up test data
    directDb.prepare('DELETE FROM candidates WHERE id IN (7777, 9988, 9989, 9990, 9991);').run();

  } finally {
    directDb.close();
    console.log('\nStopping Express test server...');
    serverProcess.kill('SIGTERM');
  }

  // --- SUMMARY ---
  console.log('\n===============================================================');
  console.log(`TOTAL EMPIRICAL ASSERTIONS: ${passedTests + failedTests}`);
  console.log(`PASSED: ${passedTests}`);
  console.log(`FAILED: ${failedTests}`);
  console.log('===============================================================');

  if (failedTests > 0) {
    console.error(`\n❌ VERDICT: REQUEST_CHANGES (${failedTests} defect(s) detected)`);
    process.exit(1);
  } else {
    console.log('\n🎉 VERDICT: APPROVE (100% empirical assertions passed!)');
    process.exit(0);
  }
}

runAllEmpiricalTests().catch(err => {
  console.error('Empirical harness crashed:', err);
  process.exit(1);
});
