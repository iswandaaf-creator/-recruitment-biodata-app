const express = require('express');

process.on('uncaughtException', (err) => {
  console.error('CRITICAL UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL UNHANDLED REJECTION:', reason);
});
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { generatePDF } = require('./utils/pdfGenerator');
const { generateExcel } = require('./utils/excelGenerator');
const { generateOperasionalPDF } = require('./utils/operasionalPdfGenerator');
const { generateOperasionalExcel } = require('./utils/operasionalExcelGenerator');
const { generatePOPDF } = require('./utils/poPdfGenerator');
const { generatePOExcel } = require('./utils/poExcelGenerator');
const { generateSuratTugasPDF } = require('./utils/suratTugasPdfGenerator');
const { generateSuratTugasExcel } = require('./utils/suratTugasExcelGenerator');
const { generateITExcel } = require('./utils/itExcelGenerator');
const { generateITPDF } = require('./utils/itPdfGenerator');
const { formatDate, formatDateTime } = require('./utils/dateFormatter');
const fs = require('fs');
const multer = require('multer');
const { scanInvoiceDocument } = require('./services/invoiceScannerService');

// Invoices upload folder setup
const invoiceUploadDir = path.join(__dirname, 'public', 'uploads', 'invoices');
if (!fs.existsSync(invoiceUploadDir)) {
  fs.mkdirSync(invoiceUploadDir, { recursive: true });
}

const invoiceStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, invoiceUploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'inv-' + unique + ext);
  }
});

const uploadInvoice = multer({
  storage: invoiceStorage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

const app = express();
const PORT = process.env.PORT || 3000;

app.locals.formatDate = formatDate;
app.locals.formatDateTime = formatDateTime;

app.set('trust proxy', 1);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 Jam (7,200,000 ms)

app.use(session({
  name: 'kov_portal_session_id',
  secret: 'kov_portal_secret_key_2026_secured',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset batas kedaluwarsa cookie pada setiap request baru (aktivitas aktif)
  cookie: { 
    maxAge: SESSION_TIMEOUT_MS,
    httpOnly: true,
    sameSite: 'lax',
    secure: false
  }
}));

// Auto-Logout Inactivity Guard: Logout otomatis jika tidak ada aktivitas selama 2 jam
app.use((req, res, next) => {
  if (req.session && req.session.user) {
    const now = Date.now();
    if (req.session.lastActivity && (now - req.session.lastActivity > SESSION_TIMEOUT_MS)) {
      return req.session.destroy(() => {
        res.clearCookie('kov_portal_session_id');
        res.clearCookie('connect.sid');
        if (req.path.startsWith('/api/')) {
          return res.status(401).json({
            success: false,
            error: 'Sesi Anda telah berakhir karena tidak ada aktivitas selama 2 jam. Silakan login kembali.'
          });
        }
        return res.redirect('/admin/login?expired=1');
      });
    }
    // Perbarui waktu aktivitas terakhir
    req.session.lastActivity = now;
  }
  next();
});

// Endpoint keep-alive untuk sinkronisasi aktivitas dari browser
app.get('/api/keep-alive', (req, res) => {
  if (req.session && req.session.user) {
    req.session.lastActivity = Date.now();
    return res.json({ success: true, timestamp: req.session.lastActivity });
  }
  return res.status(401).json({ success: false, error: 'Unauthorized' });
});


// Global Auth Guard: Rute publik untuk form pelamar ber-token, login, dan asset; rute internal wajib login
app.use((req, res, next) => {
  // 1. Izinkan file asset statis (logo, uploads, gambar, css, js, fonts)
  if (req.path.startsWith('/logo') || req.path.startsWith('/uploads/') || req.path.match(/\.(css|js|png|jpg|jpeg|svg|ico|woff|woff2|ttf|pdf)$/i)) {
    return next();
  }

  // 2. Izinkan rute halaman login & logout
  if (req.path === '/admin/login' || req.path === '/admin/logout') {
    return next();
  }

  // 3. Akses Formulir Pelamar Kerja: HANYA jika diberikan link oleh HRD (ada parameter ?ref= atau ?token=)
  if (req.path === '/' || req.path === '/index.html' || req.path === '/form-kandidat' || req.path === '/apply') {
    const token = req.query.ref || req.query.token || req.query.ref_code;
    if (token && token.trim().length > 0) {
      // Dibuka menggunakan link resmi dari HRD
      return res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }

    // Jika tanpa link dari HRD dan user sudah login sebagai staf, arahkan ke dashboard rolenya:
    if (req.session && req.session.user) {
      const role = (req.session.user.role || '').toLowerCase().trim();
      if (role === 'operasional' || role === 'admin_operasional') {
        return res.redirect('/admin/operasional');
      }
      if (role === 'it') {
        return res.redirect('/admin/it');
      }
      if (role === 'superadmin' || role === 'admin' || role === 'hr') {
        return res.redirect('/admin');
      }
      // Role tidak dikenali: bersihkan user agar tidak loop
      delete req.session.user;
    }

    // Jika tanpa link dari HRD dan belum login, tampilkan halaman login langsung (URL address bar tetap bersih di '/')
    return res.render('login', { error: null });
  }

  // 4. Pengiriman form biodata pelamar (/api/submit): izinkan jika membawa token dari HRD
  if (req.path === '/api/submit' && req.method === 'POST') {
    if (req.body && (req.body.share_token || req.body.ref || req.body.token)) {
      return next();
    }
    return res.status(403).json({ success: false, error: 'Akses ditolak: Formulir pendaftaran pelamar wajib melalui tautan resmi yang diberikan oleh HRD.' });
  }

  // 5. Halaman sukses pelamar
  if (req.path === '/success.html') {
    return res.sendFile(path.join(__dirname, 'public', 'success.html'));
  }

  // 6. Formulir Operasional Publik (BA Pengajuan Barang & Surat Tugas) untuk Karyawan/PIC outlet tanpa akun login
  if (
    req.path === '/pengajuan-barang' || 
    req.path === '/pengajuan_barang.html' || 
    req.path === '/surat-tugas' || 
    req.path === '/form-surat-tugas' || 
    req.path === '/surat_tugas.html'
  ) {
    return next();
  }

  // 7. API Submit & Download PDF Tunggal Formulir Publik Operasional (Pengajuan Barang & Surat Tugas)
  if (
    (req.path === '/api/operasional/submit' && req.method === 'POST') ||
    (req.path === '/api/operasional/surat-tugas/submit' && req.method === 'POST') ||
    req.path.startsWith('/api/operasional/export/pdf/') ||
    req.path.startsWith('/api/operasional/surat-tugas/export/pdf/')
  ) {
    return next();
  }

  // 8. Rute internal lainnya (Admin HR, BA Operasional Dashboard, PO, IT, User Management) WAJIB login
  if (!req.session || !req.session.user) {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ success: false, error: 'Akses ditolak: Anda wajib login terlebih dahulu untuk mengakses sistem ini.' });
    }
    return res.redirect('/admin/login');
  }

  next();
});

// Static files (dilindungi di bawah auth guard)
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Authentication Middleware Umum
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/admin/login');
}

// HR Authorization Middleware (Otomatis arahkan sesuai role akun)
function requireHRAuth(req, res, next) {
  if (req.session && req.session.user) {
    const role = (req.session.user.role || '').toLowerCase().trim();
    if (role === 'superadmin' || role === 'admin' || role === 'hr') {
      return next();
    }
    if (role === 'operasional' || role === 'admin_operasional') {
      return res.redirect('/admin/operasional');
    }
    if (role === 'it') {
      return res.redirect('/admin/it');
    }
    // Unknown role: hapus agar tidak redirect loop
    delete req.session.user;
  }
  res.redirect('/admin/login');
}

// Operasional Authorization Middleware (Otomatis arahkan sesuai role akun)
function requireOperasionalAuth(req, res, next) {
  if (req.session && req.session.user) {
    const role = (req.session.user.role || '').toLowerCase().trim();
    if (role === 'superadmin' || role === 'admin' || role === 'operasional' || role === 'admin_operasional') {
      return next();
    }
    if (role === 'it') {
      return res.redirect('/admin/it');
    }
    if (role === 'hr') {
      return res.redirect('/admin');
    }
    delete req.session.user;
  }
  res.redirect('/admin/login');
}

// IT Authorization Middleware (Otomatis arahkan sesuai role akun)
function requireITAuth(req, res, next) {
  if (req.session && req.session.user) {
    const role = (req.session.user.role || '').toLowerCase().trim();
    if (role === 'superadmin' || role === 'admin' || role === 'it') {
      return next();
    }
    if (role === 'operasional' || role === 'admin_operasional') {
      return res.redirect('/admin/operasional');
    }
    if (role === 'hr') {
      return res.redirect('/admin');
    }
    delete req.session.user;
  }
  res.redirect('/admin/login');
}

// Super Admin & Admin Authorization Middleware
function requireSuperAdmin(req, res, next) {
  if (req.session && req.session.user) {
    const role = (req.session.user.role || '').toLowerCase().trim();
    if (role === 'superadmin' || role === 'admin') {
      return next();
    }
  }
  res.status(403).send('<h3>Forbidden 403: Akses ditolak. Hanya Super Admin yang dapat mengakses kelola user.</h3><a href="/admin">Kembali ke Dashboard</a>');
}

// Root Page
app.get('/', (req, res) => {
  const token = req.query.ref || req.query.token || req.query.ref_code;
  if (token && token.trim().length > 0) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  if (req.session && req.session.user) {
    const role = (req.session.user.role || '').toLowerCase().trim();
    if (role === 'operasional' || role === 'admin_operasional') {
      return res.redirect('/admin/operasional');
    }
    if (role === 'it') {
      return res.redirect('/admin/it');
    }
    if (role === 'superadmin' || role === 'admin' || role === 'hr') {
      return res.redirect('/admin');
    }
    delete req.session.user;
  }
  const errorMsg = req.query.expired ? 'Sesi login Anda telah berakhir karena tidak ada aktivitas selama 2 jam. Silakan login kembali.' : null;
  return res.render('login', { error: errorMsg });
});

// HR Candidate Form (Requires Login)
app.get('/form-kandidat', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// BA Pengajuan Barang Form (Publik untuk PIC Outlet & Karyawan)
app.get('/pengajuan-barang', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pengajuan_barang.html'));
});
app.get('/admin/operasional/create', requireOperasionalAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pengajuan_barang.html'));
});

// Surat Tugas & LPJ Form (Publik untuk Karyawan Dinas Luar Kota)
app.get('/surat-tugas', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'surat_tugas.html'));
});
app.get('/form-surat-tugas', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'surat_tugas.html'));
});

// Admin Login Page
app.get('/admin/login', (req, res) => {
  if (req.session && req.session.user) {
    const role = (req.session.user.role || '').toLowerCase().trim();
    if (role === 'operasional' || role === 'admin_operasional') {
      return res.redirect('/admin/operasional');
    }
    if (role === 'it') {
      return res.redirect('/admin/it');
    }
    if (role === 'superadmin' || role === 'admin' || role === 'hr') {
      return res.redirect('/admin');
    }
    // Jika ada session dengan role rusak/tidak valid, bersihkan agar bisa render form login
    delete req.session.user;
  }
  const errorMsg = req.query.expired ? 'Sesi login Anda telah berakhir karena tidak ada aktivitas selama 2 jam. Silakan login kembali.' : null;
  res.render('login', { error: errorMsg });
});

// Admin Login Process
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.render('login', { error: 'Username dan password wajib diisi!' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error(err);
      return res.render('login', { error: 'Terjadi kesalahan sistem.' });
    }
    if (!user) {
      return res.render('login', { error: 'Username atau password tidak ditemukan!' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.render('login', { error: 'Username atau password salah!' });
    }

    const cleanRole = (user.role || '').toLowerCase().trim();

    req.session.user = {
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: cleanRole
    };
    req.session.lastActivity = Date.now();

    delete req.session.returnTo;

    req.session.save((saveErr) => {
      if (saveErr) console.error('Session save error:', saveErr);

      if (cleanRole === 'operasional' || cleanRole === 'admin_operasional') {
        return res.redirect('/admin/operasional');
      }
      if (cleanRole === 'it') {
        return res.redirect('/admin/it');
      }
      return res.redirect('/admin');
    });
  });
});

// Admin Logout
app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('kov_portal_session_id');
    res.clearCookie('connect.sid');
    res.redirect('/admin/login');
  });
});

// User Management: List Users (Super Admin Only)
app.get('/admin/users', requireAuth, requireSuperAdmin, (req, res) => {
  db.all('SELECT id, username, nama, role, created_at FROM users ORDER BY id ASC', [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.render('users', {
      users: rows,
      user: req.session.user,
      success: req.query.success || null,
      error: req.query.error || null
    });
  });
});

// User Management: Create User (Super Admin Only)
app.post('/admin/users/create', requireAuth, requireSuperAdmin, (req, res) => {
  const { username, nama, password, role } = req.body;

  if (!username || !password || !nama || !role) {
    return res.redirect('/admin/users?error=Semua+field+wajib+diisi!');
  }

  // Khusus role 'it': Hanya boleh ada tepat 1 akun di seluruh sistem
  if (role === 'it') {
    db.get("SELECT id, username FROM users WHERE role = 'it'", [], (err, itUser) => {
      if (err) return res.redirect('/admin/users?error=' + encodeURIComponent(err.message));
      if (itUser) {
        return res.redirect('/admin/users?error=' + encodeURIComponent(`Gagal: Hanya diperbolehkan tepat 1 akun khusus IT di sistem! (Akun IT saat ini: @${itUser.username})`));
      }
      insertUser();
    });
  } else {
    insertUser();
  }

  function insertUser() {
    // Check if username already exists
    db.get('SELECT id FROM users WHERE username = ?', [username], (err, existing) => {
      if (err) return res.redirect('/admin/users?error=' + encodeURIComponent(err.message));
      if (existing) {
        return res.redirect('/admin/users?error=' + encodeURIComponent(`Username @${username} sudah digunakan!`));
      }

      const hash = bcrypt.hashSync(password, 10);
      db.run(
        'INSERT INTO users (username, password, nama, role) VALUES (?, ?, ?, ?)',
        [username, hash, nama, role],
        (err) => {
          if (err) return res.redirect('/admin/users?error=' + encodeURIComponent(err.message));
          res.redirect('/admin/users?success=' + encodeURIComponent(`User @${username} (${role}) berhasil dibuat!`));
        }
      );
    });
  }
});

// User Management: Delete User (Super Admin Only)
app.post('/admin/users/delete/:id', requireAuth, requireSuperAdmin, (req, res) => {
  const targetId = parseInt(req.params.id, 10);

  if (targetId === req.session.user.id) {
    return res.redirect('/admin/users?error=Anda+tidak+dapat+menghapus+akun+Anda+sendiri!');
  }

  db.run('DELETE FROM users WHERE id = ?', [targetId], (err) => {
    if (err) return res.redirect('/admin/users?error=' + encodeURIComponent(err.message));
    res.redirect('/admin/users?success=User+berhasil+dihapus!');
  });
});

// API: Submit Candidate Biodata (Public)
app.post('/api/submit', (req, res) => {
  const body = req.body;

  // Process Family Kandung
  const keluarga_kandung = {};
  ['Ayah', 'Ibu', 'Anak 1', 'Anak 2', 'Anak 3', 'Anak 4', 'Anak 5', 'Anak 6'].forEach(role => {
    if (body[`kk_${role}_nama`]) {
      keluarga_kandung[role] = {
        nama: body[`kk_${role}_nama`],
        lp: body[`kk_${role}_lp`],
        ttl: body[`kk_${role}_ttl`],
        pendidikan: body[`kk_${role}_pendidikan`],
        pekerjaan: body[`kk_${role}_pekerjaan`]
      };
    }
  });

  // Process Family Menikah
  const keluarga_menikah = {};
  ['Istri/Suami', 'Anak 1', 'Anak 2', 'Anak 3', 'Anak 4'].forEach(role => {
    if (body[`km_${role}_nama`]) {
      keluarga_menikah[role] = {
        nama: body[`km_${role}_nama`],
        lp: body[`km_${role}_lp`],
        ttl: body[`km_${role}_ttl`],
        pendidikan: body[`km_${role}_pendidikan`],
        pekerjaan: body[`km_${role}_pekerjaan`]
      };
    }
  });

  // Process Pendidikan Formal
  const pendidikan_formal = {};
  ['SD', 'SMP', 'SMU', 'Akademi', 'Sarjana S-1', 'PascaSarjana', 'Doktoral'].forEach(tingkat => {
    if (body[`pf_${tingkat}_sekolah`]) {
      pendidikan_formal[tingkat] = {
        sekolah: body[`pf_${tingkat}_sekolah`],
        kota: body[`pf_${tingkat}_kota`],
        jurusan: body[`pf_${tingkat}_jurusan`],
        tahun: body[`pf_${tingkat}_tahun`]
      };
    }
  });

  // Process Pendidikan Non Formal
  const pendidikan_non_formal = [];
  for (let i = 1; i <= 20; i++) {
    if (body[`pnf_${i}_topik`]) {
      pendidikan_non_formal.push({
        topik: body[`pnf_${i}_topik`],
        tahun: body[`pnf_${i}_tahun`],
        lama: body[`pnf_${i}_lama`],
        ijazah: body[`pnf_${i}_ijazah`],
        dibiayai: body[`pnf_${i}_dibiayai`]
      });
    }
  }

  // Process Referensi
  const referensi = [];
  for (let i = 1; i <= 3; i++) {
    if (body[`ref_${i}_nama`]) {
      referensi.push({
        nama: body[`ref_${i}_nama`],
        perusahaan: body[`ref_${i}_perusahaan`],
        telp: body[`ref_${i}_telp`],
        posisi: body[`ref_${i}_posisi`]
      });
    }
  }

  // Process Riwayat Pekerjaan
  const riwayat_pekerjaan = [];
  for (let i = 1; i <= 5; i++) {
    if (body[`rp_${i}_nama_perusahaan`]) {
      riwayat_pekerjaan.push({
        nama_perusahaan: body[`rp_${i}_nama_perusahaan`],
        alamat_perusahaan: body[`rp_${i}_alamat_perusahaan`],
        jabatan: body[`rp_${i}_jabatan`],
        periode: body[`rp_${i}_periode`],
        gaji: body[`rp_${i}_gaji`],
        atasan_telp: body[`rp_${i}_atasan_telp`],
        tugas: body[`rp_${i}_tugas`],
        prestasi: body[`rp_${i}_prestasi`],
        alasan_resign: body[`rp_${i}_alasan_resign`]
      });
    }
  }

  // Process Social Media
  const social_media = {
    instagram: body.sm_instagram || '',
    linkedin: body.sm_linkedin || '',
    twitter: body.sm_twitter || '',
    facebook: body.sm_facebook || ''
  };

  const sql = `
    INSERT INTO candidates (
      posisi_dilamar, posisi_lain, sumber_info, punya_kerabat, nama_kerabat_posisi,
      nama_lengkap, nama_panggilan, email, jenis_kelamin, kewarganegaraan, suku,
      tempat_lahir, tanggal_lahir, agama, golongan_darah, nomor_ktp, alamat_ktp,
      kota_ktp, kode_pos_ktp, alamat_domisili, kota_domisili, kode_pos_domisili,
      status_alamat_domisili, no_telp_rumah, no_hp, status_perkawinan, hobby,
      keluarga_kandung, keluarga_menikah, pendidikan_formal, pendidikan_non_formal,
      referensi, riwayat_pekerjaan, alasan_rekrutmen, minat_passion, rencana_3_5_tahun,
      prestasi, melamar_perusahaan_lain, social_media, riwayat_kesehatan,
      perkiraan_bergabung, gaji_diharapkan, kota_ttd, tanggal_ttd, signature_data, share_token,
      nomor_kk, gaji_pokok, produktivitas, tgl_join, tgl_resign, no_rekening, foto_kandidat
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    body.posisi_dilamar || '', body.posisi_lain || '', body.sumber_info || '', body.punya_kerabat || '', body.nama_kerabat_posisi || '',
    body.nama_lengkap || '', body.nama_panggilan || '', body.email || '', body.jenis_kelamin || '', body.kewarganegaraan || '', body.suku || '',
    body.tempat_lahir || '', body.tanggal_lahir || '', body.agama || '', body.golongan_darah || '', body.nomor_ktp || '', body.alamat_ktp || '',
    body.kota_ktp || '', body.kode_pos_ktp || '', body.alamat_domisili || '', body.kota_domisili || '', body.kode_pos_domisili || '',
    body.status_alamat_domisili || '', body.no_telp_rumah || '', body.no_hp || '', body.status_perkawinan || '', body.hobby || '',
    JSON.stringify(keluarga_kandung), JSON.stringify(keluarga_menikah), JSON.stringify(pendidikan_formal),
    JSON.stringify(pendidikan_non_formal), JSON.stringify(referensi), JSON.stringify(riwayat_pekerjaan),
    body.alasan_rekrutmen || '', body.minat_passion || '', body.rencana_3_5_tahun || '', body.prestasi || '',
    body.melamar_perusahaan_lain || '', JSON.stringify(social_media), body.riwayat_kesehatan || '',
    body.perkiraan_bergabung || '', body.gaji_diharapkan || '', body.kota_ttd || '', body.tanggal_ttd || '', body.signature_data || '',
    body.share_token || body.ref || body.token || '',
    body.nomor_kk || '', body.gaji_pokok || '', body.produktivitas || '', body.tgl_join || '', body.tgl_resign || '', body.no_rekening || '',
    body.foto_kandidat || ''
  ];

  db.run(sql, params, function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: err.message });
    }
    const insertedId = this.lastID;
    db.get(
      'SELECT id FROM candidates WHERE id != ? AND ((nomor_ktp IS NOT NULL AND nomor_ktp != "" AND nomor_ktp = ?) OR (email IS NOT NULL AND email != "" AND email = ?) OR (no_hp IS NOT NULL AND no_hp != "" AND no_hp = ?)) LIMIT 1',
      [insertedId, body.nomor_ktp || '', body.email || '', body.no_hp || ''],
      (err, existing) => {
        const isDuplicate = !!existing;
        res.json({
          success: true,
          id: insertedId,
          is_duplicate: isDuplicate,
          message: isDuplicate ? 'Formulir terkirim! (Sistem mencatat Anda pernah mendaftar sebelumnya).' : 'Formulir berhasil terkirim.'
        });
      }
    );
  });
});

// Admin Dashboard (Protected - HR & Superadmin only)
app.get('/admin', requireHRAuth, (req, res) => {
  db.all('SELECT * FROM candidates ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).send(err.message);

    const ktpMap = {}, emailMap = {}, hpMap = {}, namaMap = {};
    rows.forEach(r => {
      if (r.nomor_ktp && r.nomor_ktp.trim()) {
        const k = r.nomor_ktp.trim().toLowerCase();
        ktpMap[k] = (ktpMap[k] || 0) + 1;
      }
      if (r.email && r.email.trim()) {
        const e = r.email.trim().toLowerCase();
        emailMap[e] = (emailMap[e] || 0) + 1;
      }
      if (r.no_hp && r.no_hp.trim()) {
        const h = r.no_hp.trim().replace(/\D/g, '');
        if (h.length > 5) hpMap[h] = (hpMap[h] || 0) + 1;
      }
      if (r.nama_lengkap && r.nama_lengkap.trim()) {
        const n = r.nama_lengkap.trim().toLowerCase();
        namaMap[n] = (namaMap[n] || 0) + 1;
      }
    });

    const candidates = rows.map(r => {
      const k = r.nomor_ktp ? r.nomor_ktp.trim().toLowerCase() : '';
      const e = r.email ? r.email.trim().toLowerCase() : '';
      const h = r.no_hp ? r.no_hp.trim().replace(/\D/g, '') : '';
      const n = r.nama_lengkap ? r.nama_lengkap.trim().toLowerCase() : '';

      let dupCount = 1;
      let reasons = [];

      if (k && ktpMap[k] > 1) {
        dupCount = Math.max(dupCount, ktpMap[k]);
        reasons.push('KTP');
      }
      if (e && emailMap[e] > 1) {
        dupCount = Math.max(dupCount, emailMap[e]);
        reasons.push('Email');
      }
      if (h && hpMap[h] > 1) {
        dupCount = Math.max(dupCount, hpMap[h]);
        reasons.push('No HP');
      }
      if (n && namaMap[n] > 1 && reasons.length === 0) {
        dupCount = Math.max(dupCount, namaMap[n]);
        reasons.push('Nama');
      }

      return {
        ...r,
        duplicate_count: dupCount,
        is_duplicate: dupCount > 1,
        match_reason: reasons.join(', ')
      };
    });

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    res.render('admin', { candidates, user: req.session.user, baseUrl });
  });
});

// Candidate Detail & Interview Notes Page (Protected - HR & Superadmin only)
app.get('/admin/candidate/:id', requireHRAuth, (req, res) => {
  db.get('SELECT * FROM candidates WHERE id = ?', [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).send('Candidate not found');

    const k = row.nomor_ktp ? row.nomor_ktp.trim() : '';
    const e = row.email ? row.email.trim().toLowerCase() : '';
    const h = row.no_hp ? row.no_hp.trim().replace(/\D/g, '') : '';
    const n = row.nama_lengkap ? row.nama_lengkap.trim().toLowerCase() : '';

    db.all('SELECT id, created_at, nama_lengkap, email, no_hp, nomor_ktp, kesimpulan_status FROM candidates ORDER BY id DESC', [], (err, allRows) => {
      const duplicates = (allRows || []).filter(item => {
        const itemK = item.nomor_ktp ? item.nomor_ktp.trim() : '';
        const itemE = item.email ? item.email.trim().toLowerCase() : '';
        const itemH = item.no_hp ? item.no_hp.trim().replace(/\D/g, '') : '';
        const itemN = item.nama_lengkap ? item.nama_lengkap.trim().toLowerCase() : '';

        const matchK = k && itemK && k === itemK;
        const matchE = e && itemE && e === itemE;
        const matchH = h && itemH && h === itemH;
        const matchN = n && itemN && n === itemN;

        return matchK || matchE || matchH || matchN;
      });

      const cw1 = typeof row.catatan_wawancara_1 === 'string' ? JSON.parse(row.catatan_wawancara_1 || '{}') : (row.catatan_wawancara_1 || {});
      const cw2 = typeof row.catatan_wawancara_2 === 'string' ? JSON.parse(row.catatan_wawancara_2 || '{}') : (row.catatan_wawancara_2 || {});
      const cw3 = typeof row.catatan_wawancara_3 === 'string' ? JSON.parse(row.catatan_wawancara_3 || '{}') : (row.catatan_wawancara_3 || {});

      res.render('candidate_detail', {
        candidate: row,
        cw1, cw2, cw3,
        user: req.session.user,
        duplicates: duplicates,
        is_duplicate: duplicates.length > 1
      });
    });
  });
});

// Save Interview Notes (Page 5) (Protected - HR & Superadmin only)
app.post('/admin/candidate/:id/interview', requireHRAuth, (req, res) => {
  const body = req.body;
  const cw1 = JSON.stringify({ catatan: body.cw1_catatan, nama: body.cw1_nama, jabatan: body.cw1_jabatan, tanggal: body.cw1_tanggal });
  const cw2 = JSON.stringify({ catatan: body.cw2_catatan, nama: body.cw2_nama, jabatan: body.cw2_jabatan, tanggal: body.cw2_tanggal });
  const cw3 = JSON.stringify({ catatan: body.cw3_catatan, nama: body.cw3_nama, jabatan: body.cw3_jabatan, tanggal: body.cw3_tanggal });

  const sql = `
    UPDATE candidates SET
      catatan_wawancara_1 = ?,
      catatan_wawancara_2 = ?,
      catatan_wawancara_3 = ?,
      kesimpulan_status = ?,
      kesimpulan_catatan = ?,
      nomor_kk = ?,
      gaji_pokok = ?,
      produktivitas = ?,
      tgl_join = ?,
      tgl_resign = ?,
      no_rekening = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const params = [
    cw1, cw2, cw3,
    body.kesimpulan_status || '',
    body.kesimpulan_catatan || '',
    body.nomor_kk || '',
    body.gaji_pokok || '',
    body.produktivitas || '',
    body.tgl_join || '',
    body.tgl_resign || '',
    body.no_rekening || '',
    req.params.id
  ];

  db.run(sql, params, (err) => {
    if (err) return res.status(500).send(err.message);
    res.redirect(`/admin/candidate/${req.params.id}`);
  });
});

// Export PDF (Single Candidate) (Protected)
app.get('/api/export/pdf/:id', requireAuth, (req, res) => {
  db.get('SELECT * FROM candidates WHERE id = ?', [req.params.id], async (err, row) => {
    if (err || !row) return res.status(404).send('Candidate not found');

    try {
      const pdfBuffer = await generatePDF(row);
      const filename = `Biodata_${(row.nama_lengkap || 'Candidate').replace(/[^a-zA-Z0-9]/g, '_')}_#${row.id}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (pdfErr) {
      console.error('PDF Generation Error:', pdfErr);
      res.status(500).send('Error generating PDF: ' + pdfErr.message);
    }
  });
});

// Export Excel (All Candidates) (Protected)
app.get('/api/export/excel', requireAuth, (req, res) => {
  db.all('SELECT * FROM candidates ORDER BY id DESC', [], async (err, rows) => {
    if (err) return res.status(500).send(err.message);

    try {
      const buffer = await generateExcel(rows);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Record_Biodata_Pelamar.xlsx"');
      res.send(buffer);
    } catch (excelErr) {
      console.error('Excel Generation Error:', excelErr);
      res.status(500).send('Error generating Excel: ' + excelErr.message);
    }
  });
});

// =========================================================================
// DIVISI OPERASIONAL: BERITA ACARA PENGAJUAN BARANG ROUTES
// =========================================================================

// Public API: Submit BA Pengajuan Barang
app.post('/api/operasional/submit', (req, res) => {
  const body = req.body;
  
  // Generate No BA automatically: BA/OPS/YYYYMM/XXXX
  const dateObj = new Date();
  const yyyymm = dateObj.getFullYear().toString() + String(dateObj.getMonth() + 1).padStart(2, '0');
  const randomCode = Math.floor(1000 + Math.random() * 9000);
  const generatedNoBa = body.no_ba || `BA/OPS/${yyyymm}/${randomCode}`;

  const jumlah = parseInt(body.jumlah || 1, 10);
  const hargaSatuan = parseFloat(body.harga_satuan_estimasi || 0);
  const totalEstimasi = parseFloat(body.total_estimasi || (jumlah * hargaSatuan));

  let itemsJsonStr = '';
  if (typeof body.items_json === 'string' && body.items_json) {
    itemsJsonStr = body.items_json;
  } else if (body.items_json || body.items) {
    itemsJsonStr = JSON.stringify(body.items_json || body.items);
  }

  let fotoListStr = '';
  if (typeof body.foto_list === 'string' && body.foto_list) {
    fotoListStr = body.foto_list;
  } else if (body.foto_list) {
    fotoListStr = JSON.stringify(body.foto_list);
  }

  const sql = `
    INSERT INTO pengajuan_barang (
      no_ba, tanggal_pengajuan, outlet_divisi, departemen, pic_pengajuan, prioritas, barang_dibutuhkan_paling_lambat,
      nama_barang, status_barang, kategori_barang, merk_tipe_model, spesifikasi, lokasi_penempatan, pic_pengguna,
      jumlah, satuan, harga_satuan_estimasi, total_estimasi, link_quotation,
      tujuan_kebutuhan, alasan_pengajuan, dampak_operasional, alternatif_dipertimbangkan,
      kronologi_kerusakan, tgl_kerusakan, jam_kerusakan, diketahui_oleh, kondisi_barang_saat_ini, dampak_kerusakan, tindakan_awal, analisa_penyebab, keterangan_kerusakan,
      riwayat_repair_status, riwayat_repair_kali, estimasi_biaya_repair, estimasi_biaya_replacement, kondisi_umur_barang, rekomendasi, alasan_rekomendasi,
      vendor_pembelian, pic_vendor, no_quotation, sumber_budget, ketersediaan_budget, estimasi_waktu_pengadaan,
      treatment, vendor_service, estimasi_harga_service, target_penyelesaian, keterangan_tindak_lanjut,
      lampiran_foto, lampiran_quotation, lampiran_spesifikasi, lampiran_dokumen_lain, link_dokumen_pendukung, catatan_dokumentasi,
      foto_list, items_json,
      dibuat_oleh, signature_dibuat,
      mengetahui_1, status_mengetahui_1,
      mengetahui_2, status_mengetahui_2,
      mengetahui_3, status_mengetahui_3,
      menyetujui_owner, status_menyetujui_owner,
      menyetujui_1, menyetujui_2, status_approval, share_token
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    generatedNoBa,
    body.tanggal_pengajuan || new Date().toISOString().split('T')[0],
    body.outlet_divisi || '',
    body.departemen || '',
    body.pic_pengajuan || '',
    body.prioritas || 'Normal',
    body.barang_dibutuhkan_paling_lambat || '',
    body.nama_barang || '',
    body.status_barang || 'Barang Baru',
    body.kategori_barang || '',
    body.merk_tipe_model || '',
    body.spesifikasi || '',
    body.lokasi_penempatan || '',
    body.pic_pengguna || '',
    jumlah,
    body.satuan || 'Pcs',
    hargaSatuan,
    totalEstimasi,
    body.link_quotation || '',
    body.tujuan_kebutuhan || '',
    body.alasan_pengajuan || '',
    body.dampak_operasional || '',
    body.alternatif_dipertimbangkan || '',
    body.kronologi_kerusakan || '',
    body.tgl_kerusakan || '',
    body.jam_kerusakan || '',
    body.diketahui_oleh || '',
    body.kondisi_barang_saat_ini || '',
    body.dampak_kerusakan || '',
    body.tindakan_awal || '',
    body.analisa_penyebab || 'Normal Wear & Tear',
    body.keterangan_kerusakan || '',
    body.riwayat_repair_status || 'Tidak Pernah',
    body.riwayat_repair_kali || '0',
    parseFloat(body.estimasi_biaya_repair || 0),
    parseFloat(body.estimasi_biaya_replacement || 0),
    body.kondisi_umur_barang || '',
    body.rekomendasi || 'Repair',
    body.alasan_rekomendasi || '',
    body.vendor_pembelian || '',
    body.pic_vendor || '',
    body.no_quotation || '',
    body.sumber_budget || '',
    body.ketersediaan_budget || 'Tersedia',
    body.estimasi_waktu_pengadaan || '',
    body.treatment || 'Menunggu Approval',
    body.vendor_service || '',
    parseFloat(body.estimasi_harga_service || 0),
    body.target_penyelesaian || '',
    body.keterangan_tindak_lanjut || '',
    (body.lampiran_foto || fotoListStr) ? 1 : 0,
    body.lampiran_quotation ? 1 : 0,
    body.lampiran_spesifikasi ? 1 : 0,
    body.lampiran_dokumen_lain ? 1 : 0,
    body.link_dokumen_pendukung || '',
    body.catatan_dokumentasi || '',
    fotoListStr,
    itemsJsonStr,
    body.pic_pengajuan || '',
    body.signature_dibuat || '',
    body.mengetahui_1 || 'Andre Antariza',
    body.status_mengetahui_1 || 'Pending',
    body.mengetahui_2 || 'Chusnaeni M',
    body.status_mengetahui_2 || 'Pending',
    body.mengetahui_3 || 'Setyo Adhi P',
    body.status_mengetahui_3 || 'Pending',
    body.menyetujui_owner || 'Owner',
    body.status_menyetujui_owner || 'Pending',
    'Christian Octo',
    'Aldo Widarta',
    body.status_approval || 'Menunggu Approval',
    body.share_token || body.ref || ''
  ];

  db.run(sql, params, function (err) {
    if (err) {
      console.error('Error inserting pengajuan_barang:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({
      success: true,
      id: this.lastID,
      no_ba: generatedNoBa,
      message: 'Berita Acara Pengajuan Barang berhasil terkirim.'
    });
  });
});

// Admin Operasional Dashboard (Protected)
app.get('/admin/operasional', requireOperasionalAuth, (req, res) => {
  db.all('SELECT * FROM pengajuan_barang ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    res.render('operasional_admin', { records: rows || [], user: req.session.user, baseUrl });
  });
});

// Admin Operasional Detail View (Protected)
app.get('/admin/operasional/detail/:id', requireOperasionalAuth, (req, res) => {
  db.get('SELECT * FROM pengajuan_barang WHERE id = ?', [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).send('Berita Acara tidak ditemukan.');
    res.render('operasional_detail', { item: row, user: req.session.user });
  });
});

// Admin Operasional Update Status & Treatment (Protected)
app.post('/admin/operasional/update/:id', requireOperasionalAuth, (req, res) => {
  const body = req.body;
  const sql = `
    UPDATE pengajuan_barang SET
      status_approval = ?,
      treatment = ?,
      vendor_service = ?,
      estimasi_harga_service = ?,
      target_penyelesaian = ?,
      mengetahui_1 = ?,
      status_mengetahui_1 = ?,
      mengetahui_2 = ?,
      status_mengetahui_2 = ?,
      mengetahui_3 = ?,
      status_mengetahui_3 = ?,
      menyetujui_owner = ?,
      status_menyetujui_owner = ?,
      menyetujui_1 = ?,
      menyetujui_2 = ?,
      catatan_approval = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const params = [
    body.status_approval || 'Menunggu Approval',
    body.treatment || 'Menunggu Approval',
    body.vendor_service || '',
    parseFloat(body.estimasi_harga_service || 0),
    body.target_penyelesaian || '',
    body.mengetahui_1 || 'Andre Antariza',
    body.status_mengetahui_1 || 'Pending',
    body.mengetahui_2 || 'Chusnaeni M',
    body.status_mengetahui_2 || 'Pending',
    body.mengetahui_3 || 'Setyo Adhi P',
    body.status_mengetahui_3 || 'Pending',
    body.menyetujui_owner || 'Owner',
    body.status_menyetujui_owner || 'Pending',
    body.menyetujui_1 || 'Christian Octo',
    body.menyetujui_2 || 'Aldo Widarta',
    body.catatan_approval || '',
    req.params.id
  ];

  db.run(sql, params, (err) => {
    if (err) return res.status(500).send(err.message);
    res.redirect(`/admin/operasional/detail/${req.params.id}`);
  });
});

// Admin Operasional Delete Record (Super Admin Only)
app.post('/admin/operasional/delete/:id', requireAuth, requireSuperAdmin, (req, res) => {
  db.run('DELETE FROM pengajuan_barang WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).send(err.message);
    res.redirect('/admin/operasional');
  });
});

// Export Operasional PDF Single BA
app.get('/api/operasional/export/pdf/:id', (req, res) => {
  db.get('SELECT * FROM pengajuan_barang WHERE id = ?', [req.params.id], async (err, row) => {
    if (err || !row) return res.status(404).send('Berita Acara tidak ditemukan.');

    try {
      const pdfBuffer = await generateOperasionalPDF(row);
      const filename = `BA_Pengajuan_${(row.no_ba || 'BA_OPS_' + row.id).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (pdfErr) {
      console.error('Operasional PDF Error:', pdfErr);
      res.status(500).send('Error generating Operasional PDF: ' + pdfErr.message);
    }
  });
});

// Export Operasional Excel All BA (Protected)
app.get('/api/operasional/export/excel', requireOperasionalAuth, (req, res) => {
  db.all('SELECT * FROM pengajuan_barang ORDER BY id DESC', [], async (err, rows) => {
    if (err) return res.status(500).send(err.message);

    try {
      const buffer = await generateOperasionalExcel(rows);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Record_BA_Pengajuan_Barang_Operasional.xlsx"');
      res.send(buffer);
    } catch (excelErr) {
      console.error('Operasional Excel Error:', excelErr);
      res.status(500).send('Error generating Operasional Excel: ' + excelErr.message);
    }
  });
});

// =========================================================================
// OPERASIONAL: PURCHASE ORDER (PO) ROUTES
// =========================================================================

// PO Admin Dashboard
app.get('/admin/operasional/po', requireOperasionalAuth, (req, res) => {
  db.all('SELECT * FROM purchase_orders ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    res.render('po_admin', { records: rows || [], user: req.session.user, baseUrl });
  });
});

// Create PO Form Page
app.get('/admin/operasional/po/create', requireOperasionalAuth, (req, res) => {
  res.render('po_form', { user: req.session.user });
});

// Submit PO API
app.post('/api/operasional/po/submit', requireOperasionalAuth, (req, res) => {
  const body = req.body;
  const now = new Date();
  const monthRoman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][now.getMonth()];
  const randNum = Math.floor(10 + Math.random() * 90);
  const generatedNoPo = body.no_po || `PO/WHM/${monthRoman}/${now.getFullYear()}/${randNum}`;

  const subtotal = parseFloat(body.subtotal || 0);
  const ppnPersen = parseFloat(body.ppn_persen || 0);
  const ppnNominal = parseFloat(body.ppn_nominal || 0);
  const diskonNominal = parseFloat(body.diskon_nominal || 0);
  const totalNetto = parseFloat(body.total_netto || (subtotal + ppnNominal - diskonNominal));

  const sql = `
    INSERT INTO purchase_orders (
      no_po, tanggal_po, vendor_nama, vendor_nama_dagang, perihal, unit_kerja, status_po,
      lokasi_kirim, tgl_pengiriman, termin_bayar, mata_uang, items_json,
      subtotal, ppn_persen, ppn_nominal, diskon_nominal, total_netto, catatan_syarat,
      dibuat_oleh_nama, dibuat_oleh_jabatan, signature_dibuat,
      disetujui_oleh_nama, disetujui_oleh_jabatan,
      vendor_konfirmasi_nama, vendor_konfirmasi_jabatan, share_token
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    generatedNoPo,
    body.tanggal_po || new Date().toISOString().split('T')[0],
    body.vendor_nama || '',
    body.vendor_nama_dagang || '',
    body.perihal || '',
    body.unit_kerja || 'PT SUMBER CITA INDONESIA',
    body.status_po || 'Reguler / Approved',
    body.lokasi_kirim || '',
    body.tgl_pengiriman || '',
    body.termin_bayar || '',
    body.mata_uang || 'IDR (Rupiah)',
    body.items_json || '[]',
    subtotal,
    ppnPersen,
    ppnNominal,
    diskonNominal,
    totalNetto,
    body.catatan_syarat || '',
    body.dibuat_oleh_nama || 'ISWANDA ADITYA F.',
    body.dibuat_oleh_jabatan || 'Procurement / Staff IT',
    body.signature_dibuat || '',
    body.disetujui_oleh_nama || 'KEN',
    body.disetujui_oleh_jabatan || 'Finance Manager',
    body.vendor_konfirmasi_nama || body.vendor_nama || '',
    body.vendor_konfirmasi_jabatan || 'Perwakilan Resmi',
    body.share_token || ''
  ];

  db.run(sql, params, function(err) {
    if (err) {
      console.error('Error inserting purchase order:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({
      success: true,
      id: this.lastID,
      no_po: generatedNoPo,
      message: 'Purchase Order berhasil diterbitkan.'
    });
  });
});

// PO Detail View
app.get('/admin/operasional/po/detail/:id', requireOperasionalAuth, (req, res) => {
  db.get('SELECT * FROM purchase_orders WHERE id = ?', [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).send('Purchase Order tidak ditemukan.');
    res.render('po_detail', { po: row, user: req.session.user });
  });
});

// Delete PO (Super Admin Only)
app.post('/admin/operasional/po/delete/:id', requireAuth, requireSuperAdmin, (req, res) => {
  db.run('DELETE FROM purchase_orders WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).send(err.message);
    res.redirect('/admin/operasional/po');
  });
});

// Export Official PO PDF
app.get('/api/operasional/po/export/pdf/:id', requireOperasionalAuth, (req, res) => {
  db.get('SELECT * FROM purchase_orders WHERE id = ?', [req.params.id], async (err, row) => {
    if (err || !row) return res.status(404).send('Purchase Order tidak ditemukan.');

    try {
      const pdfBuffer = await generatePOPDF(row);
      const filename = `PO_${(row.no_po || 'PO_KOV_' + row.id).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (pdfErr) {
      console.error('PO PDF Error:', pdfErr);
      res.status(500).send('Error generating PO PDF: ' + pdfErr.message);
    }
  });
});

// Export All POs Excel
app.get('/api/operasional/po/export/excel', requireOperasionalAuth, (req, res) => {
  db.all('SELECT * FROM purchase_orders ORDER BY id DESC', [], async (err, rows) => {
    if (err) return res.status(500).send(err.message);

    try {
      const buffer = await generatePOExcel(rows);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Record_Purchase_Orders_Operasional.xlsx"');
      res.send(buffer);
    } catch (excelErr) {
      console.error('PO Excel Error:', excelErr);
      res.status(500).send('Error generating PO Excel: ' + excelErr.message);
    }
  });
});

// =========================================================================
// OPERASIONAL: SURAT TUGAS & FORM PERTANGGUNGJAWABAN (LPJ) ROUTES
// =========================================================================

// Public API: Submit Surat Tugas & LPJ
app.post('/api/operasional/surat-tugas/submit', (req, res) => {
  const body = req.body;
  const now = new Date();
  const yyyymm = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0');
  const randNum = Math.floor(100 + Math.random() * 900);
  const generatedNoSurat = body.no_surat || `ST/KOV/${yyyymm}/${randNum}`;

  let petugasJsonStr = '[]';
  if (typeof body.petugas === 'string') {
    petugasJsonStr = body.petugas;
  } else if (Array.isArray(body.petugas)) {
    petugasJsonStr = JSON.stringify(body.petugas);
  }

  let pelaksanaanJsonStr = '[]';
  if (typeof body.pelaksanaan_tugas === 'string') {
    pelaksanaanJsonStr = body.pelaksanaan_tugas;
  } else if (Array.isArray(body.pelaksanaan_tugas)) {
    pelaksanaanJsonStr = JSON.stringify(body.pelaksanaan_tugas);
  }

  const uangDinasHari = parseInt(body.uang_dinas_hari || 0, 10);
  const uangDinasTotal = parseFloat(body.uang_dinas_total || (uangDinasHari * 50000));
  const uangMenginapMalam = parseInt(body.uang_menginap_malam || 0, 10);
  const uangMenginapTotal = parseFloat(body.uang_menginap_total || (uangMenginapMalam * 25000));
  const biayaTransport = parseFloat(body.biaya_transportasi || 0);
  const biayaInap = parseFloat(body.biaya_penginapan || 0);
  const biayaLain = parseFloat(body.biaya_lainnya || 0);
  const totalBiaya = parseFloat(body.total_biaya || (uangDinasTotal + uangMenginapTotal + biayaTransport + biayaInap + biayaLain));

  const sql = `
    INSERT INTO surat_tugas (
      no_surat, tanggal_surat, kota_surat,
      pemberi_tugas_nama, pemberi_tugas_jabatan,
      petugas_json, divisi_terkait,
      lokasi_tujuan, kota_tujuan,
      tanggal_berangkat, tanggal_kembali, keperluan,
      user_pembuat_nama, user_pembuat_jabatan, signature_pembuat,
      ka_divisi_nama, ka_divisi_jabatan, status_ka_divisi,
      gm_nama, status_gm, status_surat,
      lpj_diisi, lpj_nama, lpj_jabatan_divisi,
      realisasi_tgl_berangkat, realisasi_jam_berangkat,
      realisasi_tgl_kembali, realisasi_jam_kembali,
      realisasi_jumlah_hari, pelaksanaan_tugas_json,
      bukti_dokumen_keterangan, bukti_dokumen_link,
      uang_dinas_hari, uang_dinas_total,
      uang_menginap_malam, uang_menginap_total,
      biaya_transportasi, biaya_penginapan, biaya_lainnya,
      keterangan_biaya_lain, total_biaya,
      status_lpj, share_token
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    generatedNoSurat,
    body.tanggal_surat || now.toISOString().split('T')[0],
    body.kota_surat || 'Semarang',
    body.pemberi_tugas_nama || body.user_pembuat_nama || '',
    body.pemberi_tugas_jabatan || body.user_pembuat_jabatan || 'KA Outlet',
    petugasJsonStr,
    body.divisi_terkait || '',
    body.lokasi_tujuan || '',
    body.kota_tujuan || '',
    body.tanggal_berangkat || '',
    body.tanggal_kembali || '',
    body.keperluan || '',
    body.user_pembuat_nama || body.pemberi_tugas_nama || '',
    body.user_pembuat_jabatan || body.pemberi_tugas_jabatan || 'KA Outlet',
    body.signature_pembuat || '',
    body.ka_divisi_nama || '',
    body.ka_divisi_jabatan || '',
    body.status_ka_divisi || 'Pending',
    body.gm_nama || 'Aldo Widarta - GM',
    body.status_gm || 'Pending',
    body.status_surat || 'Menunggu Approval',
    body.lpj_diisi ? 1 : 0,
    body.lpj_nama || body.user_pembuat_nama || '',
    body.lpj_jabatan_divisi || body.user_pembuat_jabatan || '',
    body.realisasi_tgl_berangkat || '',
    body.realisasi_jam_berangkat || '',
    body.realisasi_tgl_kembali || '',
    body.realisasi_jam_kembali || '',
    parseInt(body.realisasi_jumlah_hari || 0, 10),
    pelaksanaanJsonStr,
    body.bukti_dokumen_keterangan || '',
    body.bukti_dokumen_link || '',
    uangDinasHari,
    uangDinasTotal,
    uangMenginapMalam,
    uangMenginapTotal,
    biayaTransport,
    biayaInap,
    biayaLain,
    body.keterangan_biaya_lain || '',
    totalBiaya,
    body.status_lpj || 'Draft',
    body.share_token || ''
  ];

  db.run(sql, params, function(err) {
    if (err) {
      console.error('Error inserting surat_tugas:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({
      success: true,
      id: this.lastID,
      no_surat: generatedNoSurat,
      message: 'Surat Tugas & Form Pertanggungjawaban berhasil tersimpan.'
    });
  });
});

// Admin Dashboard: Surat Tugas & LPJ List
app.get('/admin/operasional/surat-tugas', requireOperasionalAuth, (req, res) => {
  db.all('SELECT * FROM surat_tugas ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    res.render('surat_tugas_admin', { records: rows || [], user: req.session.user, baseUrl });
  });
});

// Admin Create Surat Tugas Form Page
app.get('/admin/operasional/surat-tugas/create', requireOperasionalAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'surat_tugas.html'));
});

// Admin Detail & Approval Page
app.get('/admin/operasional/surat-tugas/detail/:id', requireOperasionalAuth, (req, res) => {
  db.get('SELECT * FROM surat_tugas WHERE id = ?', [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).send('Surat Tugas tidak ditemukan.');
    res.render('surat_tugas_detail', { item: row, user: req.session.user });
  });
});

// Admin Update Approval & LPJ
app.post('/admin/operasional/surat-tugas/update/:id', requireOperasionalAuth, (req, res) => {
  const body = req.body;
  const now = new Date().toISOString().split('T')[0];

  const uangDinasHari = parseInt(body.uang_dinas_hari || 0, 10);
  const uangDinasTotal = uangDinasHari * 50000;
  const uangMenginapMalam = parseInt(body.uang_menginap_malam || 0, 10);
  const uangMenginapTotal = uangMenginapMalam * 25000;
  const biayaTransport = parseFloat(body.biaya_transportasi || 0);
  const biayaInap = parseFloat(body.biaya_penginapan || 0);
  const biayaLain = parseFloat(body.biaya_lainnya || 0);
  const totalBiaya = uangDinasTotal + uangMenginapTotal + biayaTransport + biayaInap + biayaLain;

  const sql = `
    UPDATE surat_tugas SET
      status_ka_divisi = ?,
      tgl_ka_divisi = CASE WHEN ? = 'Disetujui' THEN ? ELSE tgl_ka_divisi END,
      catatan_ka_divisi = ?,
      status_gm = ?,
      tgl_gm = CASE WHEN ? = 'Disetujui' THEN ? ELSE tgl_gm END,
      status_surat = ?,
      realisasi_tgl_berangkat = ?,
      realisasi_jam_berangkat = ?,
      realisasi_tgl_kembali = ?,
      realisasi_jam_kembali = ?,
      realisasi_jumlah_hari = ?,
      uang_dinas_hari = ?,
      uang_dinas_total = ?,
      uang_menginap_malam = ?,
      uang_menginap_total = ?,
      biaya_transportasi = ?,
      biaya_penginapan = ?,
      biaya_lainnya = ?,
      keterangan_biaya_lain = ?,
      total_biaya = ?,
      bukti_dokumen_keterangan = ?,
      status_lpj = ?,
      lpj_diisi = CASE WHEN ? > 0 OR ? != 'Draft' THEN 1 ELSE lpj_diisi END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const params = [
    body.status_ka_divisi || 'Pending',
    body.status_ka_divisi, now,
    body.catatan_ka_divisi || '',
    body.status_gm || 'Pending',
    body.status_gm, now,
    body.status_surat || 'Menunggu Approval',
    body.realisasi_tgl_berangkat || '',
    body.realisasi_jam_berangkat || '',
    body.realisasi_tgl_kembali || '',
    body.realisasi_jam_kembali || '',
    uangDinasHari,
    uangDinasHari,
    uangDinasTotal,
    uangMenginapMalam,
    uangMenginapTotal,
    biayaTransport,
    biayaInap,
    biayaLain,
    body.keterangan_biaya_lain || '',
    totalBiaya,
    body.bukti_dokumen_keterangan || '',
    body.status_lpj || 'Draft',
    totalBiaya, body.status_lpj || 'Draft',
    req.params.id
  ];

  db.run(sql, params, (err) => {
    if (err) return res.status(500).send(err.message);
    res.redirect(`/admin/operasional/surat-tugas/detail/${req.params.id}`);
  });
});

// Admin Delete Surat Tugas (Super Admin Only)
app.post('/admin/operasional/surat-tugas/delete/:id', requireAuth, requireSuperAdmin, (req, res) => {
  db.run('DELETE FROM surat_tugas WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).send(err.message);
    res.redirect('/admin/operasional/surat-tugas');
  });
});

// Export PDF Single Surat Tugas & LPJ
app.get('/api/operasional/surat-tugas/export/pdf/:id', (req, res) => {
  db.get('SELECT * FROM surat_tugas WHERE id = ?', [req.params.id], async (err, row) => {
    if (err || !row) return res.status(404).send('Surat Tugas tidak ditemukan.');

    try {
      const pdfBuffer = await generateSuratTugasPDF(row);
      const filename = `Surat_Tugas_${(row.no_surat || 'ST_KOV_' + row.id).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (pdfErr) {
      console.error('Surat Tugas PDF Error:', pdfErr);
      res.status(500).send('Error generating Surat Tugas PDF: ' + pdfErr.message);
    }
  });
});

// Export All Surat Tugas Excel (Protected)
app.get('/api/operasional/surat-tugas/export/excel', requireOperasionalAuth, (req, res) => {
  db.all('SELECT * FROM surat_tugas ORDER BY id DESC', [], async (err, rows) => {
    if (err) return res.status(500).send(err.message);

    try {
      const buffer = await generateSuratTugasExcel(rows);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Record_Surat_Tugas_dan_LPJ_Operasional.xlsx"');
      res.send(buffer);
    } catch (excelErr) {
      console.error('Surat Tugas Excel Error:', excelErr);
      res.status(500).send('Error generating Surat Tugas Excel: ' + excelErr.message);
    }
  });
});

// ==========================================
// MODUL REKAP PEMBELANJAAN KHUSUS IT
// (Eksklusif & hanya tersedia 1 akun khusus IT)
// ==========================================

// Dashboard Rekap Pembelanjaan IT (Mendukung Multi-Item per Vendor & Berbasis Outlet)
app.get('/admin/it', requireAuth, requireITAuth, (req, res) => {
  db.all('SELECT * FROM it_expenses ORDER BY tanggal DESC, id DESC', [], async (err, rows) => {
    if (err) return res.status(500).send(err.message);

    const expenses = (rows || []).map(row => {
      let parsedItems = [];
      if (row.items_json) {
        try {
          parsedItems = JSON.parse(row.items_json);
        } catch (e) {
          parsedItems = [];
        }
      }
      if (!parsedItems || parsedItems.length === 0) {
        parsedItems = [{
          nama: row.nama_barang || '-',
          kategori: row.kategori || 'Operasional & Lainnya',
          qty: Number(row.qty || 1),
          satuan: row.satuan || 'Unit',
          harga: Number(row.harga_satuan || 0),
          subtotal: Number(row.total_biaya || 0)
        }];
      }
      return {
        ...row,
        parsedItems
      };
    });

    let totalPengeluaran = 0;
    let pengeluaranBulanIni = 0;
    let totalPending = 0;
    const currentYearMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

    const outletStats = {};
    const kategoriStats = {};

    expenses.forEach(item => {
      const biaya = Number(item.total_biaya || 0);
      totalPengeluaran += biaya;
      if (item.tanggal && item.tanggal.startsWith(currentYearMonth)) {
        pengeluaranBulanIni += biaya;
      }
      if (item.status_bayar !== 'Lunas') {
        totalPending++;
      }

      // Outlet stats
      const outlet = item.unit_outlet || 'Kantor Pusat Semarang';
      if (!outletStats[outlet]) {
        outletStats[outlet] = { count: 0, total: 0 };
      }
      outletStats[outlet].count++;
      outletStats[outlet].total += biaya;

      // Kategori stats from item components
      item.parsedItems.forEach(it => {
        const kat = it.kategori || 'Operasional & Lainnya';
        if (!kategoriStats[kat]) {
          kategoriStats[kat] = { count: 0, total: 0 };
        }
        kategoriStats[kat].count++;
        kategoriStats[kat].total += Number(it.subtotal || 0);
      });
    });

    function getBadgeKat(kat) {
      switch (kat) {
        case 'Hardware & Komputer': return 'badge-kat-hardware';
        case 'Jaringan & Network': return 'badge-kat-jaringan';
        case 'CCTV & Keamanan': return 'badge-kat-cctv';
        case 'Software & Lisensi': return 'badge-kat-software';
        case 'Perawatan & Service': return 'badge-kat-service';
        case 'Aksesoris & Peripheral': return 'badge-kat-aksesoris';
        default: return 'badge-kat-lainnya';
      }
    }

    const vendorList = Array.from(new Set(expenses.map(e => (e.vendor_toko || '').trim()).filter(Boolean))).sort();
    let geminiKey = '';
    try {
      geminiKey = await getGeminiApiKey();
    } catch (e) {
      geminiKey = '';
    }

    res.render('it_admin', {
      user: req.session.user,
      expenses,
      totalPengeluaran,
      pengeluaranBulanIni,
      totalPending,
      outletStats,
      kategoriStats,
      outletList: Object.keys(outletStats),
      vendorList,
      hasGeminiKey: !!(geminiKey && geminiKey.trim() !== ''),
      geminiKeyPreview: geminiKey ? (geminiKey.slice(0, 6) + '...' + geminiKey.slice(-4)) : '',
      getBadgeKat,
      success: req.query.success || null,
      error: req.query.error || null
    });
  });
});

// API: Tambah Belanja IT Baru (Multi-Item per Nota)
app.post('/api/it/expenses', requireAuth, requireITAuth, (req, res) => {
  const body = req.body;
  let {
    tanggal, no_transaksi, unit_outlet,
    vendor_toko, metode_bayar, status_bayar, bukti_transaksi, keterangan, items_json
  } = body;

  let items = [];
  if (items_json) {
    try {
      items = typeof items_json === 'string' ? JSON.parse(items_json) : items_json;
    } catch (e) {
      items = [];
    }
  }

  // Fallback if submitted without items_json
  if (!items || items.length === 0) {
    const q = parseInt(body.qty, 10) || 1;
    const h = parseFloat(body.harga_satuan) || 0;
    items = [{
      nama: body.nama_barang || 'Kebutuhan IT',
      kategori: body.kategori || 'Jaringan & Network',
      qty: q,
      satuan: body.satuan || 'Unit',
      harga: h,
      subtotal: q * h
    }];
  }

  let totalBiaya = 0;
  let totalQty = 0;
  items.forEach(it => {
    it.qty = parseInt(it.qty, 10) || 1;
    it.harga = parseFloat(it.harga) || 0;
    it.subtotal = it.qty * it.harga;
    totalBiaya += it.subtotal;
    totalQty += it.qty;
  });

  const mainNama = items.length > 1
    ? `${items[0].nama} (dan ${items.length - 1} item lainnya)`
    : (items[0] ? items[0].nama : 'Kebutuhan IT');
  const mainKat = items[0] ? items[0].kategori : 'Jaringan & Network';

  function saveItem(finalNo) {
    db.run(`
      INSERT INTO it_expenses (
        no_transaksi, tanggal, nama_barang, kategori, unit_outlet,
        qty, satuan, harga_satuan, total_biaya,
        vendor_toko, metode_bayar, status_bayar, bukti_transaksi, keterangan, items_json, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      finalNo, tanggal || new Date().toISOString().slice(0, 10), mainNama, mainKat, unit_outlet || 'Kantor Pusat Semarang',
      totalQty, 'Item', items[0] ? items[0].harga : totalBiaya, totalBiaya,
      vendor_toko || '', metode_bayar || 'Transfer Bank', status_bayar || 'Lunas',
      bukti_transaksi || '', keterangan || '', JSON.stringify(items), req.session.user.username || 'it'
    ], (err) => {
      if (err) {
        console.error('Error insert IT expense:', err);
        return res.redirect('/admin/it?error=' + encodeURIComponent('Gagal menyimpan pembelanjaan: ' + err.message));
      }
      res.redirect('/admin/it?success=' + encodeURIComponent(`Catatan belanja ${finalNo} (${unit_outlet}) berhasil disimpan!`));
    });
  }

  if (!no_transaksi || no_transaksi.trim() === '') {
    const ym = (tanggal || new Date().toISOString().slice(0, 10)).slice(0, 7).replace('-', '');
    db.get('SELECT COUNT(*) as cnt FROM it_expenses WHERE no_transaksi LIKE ?', [`IT-${ym}-%`], (err, row) => {
      const nextNum = (row ? row.cnt : 0) + 1;
      const autoNo = `IT-${ym}-${String(nextNum).padStart(3, '0')}`;
      saveItem(autoNo);
    });
  } else {
    saveItem(no_transaksi.trim());
  }
});

// API: Update Belanja IT (Multi-Item per Nota)
app.post('/api/it/expenses/update/:id', requireAuth, requireITAuth, (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  const body = req.body;
  let {
    tanggal, no_transaksi, unit_outlet,
    vendor_toko, metode_bayar, status_bayar, bukti_transaksi, keterangan, items_json
  } = body;

  let items = [];
  if (items_json) {
    try {
      items = typeof items_json === 'string' ? JSON.parse(items_json) : items_json;
    } catch (e) {
      items = [];
    }
  }

  if (!items || items.length === 0) {
    const q = parseInt(body.qty, 10) || 1;
    const h = parseFloat(body.harga_satuan) || 0;
    items = [{
      nama: body.nama_barang || 'Kebutuhan IT',
      kategori: body.kategori || 'Jaringan & Network',
      qty: q,
      satuan: body.satuan || 'Unit',
      harga: h,
      subtotal: q * h
    }];
  }

  let totalBiaya = 0;
  let totalQty = 0;
  items.forEach(it => {
    it.qty = parseInt(it.qty, 10) || 1;
    it.harga = parseFloat(it.harga) || 0;
    it.subtotal = it.qty * it.harga;
    totalBiaya += it.subtotal;
    totalQty += it.qty;
  });

  const mainNama = items.length > 1
    ? `${items[0].nama} (dan ${items.length - 1} item lainnya)`
    : (items[0] ? items[0].nama : 'Kebutuhan IT');
  const mainKat = items[0] ? items[0].kategori : 'Jaringan & Network';

  db.run(`
    UPDATE it_expenses SET
      no_transaksi = ?, tanggal = ?, nama_barang = ?, kategori = ?, unit_outlet = ?,
      qty = ?, satuan = ?, harga_satuan = ?, total_biaya = ?,
      vendor_toko = ?, metode_bayar = ?, status_bayar = ?, bukti_transaksi = ?,
      keterangan = ?, items_json = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    no_transaksi, tanggal, mainNama, mainKat, unit_outlet,
    totalQty, 'Item', items[0] ? items[0].harga : totalBiaya, totalBiaya,
    vendor_toko, metode_bayar, status_bayar, bukti_transaksi,
    keterangan, JSON.stringify(items), targetId
  ], (err) => {
    if (err) {
      console.error('Error update IT expense:', err);
      return res.redirect('/admin/it?error=' + encodeURIComponent('Gagal memperbarui: ' + err.message));
    }
    res.redirect('/admin/it?success=' + encodeURIComponent(`Transaksi #${targetId} (${unit_outlet}) berhasil diperbarui!`));
  });
});

// API: Delete Belanja IT
app.post('/api/it/expenses/delete/:id', requireAuth, requireITAuth, (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  db.run('DELETE FROM it_expenses WHERE id = ?', [targetId], (err) => {
    if (err) {
      return res.redirect('/admin/it?error=' + encodeURIComponent('Gagal menghapus: ' + err.message));
    }
    res.redirect('/admin/it?success=' + encodeURIComponent('Data transaksi pembelanjaan berhasil dihapus!'));
  });
});

// ==========================================
// GOOGLE GEMINI AI - INVOICE SCANNER & OCR
// ==========================================

// API: Cek Status API Key Gemini
app.get('/api/it/ai/status', requireAuth, requireITAuth, async (req, res) => {
  try {
    const key = await getGeminiApiKey();
    res.json({
      success: true,
      hasKey: !!(key && key.trim() !== ''),
      keyPreview: key ? (key.slice(0, 6) + '...' + key.slice(-4)) : ''
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Simpan / Perbarui Gemini API Key
app.post('/api/it/ai/save-key', requireAuth, requireITAuth, async (req, res) => {
  try {
    const { api_key } = req.body;
    if (!api_key || api_key.trim() === '') {
      return res.status(400).json({ success: false, error: 'Google Gemini API Key tidak boleh kosong!' });
    }
    await saveGeminiApiKey(api_key.trim());
    res.json({
      success: true,
      message: 'Google Gemini API Key berhasil disimpan dan siap digunakan!'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Upload & Scan Invoice secara langsung dengan AI OCR Otomatis (Tanpa API Key)
app.post('/api/it/ai/scan-invoice', requireAuth, requireITAuth, uploadInvoice.single('invoice_file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Silakan pilih file foto invoice / nota (JPG, PNG, atau PDF) terlebih dahulu.' });
    }

    const fileUrl = '/uploads/invoices/' + req.file.filename;

    const extractedData = await scanInvoiceDocument(req.file.path, req.file.mimetype, req.file.originalname);

    res.json({
      success: true,
      data: extractedData,
      fileUrl: fileUrl,
      filename: req.file.originalname
    });
  } catch (err) {
    console.error('[AI Invoice Scan Error]:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Terjadi kesalahan saat membaca invoice dengan AI Scanner.'
    });
  }
});

// Helper for IT filter query
function buildITFilterQuery(query) {
  const selectedOutlet = query.outlet;
  const selectedVendor = query.vendor;
  const startDate = query.start_date;
  const endDate = query.end_date;
  const keyword = query.keyword || query.item || query.search;
  const kategori = query.kategori;

  let sql = 'SELECT * FROM it_expenses WHERE 1=1';
  let params = [];

  if (selectedOutlet && selectedOutlet !== 'ALL' && selectedOutlet !== 'Semua Outlet') {
    sql += ' AND unit_outlet = ?';
    params.push(selectedOutlet);
  }

  if (selectedVendor && selectedVendor !== 'ALL' && selectedVendor !== 'Semua Vendor' && selectedVendor.trim() !== '') {
    sql += ' AND vendor_toko LIKE ?';
    params.push(`%${selectedVendor.trim()}%`);
  }

  if (startDate) {
    sql += ' AND tanggal >= ?';
    params.push(startDate);
  }

  if (endDate) {
    sql += ' AND tanggal <= ?';
    params.push(endDate);
  }

  if (keyword && keyword.trim() !== '') {
    const kw = `%${keyword.trim()}%`;
    sql += ' AND (nama_barang LIKE ? OR items_json LIKE ? OR vendor_toko LIKE ? OR no_transaksi LIKE ?)';
    params.push(kw, kw, kw, kw);
  }

  if (kategori && kategori !== 'ALL' && kategori !== 'Semua Kategori' && kategori.trim() !== '') {
    sql += ' AND (kategori = ? OR items_json LIKE ?)';
    params.push(kategori, `%${kategori}%`);
  }

  sql += ' ORDER BY tanggal ASC, id ASC';

  const filterOptions = {
    outlet: (selectedOutlet && selectedOutlet !== 'ALL') ? selectedOutlet : 'Semua Outlet',
    vendor: (selectedVendor && selectedVendor !== 'ALL' && selectedVendor !== 'Semua Vendor') ? selectedVendor.trim() : '',
    start_date: startDate || '',
    end_date: endDate || '',
    keyword: keyword ? keyword.trim() : '',
    kategori: (kategori && kategori !== 'ALL' && kategori !== 'Semua Kategori') ? kategori : ''
  };

  return { sql, params, filterOptions };
}

// API: Export Rekap Pembelanjaan IT to Excel (Mendukung Filter per Outlet, Tanggal, Item)
app.get('/api/it/export/excel', requireAuth, requireITAuth, (req, res) => {
  const { sql, params, filterOptions } = buildITFilterQuery(req.query);

  db.all(sql, params, async (err, rows) => {
    if (err) return res.status(500).send(err.message);

    try {
      const buffer = await generateITExcel(rows || [], filterOptions);
      const cleanOutletName = (filterOptions.outlet || 'Semua_Outlet').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Rekap_Belanja_IT_${cleanOutletName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (excelErr) {
      console.error('IT Excel Error:', excelErr);
      res.status(500).send('Error generating IT Excel: ' + excelErr.message);
    }
  });
});

// API: Export Rekap Pembelanjaan IT to PDF (Mendukung Filter per Outlet, Tanggal, Item)
app.get('/api/it/export/pdf', requireAuth, requireITAuth, (req, res) => {
  const { sql, params, filterOptions } = buildITFilterQuery(req.query);

  db.all(sql, params, async (err, rows) => {
    if (err) return res.status(500).send(err.message);

    try {
      const pdfBuffer = await generateITPDF(rows || [], filterOptions);
      const cleanOutletName = (filterOptions.outlet || 'Semua_Outlet').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Rekap_Belanja_IT_${cleanOutletName}_${new Date().toISOString().slice(0, 10)}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (pdfErr) {
      console.error('IT PDF Error:', pdfErr);
      res.status(500).send('Error generating IT PDF: ' + pdfErr.message);
    }
  });
});

// API: Ganti Password Akun Khusus IT
app.post('/api/it/change-password', requireAuth, requireITAuth, (req, res) => {
  const { new_password, confirm_password } = req.body;
  if (!new_password || new_password.trim() === '') {
    return res.redirect('/admin/it?error=' + encodeURIComponent('Password baru tidak boleh kosong!'));
  }
  if (new_password !== confirm_password) {
    return res.redirect('/admin/it?error=' + encodeURIComponent('Konfirmasi password tidak cocok!'));
  }

  const hash = bcrypt.hashSync(new_password, 10);
  db.run('UPDATE users SET password = ? WHERE id = ?', [hash, req.session.user.id], (err) => {
    if (err) {
      return res.redirect('/admin/it?error=' + encodeURIComponent('Gagal mengubah password: ' + err.message));
    }
    res.redirect('/admin/it?success=' + encodeURIComponent('Password akun khusus IT berhasil diperbarui!'));
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`==================================================`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`HR Candidate Form: http://localhost:${PORT}/`);
  console.log(`HR Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`Operasional BA Form: http://localhost:${PORT}/pengajuan-barang`);
  console.log(`Operasional Surat Tugas Form: http://localhost:${PORT}/surat-tugas`);
  console.log(`Operasional Dashboard: http://localhost:${PORT}/admin/operasional`);
  console.log(`Surat Tugas Dashboard: http://localhost:${PORT}/admin/operasional/surat-tugas`);
  console.log(`Rekap Pembelanjaan IT (Khusus 1 Akun IT): http://localhost:${PORT}/admin/it`);
  console.log(`Admin Login: http://localhost:${PORT}/admin/login`);
  console.log(`User Management (Super Admin): http://localhost:${PORT}/admin/users`);
  console.log(`==================================================`);
});
