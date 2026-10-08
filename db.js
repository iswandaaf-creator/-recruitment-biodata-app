const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = process.env.DATA_DIR || 
                process.env.RAILWAY_VOLUME_MOUNT_PATH || 
                (fs.existsSync('/data') ? '/data' : path.join(__dirname, 'db'));

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.sqlite');
console.log('[DATABASE] Connecting to SQLite database at:', dbPath);
const sqlite = new DatabaseSync(dbPath);
try {
  sqlite.exec('PRAGMA journal_mode = WAL;');
  sqlite.exec('PRAGMA synchronous = NORMAL;');
} catch (e) {
  // PRAGMA WAL enabled
}

// Async Callback Wrapper for better-sqlite3 (100% compatible with sqlite3 API)
const db = {
  serialize: function(fn) {
    if (fn) fn();
  },
  run: function(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    try {
      const stmt = sqlite.prepare(sql);
      const cleanParams = (Array.isArray(params) ? params : [params]).map(p => (p === undefined || p === null) ? '' : p);
      const info = stmt.run(...cleanParams);
      if (callback) {
        callback.call({ lastID: Number(info.lastInsertRowid), changes: info.changes }, null);
      }
    } catch (err) {
      if (callback) callback(err);
      else console.error('DB Run Error:', err);
    }
  },
  get: function(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    try {
      const stmt = sqlite.prepare(sql);
      const cleanParams = (Array.isArray(params) ? params : [params]).map(p => (p === undefined || p === null) ? '' : p);
      const row = stmt.get(...cleanParams);
      if (callback) callback(null, row);
    } catch (err) {
      if (callback) callback(err);
      else console.error('DB Get Error:', err);
    }
  },
  all: function(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    try {
      const stmt = sqlite.prepare(sql);
      const cleanParams = (Array.isArray(params) ? params : [params]).map(p => (p === undefined || p === null) ? '' : p);
      const rows = stmt.all(...cleanParams);
      if (callback) callback(null, rows);
    } catch (err) {
      if (callback) callback(err);
      else console.error('DB All Error:', err);
    }
  }
};

// Initialize Tables
db.serialize(() => {
  // Candidate Submissions Table
  db.run(`
    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      -- Top Header
      posisi_dilamar TEXT,
      posisi_lain TEXT,
      sumber_info TEXT,
      punya_kerabat TEXT,
      nama_kerabat_posisi TEXT,

      -- Identitas Diri
      nama_lengkap TEXT,
      nama_panggilan TEXT,
      email TEXT,
      jenis_kelamin TEXT,
      kewarganegaraan TEXT,
      suku TEXT,
      tempat_lahir TEXT,
      tanggal_lahir TEXT,
      agama TEXT,
      golongan_darah TEXT,
      nomor_ktp TEXT,
      alamat_ktp TEXT,
      kota_ktp TEXT,
      kode_pos_ktp TEXT,
      alamat_domisili TEXT,
      kota_domisili TEXT,
      kode_pos_domisili TEXT,
      status_alamat_domisili TEXT,
      no_telp_rumah TEXT,
      no_hp TEXT,
      status_perkawinan TEXT,
      hobby TEXT,

      -- Family JSONs
      keluarga_kandung TEXT,
      keluarga_menikah TEXT,

      -- Pendidikan JSONs
      pendidikan_formal TEXT,
      pendidikan_non_formal TEXT,

      -- Referensi JSON
      referensi TEXT,

      -- Riwayat Pekerjaan JSON
      riwayat_pekerjaan TEXT,

      -- Informasi Pribadi Lainnya
      alasan_rekrutmen TEXT,
      minat_passion TEXT,
      rencana_3_5_tahun TEXT,
      prestasi TEXT,
      melamar_perusahaan_lain TEXT,
      social_media TEXT,
      riwayat_kesehatan TEXT,

      -- Lain-Lain
      perkiraan_bergabung TEXT,
      gaji_diharapkan TEXT,
      kota_ttd TEXT,
      tanggal_ttd TEXT,
      signature_data TEXT,

      -- Diisi Oleh Pewawancara (Page 5) & HR Kepegawaian
      catatan_wawancara_1 TEXT,
      catatan_wawancara_2 TEXT,
      catatan_wawancara_3 TEXT,
      kesimpulan_status TEXT,
      kesimpulan_catatan TEXT,
      share_token TEXT,

      -- Kolom Kepegawaian & Finansial Baru
      nomor_kk TEXT,
      gaji_pokok TEXT,
      produktivitas TEXT,
      tgl_join TEXT,
      tgl_resign TEXT,
      no_rekening TEXT,
      foto_kandidat TEXT
    )
  `);

  ['share_token', 'nomor_kk', 'gaji_pokok', 'produktivitas', 'tgl_join', 'tgl_resign', 'no_rekening', 'foto_kandidat'].forEach(col => {
    try {
      sqlite.exec(`ALTER TABLE candidates ADD COLUMN ${col} TEXT`);
    } catch (e) {
      // Column already exists
    }
  });

  // Operasional: Berita Acara Pengajuan Barang Table
  db.run(`
    CREATE TABLE IF NOT EXISTS pengajuan_barang (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      no_ba TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      -- A. IDENTITAS PENGAJUAN
      tanggal_pengajuan TEXT,
      outlet_divisi TEXT,
      departemen TEXT,
      pic_pengajuan TEXT,
      prioritas TEXT DEFAULT 'Normal',
      barang_dibutuhkan_paling_lambat TEXT,

      -- B. INFORMASI BARANG
      nama_barang TEXT,
      status_barang TEXT,
      kategori_barang TEXT,
      merk_tipe_model TEXT,
      spesifikasi TEXT,
      lokasi_penempatan TEXT,
      pic_pengguna TEXT,
      jumlah INTEGER DEFAULT 1,
      satuan TEXT,
      harga_satuan_estimasi REAL DEFAULT 0,
      total_estimasi REAL DEFAULT 0,
      link_quotation TEXT,

      -- C. KEBUTUHAN & JUSTIFIKASI PENGAJUAN
      tujuan_kebutuhan TEXT,
      alasan_pengajuan TEXT,
      dampak_operasional TEXT,
      alternatif_dipertimbangkan TEXT,

      -- D. KHUSUS BARANG RUSAK
      kronologi_kerusakan TEXT,
      tgl_kerusakan TEXT,
      jam_kerusakan TEXT,
      diketahui_oleh TEXT,
      kondisi_barang_saat_ini TEXT,
      dampak_kerusakan TEXT,
      tindakan_awal TEXT,
      analisa_penyebab TEXT,
      keterangan_kerusakan TEXT,

      -- E. EVALUASI REPAIR VS REPLACEMENT
      riwayat_repair_status TEXT,
      riwayat_repair_kali TEXT,
      estimasi_biaya_repair REAL DEFAULT 0,
      estimasi_biaya_replacement REAL DEFAULT 0,
      kondisi_umur_barang TEXT,
      rekomendasi TEXT,
      alasan_rekomendasi TEXT,

      -- F. INFORMASI VENDOR & ANGGARAN
      vendor_pembelian TEXT,
      pic_vendor TEXT,
      no_quotation TEXT,
      sumber_budget TEXT,
      ketersediaan_budget TEXT,
      estimasi_waktu_pengadaan TEXT,

      -- G. TREATMENT / TINDAK LANJUT
      treatment TEXT,
      vendor_service TEXT,
      estimasi_harga_service REAL DEFAULT 0,
      target_penyelesaian TEXT,
      keterangan_tindak_lanjut TEXT,

      -- H. DOKUMENTASI & DOKUMEN PENDUKUNG
      lampiran_foto INTEGER DEFAULT 0,
      lampiran_quotation INTEGER DEFAULT 0,
      lampiran_spesifikasi INTEGER DEFAULT 0,
      lampiran_dokumen_lain INTEGER DEFAULT 0,
      link_dokumen_pendukung TEXT,
      catatan_dokumentasi TEXT,
      foto_list TEXT,
      items_json TEXT,

      -- I. PERSETUJUAN / APPROVAL (4 OTORISATOR)
      dibuat_oleh TEXT,
      signature_dibuat TEXT,
      mengetahui_1 TEXT DEFAULT 'Andre Antariza',
      status_mengetahui_1 TEXT DEFAULT 'Pending',
      tgl_mengetahui_1 TEXT,
      mengetahui_2 TEXT DEFAULT 'Chusnaeni M',
      status_mengetahui_2 TEXT DEFAULT 'Pending',
      tgl_mengetahui_2 TEXT,
      mengetahui_3 TEXT DEFAULT 'Setyo Adhi P',
      status_mengetahui_3 TEXT DEFAULT 'Pending',
      tgl_mengetahui_3 TEXT,
      menyetujui_owner TEXT DEFAULT 'Owner',
      status_menyetujui_owner TEXT DEFAULT 'Pending',
      tgl_menyetujui_owner TEXT,
      menyetujui_1 TEXT DEFAULT 'Christian Octo',
      status_approval_1 TEXT DEFAULT 'Pending',
      tgl_approval_1 TEXT,
      menyetujui_2 TEXT DEFAULT 'Aldo Widarta',
      status_approval_2 TEXT DEFAULT 'Pending',
      tgl_approval_2 TEXT,
      status_approval TEXT DEFAULT 'Menunggu Approval',
      catatan_approval TEXT,
      share_token TEXT
    )
  `, () => {
    // Add columns dynamically for existing databases
    const columns = [
      "ALTER TABLE pengajuan_barang ADD COLUMN foto_list TEXT",
      "ALTER TABLE pengajuan_barang ADD COLUMN items_json TEXT",
      "ALTER TABLE pengajuan_barang ADD COLUMN mengetahui_1 TEXT DEFAULT 'Andre Antariza'",
      "ALTER TABLE pengajuan_barang ADD COLUMN status_mengetahui_1 TEXT DEFAULT 'Pending'",
      "ALTER TABLE pengajuan_barang ADD COLUMN tgl_mengetahui_1 TEXT",
      "ALTER TABLE pengajuan_barang ADD COLUMN mengetahui_2 TEXT DEFAULT 'Chusnaeni M'",
      "ALTER TABLE pengajuan_barang ADD COLUMN status_mengetahui_2 TEXT DEFAULT 'Pending'",
      "ALTER TABLE pengajuan_barang ADD COLUMN tgl_mengetahui_2 TEXT",
      "ALTER TABLE pengajuan_barang ADD COLUMN mengetahui_3 TEXT DEFAULT 'Setyo Adhi P'",
      "ALTER TABLE pengajuan_barang ADD COLUMN status_mengetahui_3 TEXT DEFAULT 'Pending'",
      "ALTER TABLE pengajuan_barang ADD COLUMN tgl_mengetahui_3 TEXT",
      "ALTER TABLE pengajuan_barang ADD COLUMN menyetujui_owner TEXT DEFAULT 'Owner'",
      "ALTER TABLE pengajuan_barang ADD COLUMN status_menyetujui_owner TEXT DEFAULT 'Pending'",
      "ALTER TABLE pengajuan_barang ADD COLUMN tgl_menyetujui_owner TEXT"
    ];
    columns.forEach(sql => db.run(sql, () => {}));
  });

  // Operasional: Purchase Orders Table
  db.run(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      no_po TEXT UNIQUE,
      tanggal_po TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      -- Header & Vendor
      vendor_nama TEXT,
      vendor_nama_dagang TEXT,
      perihal TEXT,
      unit_kerja TEXT,
      status_po TEXT DEFAULT 'Reguler / Approved',

      -- Detail Pengiriman & Pembayaran
      lokasi_kirim TEXT,
      tgl_pengiriman TEXT,
      termin_bayar TEXT,
      mata_uang TEXT DEFAULT 'IDR (Rupiah)',

      -- Item Barang (JSON Array)
      items_json TEXT,

      -- Ringkasan Total
      subtotal REAL DEFAULT 0,
      ppn_persen REAL DEFAULT 0,
      ppn_nominal REAL DEFAULT 0,
      diskon_nominal REAL DEFAULT 0,
      total_netto REAL DEFAULT 0,

      -- Syarat & Ketentuan Pengadaan
      catatan_syarat TEXT,

      -- Lembar Otorisasi
      dibuat_oleh_nama TEXT DEFAULT 'ISWANDA ADITYA F.',
      dibuat_oleh_jabatan TEXT DEFAULT 'Procurement / Staff IT',
      signature_dibuat TEXT,

      disetujui_oleh_nama TEXT DEFAULT 'KEN',
      disetujui_oleh_jabatan TEXT DEFAULT 'Finance Manager',

      vendor_konfirmasi_nama TEXT DEFAULT 'PT AGRES INFO TEKNOLOGI',
      vendor_konfirmasi_jabatan TEXT DEFAULT 'Perwakilan Resmi',

      share_token TEXT
    )
  `);

  // Operasional: Surat Tugas & Form Pertanggungjawaban Table
  db.run(`
    CREATE TABLE IF NOT EXISTS surat_tugas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      no_surat TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      -- Header Surat Tugas
      tanggal_surat TEXT,
      kota_surat TEXT DEFAULT 'Semarang',
      pemberi_tugas_nama TEXT,
      pemberi_tugas_jabatan TEXT,

      -- Petugas (JSON Array: [{ no: 1, nama: '', jabatan: '', divisi: '' }])
      petugas_json TEXT,
      divisi_terkait TEXT,

      -- Rincian Penugasan Luar Kota
      lokasi_tujuan TEXT,
      kota_tujuan TEXT,
      tanggal_berangkat TEXT,
      tanggal_kembali TEXT,
      keperluan TEXT,

      -- Otorisasi Pembuat (User: KA Outlet)
      user_pembuat_nama TEXT,
      user_pembuat_jabatan TEXT,
      signature_pembuat TEXT,

      -- Otorisasi Pemeriksa (KA Divisi)
      ka_divisi_nama TEXT,
      ka_divisi_jabatan TEXT,
      status_ka_divisi TEXT DEFAULT 'Pending',
      tgl_ka_divisi TEXT,
      catatan_ka_divisi TEXT,

      -- Otorisasi Penyetuju (GM)
      gm_nama TEXT DEFAULT 'Aldo Widarta - GM',
      status_gm TEXT DEFAULT 'Pending',
      tgl_gm TEXT,
      catatan_gm TEXT,

      -- Status Keseluruhan Surat Tugas
      status_surat TEXT DEFAULT 'Menunggu Approval',

      -- Form Pertanggungjawaban Perjalanan Dinas (LPJ)
      lpj_diisi INTEGER DEFAULT 0,
      lpj_nama TEXT,
      lpj_jabatan_divisi TEXT,
      realisasi_tgl_berangkat TEXT,
      realisasi_jam_berangkat TEXT,
      realisasi_tgl_kembali TEXT,
      realisasi_jam_kembali TEXT,
      realisasi_jumlah_hari INTEGER DEFAULT 0,
      
      -- Pelaksanaan Tugas (JSON Array: [{ tugas: '', hasil: '', status: 'Selesai' }])
      pelaksanaan_tugas_json TEXT,
      bukti_dokumen_keterangan TEXT,
      bukti_dokumen_link TEXT,

      -- Perhitungan Biaya
      uang_dinas_hari INTEGER DEFAULT 0,
      uang_dinas_total REAL DEFAULT 0,
      uang_menginap_malam INTEGER DEFAULT 0,
      uang_menginap_total REAL DEFAULT 0,
      biaya_transportasi REAL DEFAULT 0,
      biaya_penginapan REAL DEFAULT 0,
      biaya_lainnya REAL DEFAULT 0,
      keterangan_biaya_lain TEXT,
      total_biaya REAL DEFAULT 0,

      -- Status LPJ
      status_lpj TEXT DEFAULT 'Draft',

      share_token TEXT
    )
  `);

  // Admin Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nama TEXT,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (!err) {
      db.get('SELECT id FROM users WHERE username = ?', ['admin'], (err, row) => {
        if (!row) {
          const bcrypt = require('bcryptjs');
          const defaultHash = bcrypt.hashSync('admin123', 10);
          db.run('INSERT INTO users (username, password, nama, role) VALUES (?, ?, ?, ?)',
            ['admin', defaultHash, 'Super Administrator', 'superadmin'],
            (err) => {
              if (err) console.error('Error seeding default admin:', err);
              else console.log('Default superadmin account created (username: admin, pass: admin123)');
            }
          );
        } else {
          db.run("UPDATE users SET role = 'superadmin' WHERE username = 'admin'");
        }
      });
      // Seed default operasional user if not exists
      db.get('SELECT id FROM users WHERE username = ?', ['operasional'], (err, row) => {
        if (!row) {
          const bcrypt = require('bcryptjs');
          const opsHash = bcrypt.hashSync('operasional123', 10);
          db.run('INSERT INTO users (username, password, nama, role) VALUES (?, ?, ?, ?)',
            ['operasional', opsHash, 'Admin Operasional', 'operasional'],
            (err) => {
              if (err) console.error('Error seeding operasional admin:', err);
              else console.log('Default operasional account created (username: operasional, pass: operasional123)');
            }
          );
        }
      });
    }
  });
});

module.exports = db;
