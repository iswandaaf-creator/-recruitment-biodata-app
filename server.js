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

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'hr_recruitment_secret_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 Hours
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Authentication Middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/admin/login');
}

// Super Admin Authorization Middleware
function requireSuperAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'superadmin') {
    return next();
  }
  res.status(403).send('<h3>Forbidden 403: Akses ditolak. Hanya Super Admin yang dapat mengakses kelola user.</h3><a href="/admin">Kembali ke Dashboard</a>');
}

// Candidate Form Page (Public)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin Login Page
app.get('/admin/login', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/admin');
  }
  res.render('login', { error: null });
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

    req.session.user = {
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role
    };
    res.redirect('/admin');
  });
});

// Admin Logout
app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => {
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
      perkiraan_bergabung, gaji_diharapkan, kota_ttd, tanggal_ttd, signature_data, share_token
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    body.posisi_dilamar, body.posisi_lain, body.sumber_info, body.punya_kerabat, body.nama_kerabat_posisi,
    body.nama_lengkap, body.nama_panggilan, body.email, body.jenis_kelamin, body.kewarganegaraan, body.suku,
    body.tempat_lahir, body.tanggal_lahir, body.agama, body.golongan_darah, body.nomor_ktp, body.alamat_ktp,
    body.kota_ktp, body.kode_pos_ktp, body.alamat_domisili, body.kota_domisili, body.kode_pos_domisili,
    body.status_alamat_domisili, body.no_telp_rumah, body.no_hp, body.status_perkawinan, body.hobby,
    JSON.stringify(keluarga_kandung), JSON.stringify(keluarga_menikah), JSON.stringify(pendidikan_formal),
    JSON.stringify(pendidikan_non_formal), JSON.stringify(referensi), JSON.stringify(riwayat_pekerjaan),
    body.alasan_rekrutmen, body.minat_passion, body.rencana_3_5_tahun, body.prestasi,
    body.melamar_perusahaan_lain, JSON.stringify(social_media), body.riwayat_kesehatan,
    body.perkiraan_bergabung, body.gaji_diharapkan, body.kota_ttd, body.tanggal_ttd, body.signature_data,
    body.share_token || body.ref || body.token || ''
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

// Admin Dashboard (Protected)
app.get('/admin', requireAuth, (req, res) => {
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

    res.render('admin', { candidates, user: req.session.user });
  });
});

// Candidate Detail & Interview Notes Page (Protected)
app.get('/admin/candidate/:id', requireAuth, (req, res) => {
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

// Save Interview Notes (Page 5) (Protected)
app.post('/admin/candidate/:id/interview', requireAuth, (req, res) => {
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
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(sql, [cw1, cw2, cw3, body.kesimpulan_status, body.kesimpulan_catatan, req.params.id], (err) => {
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`==================================================`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Candidate Form: http://localhost:${PORT}/`);
  console.log(`HR Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`Admin Login: http://localhost:${PORT}/admin/login`);
  console.log(`User Management (Super Admin): http://localhost:${PORT}/admin/users`);
  console.log(`==================================================`);
});
