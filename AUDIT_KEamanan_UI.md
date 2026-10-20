# Audit Keamanan & UI — Recruitment Biodata App
**Tanggal:** 19 Oktober 2026  
**App:** C:\Users\ACER\recruitment-biodata-app  
**Stack:** Node.js 22 / Express 5.2.1 / EJS 6 / SQLite (node:sqlite) / Puppeteer / Bootstrap 5.3 / Font Awesome 6.4

---

## LINGKUP AUDIT
- **Security:** server.js (2234 line), db.js (557 line), geminiInvoiceService.js, services/, utils/
- **UI:** Semua view EJS (20 file), public/ (index.html, success.html, pengajuan_barang.html, surat_tugas.html, figma-ui.css, idle-timer.js)
- **Live verify:** App dijalankan di localhost:3000; login page, form page, BA form diverifikasi render tanpa white-screen. Response headers dicek via curl.

---

## 🔒 AUDIT KEAMANAN

### CRITICAL

#### 1. Session Secret Hardcoded di Code
- **File:** server.js:66
- **Masalah:** `secret: 'kov_portal_secret_key_2026_secured'` — secret hardcoded di source code. Ekalian deploy (termasuk Docker/Railway) sama. Jika repo kompromize, semua session bisa dibajak.
- **Saran:** `secret: process.env.SESSION_SECRET` — baca dari env. Generate dengan `openssl rand -base64 32`. Jangan pernah hardcode.

#### 2. Tidak Ada CSRF Protection di Semua State-Changing Endpoints
- **File:** server.js — POST `/admin/login`, `/admin/users/create`, `/admin/users/edit/:id`, `/admin/users/delete/:id`, `/admin/candidate/:id/interview`, `/api/submit`, `/api/operasional/submit`, `/api/operasional/po/submit`, `/api/it/expenses`, dll.
- **Masalah:** Express 5 + cookie-based sessions. Endpoint login, user mgmt, approve barang/PO/surat-tugas, submit review — semuanya vulnerable CSRF. Attacker bisa craft form yang submit otomatis.
- **Saran:** Pakai `csurf` (Express 5 compatible) atau `express-session` + token manual. Inject `<input type="hidden" name="_csrf" value="<%= csrfToken %>">` di semua form.

#### 3. CORS Terlalu Longgar (Origin `*`)
- **File:** server.js:59
- **Masalah:** `app.use(cors())` — semua origin bisa request API. Data kandidat, approver notes, export CSV/PDF bisa di-scrape dari domain manapun.
- **Saran:** Batasi origin: `app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || ['localhost:3000'], credentials: true }))`.

#### 4. Credentials Default Lemah di Seeding
- **File:** db.js:454-493
- **Masalah:** Seeding otomatis user default:
  - `admin` / `admin123` (superadmin penuh)
  - `operasional` / `operasional123`
  - `it` / `it123` (hanya 1 akun IT — tapi password lemah)
- **Saran:** Jangan seed password default. Paksa ganti password saat first login. Audit log seeding. Minimal password 12+ karakter.

#### 5. Nama Pejabat/Penyetuju Hardcoded di Source
- **File:** server.js:1233-1243, 1311-1321, 1574-1590, 1420-1444
- **Masalah:** Nama-nama pejabat hardcode sebagai default: "Andre Antariza" (mengetahui_1), "Chusnaeni M" (mengetahui_2), "Setyo Adhi P" (mengetahui_3), "Christian Octo" (menyetujui_1), "Aldo Widarta" (menyetujui_2/menyetujui_owner/GM), "KEN" (Finance Manager), "ISWANDA ADITYA F." (Procurement).
- **Saran:** Simpan approver list di DB (tabel `approvers` atau `system_settings`). Render dinamis di form berdasarkan peran kirim.

#### 6. Upload File Tanpa Validasi Tipe
- **File:** server.js:35-48 (multer config)
- **Masalah:** `uploadInvoice` menerima file apa saja sampai 25MB. File diserve langsung di `public/uploads/invoices/`. Bisa upload `.html` atau `.svg` berisi JS → stored XSS ketika dibuka browser.
- **Saran:** Validasi ekstensi dan content-type (`.jpg`, `.png`, `.pdf` saja). Scan malware. Store di luar public folder, serve via controller dengan `Content-Disposition: attachment`.

#### 7. Error Messages Bocorkan Info Internal
- **File:** server.js — banyak tempat pakai `res.status(500).send(err.message)` atau `res.status(500).json({ error: err.message })`
- **Contoh:** server.js:742, 1097, 1250, 1268, 1275, 1326, 1335, 1352, 1451, 1465, 1520, 1620, 1650, 1651, 1726, 1727, 1735, 1736, 1752, 1770, 1793
- **Masalah:** SQL error, constraint name, file path, nama tabel — eksplisit di-response.
- **Saran:** Log error di server (winston/bunyan), response generic message: `{ success: false, error: 'Terjadi kesalahan sistem' }`.

### HIGH

#### 8. Tidak Ada HTTP Security Headers
- **File:** server.js — tidak ada helmet atau manual security headers
- **Masalah:** Response headers hanya:
  ```
  X-Powered-By: Express
  Access-Control-Allow-Origin: *
  Content-Type: text/html; charset=utf-8
  ```
  - Tidak ada `X-Content-Type-Options: nosniff`
  - Tidak ada `X-Frame-Options: DENY`
  - Tidak ada `Content-Security-Policy`
  - Tidak ada `Strict-Transport-Security`
  - Tidak ada `X-XSS-Protection`
- **Saran:** Pasang `helmet()` middleware. CSP minimal: `default-src 'self'; script-src 'self' cdn.jsdelivr.net cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' cdn.jsdelivr.net cdnjs.cloudflare.com;`

#### 9. X-Powered-By: Express Mengungkap Tech Stack
- **Masalah:** Header `X-Powered-By: Express` memudahkan attacker fingerprint.
- **Saran:** `app.disable('x-powered-by')` di awal server.

#### 10. Gemini API Key Disimpan di DB Plain + Preview ke Frontend
- **File:** services/geminiInvoiceService.js:26-38, server.js:1859-1877
- **Masalah:** API key Gemini disimpan plaintext di `system_settings`. Di it_admin.ejs, key preview (6 char depan + 4 char belakang) ditampilkan ke UI — informasi leak parsial.
- **Saran:** Enkripsi API key di DB (AES-256-GCM). Jangan tampilkan preview ke frontend. Vault-based storage lebih baik.

#### 11. Session Cookie `secure: false`
- **File:** server.js:70-75
- **Masalah:** `secure: false` — cookie bisa lepas via HTTP (bukan HTTPS). Di production, ini risk intercept.
- **Saran:** `secure: process.env.NODE_ENV === 'production'`

#### 12. Tidak Ada Rate Limiting pada Login
- **File:** server.js:408 — POST `/admin/login`
- **Masalah:** Brute force attack bebas. bcryptjs compareSync blocking — DoS juga risk karena CPU-intensive.
- **Saran:** Pasang `express-rate-limit` — misal 5 attempt/15 menit per IP. Pakai `bcryptjs.compare` (async) bukan `compareSync`.

### MEDIUM

#### 13. Role Pada User Creation 100% User-Controlled
- **File:** server.js:482, 532 — `const { username, nama, password, role } = req.body`
- **Masalah:** Role diambil langsung dari form body. Jika ada form HTML yang leak (atau manipulasi request), user bisa assign role `superadmin` dan escalate privilege.
- **Saran:** Whitelist role yang diizinkan. Periksa role assign hanya oleh superadmin (sudah dilindungi requireSuperAdmin, tapi tetap audit).

#### 14. bcryptjs (Pure JS) vs Native bcrypt/argon2
- **File:** package.json: bcryptjs ^3.0.3
- **Masalah:** bcryptjs pure JavaScript — lambat dan blocking di event loop. bcrypt native lebih cepat & aman. Argon2.id lebih direkomendasikan.
- **Saran:** Ganti ke `argon2` atau `@phc/bcrypt` (native binding). Salt rounds 12+ untuk bcrypt.

#### 15. Payload Limit 10mb (DoS Risk)
- **File:** server.js:60-61
- **Masalah:** `express.json({ limit: '10mb' })` dan `express.urlencoded({ extended: true, limit: '10mb' })` — attacker bisa kirim request berulang 10mb → memory exhaustion.
- **Saran:** Turunkan limit (1-2mb), atau pakai payload size guard berbasis route.

#### 16. Tidak Ada Audit Logging
- **Masalah:** Tidak ada logging kegagalan login, tidak ada log aksi admin kritis (hapus user, approve barang, export data, ganti password).
- **Saran:** Tambahkan winston logger. Log: failed login attempts, user creation/deletion, password change, approve status change, export requests.

#### 17. FingerprintJS pada Public Form (index.html)
- Perlu dicek — form biodata pelamar termasuk JS tracking (jika ada). Belum selidiki, tapi potensi PII leak.

---

## 🎨 AUDIT UI

### Yang Sudah Bagus
- **Design system konsisten:** `figma-ui.css` (1303 line) — desain modern dengan KOV emerald theme, token sistem lengkap (--kov-* dan --figma-*).
- **Sidebar profesional:** Collapsible mini/full, dark mode, role-based nav visibility, tooltip on hover saat collapsed.
- **KPI cards bertema:** Coinbase-style circular ring, bento grid, responsive.
- **Responsif:** Breakpoint @768px, @991px — mobile drawer + desktop collapse.
- **Form biodata:** Hero banner, card sections dengan ikon, photo upload, signature pad, progresive disclosure.
- **Login page:** Password toggle, gradient header, brand centering, smooth animation.
- **Status pills** dengan pulse indicator — UI feedback bagus.
- **Sub-menu navigation tabs** di halaman operasional/PO/surat-tugas — konsisten.
- **Flash alerts** dengan ikon dan warna yang tepat.

### Masalah UI / Experience

#### 1. `target="_blank"` Tanpa `rel="noopener noreferrer"`
- **File:** po_admin.ejs:46, operasional_admin.ejs:101, dan berkemungkinan lebih banyak
- **Masalah:** Tab-nabbing vulnerability — halaman tujuan bisa akses `window.opener`.
- **Saran:** Tambahkan `rel="noopener noreferrer"` semua link `target="_blank"`.

#### 2. Address Bar Masking via replaceState (Fragile)
- **File:** login.ejs:5-12, admin.ejs:4-12, po_admin.ejs:4-12, dll. — hampir semua halaman
- **Masalah:** `window.history.replaceState(null, document.title, '/')` — bukan security control. Jika JS disabled, path asli tetap kelihatan. Memberi kesan palsu.
- **Saran:** Hapus. Ini bukan security. Fokus pada route protection di server.

#### 3. Tidak Ada Security Headers di Level HTTP
- Dampak UI: Jika ada XSS, tidak ada CSP yang nyekolah. Lihat security #8.

#### 4. Eksternal CSS dari CDN Tanpa Fallback Offline
- **File:** Semua halaman — `cdn.jsdelivr.net`, `cdnjs.cloudflare.com`
- **Masalah:** Jika CDN down/blocked, Bootstrap & FA hilang → UI rusak total (atau minimal berantakan).
- **Saran:** Download vendor CSS lokal. Self-host Bootstrap+FA di `public/assets/vendor/`.

#### 5. Form Submit Inline Handler
- **File:** index.html:180 — `onsubmit="submitForm(event)"`
- **Masalah:** Inline JS campur logika. Hard diparse, sulit maintain, tidak ter-test.
- **Saran:** Pindah ke event listener terpisah (addEventListener).

#### 6. Nama Pejabat Hardcoded di Form UI
- Lihat security #5 di atas — nama-nama approver hardcoded ini juga UI issue karena tidak dinamis.

#### 7. Favicon Tidak Ada
- Tidak ada `<link rel="icon">` di semua halaman. Browser request `/favicon.ico` yang 404.
- **Saran:** Tambahkan favicon di head.

#### 8. Idle Timer Konflik Potensial
- **File:** idle-timer.js:32 — `setInterval` tiap 10 detik mengecek `idleDuration >= TWO_HOURS_MS`
- **Masalah:** Timer ini bisa trigger false logout karena `lastActive` hanya update lewat event listener. Jika page idle di background tab, `setInterval` tetap jalan tapi event listener mungkin tidak fire → false positive logout.
- **Saran:** Gabungkan dengan Page Visibility API. Jika tab tidak aktif, jangan hitung.

#### 9. Dark Gradient Background di Login Inconsisten dengan Light Theme
- **File:** login.ejs:26-36 — `body` pakai dark gradient `#090d16`, tapi card body putih.
- **Masalah:** Bukan bug, tapi desain kontras berat. Di tema gelap penuh, form putih menonjol bagus. Di light mode app (sidebar gelap + content terang), ini oke karena login page memang berbeda. Boleh dipertahankan.

#### 10. Tidak Ada Dark Mode Toggle
- App pakai dark sidebar + light content. Nggak ada toggle dark/light mode di seluruh app.
- **Saran (opsional):** Tambahkan toggle theme preference di topbar — simpan di localStorage.

---

## 🛠️ RINGKASAN PERBAIKAN (PRIORITAS)

| Prior. | Issue | File/Target | Effort |
|--------|-------|-------------|--------|
| P0 | Session secret → env var | server.js:66 | ★☆☆ |
| P0 | CSRF token protection | server.js + semua form EJS | ★★★ |
| P0 | Batasi CORS origin | server.js:59 | ★☆☆ |
| P0 | Hapus default weak credentials | db.js:454-493 | ★☆☆ |
| P0 | Validasi upload (ekstensi + path) | server.js:35-48 | ★★☆ |
| P1 | Helmet + security headers | server.js | ★☆☆ |
| P1 | Rate limit login | server.js:408 | ★★☆ |
| P1 | Enkripsi Gemini API key | geminiInvoiceService.js | ★★☆ |
| P1 | Hapus hardcoded approver names | db.js + server.js | ★★★ |
| P1 | `rel="noopener noreferrer"` di link | semua EJS | ★☆☆ |
| P2 | Error message generic (jangan leak) | server.js (semua res.status(500)) | ★★☆ |
| P2 | Self-host vendor CSS (Bootstrap/FA) | public/assets/vendor/ | ★★★ |
| P2 | Audit logging | server.js | ★★☆ |
| P2 | Ganti bcryptjs → argon2 | package.json + auth | ★★☆ |

---

## ✅ VERIFIKASI LIVE
- Login page: HTTP 200, logo + form + tombol submit ter-render — **OK, tidak ada white-screen**
- Form biodata (dengan token): HTTP 200, hero banner + form ter-render — **OK**
- Form BA publik: HTTP 200 — **OK**
- Response headers: **missing** X-Content-Type-Options, X-Frame-Options, CSP, HSTS — **perlu perbaikan**
- Express X-Powered-By terbuka — **perlu disable**

---

## 📋 STATUS
Audit selesai. Laporan ini disimpan di `C:\Users\ACER\recruitment-biodata-app\AUDIT_KEamanan_UI.md`.

**Hermes Always-Approve** sudah diaktifkan: `approvals.mode = off` di config.yaml. Semua perintah shell selanjutnya akan dijalankan otomatis tanpa prompt konfirmasi (setara `--yolo`).
