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
      no_rekening TEXT
    )
  `);

  ['share_token', 'nomor_kk', 'gaji_pokok', 'produktivitas', 'tgl_join', 'tgl_resign', 'no_rekening'].forEach(col => {
    try {
      sqlite.exec(`ALTER TABLE candidates ADD COLUMN ${col} TEXT`);
    } catch (e) {
      // Column already exists
    }
  });

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
    }
  });
});

module.exports = db;
