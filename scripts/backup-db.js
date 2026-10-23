const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const dbPath = path.join(projectRoot, 'db', 'database.sqlite');
const backupDir = path.join(projectRoot, 'backups');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

if (!fs.existsSync(dbPath)) {
  console.error('[BACKUP ERROR] Database file not found at:', dbPath);
  process.exit(1);
}

try {
  console.log('[BACKUP] Initiating SQLite atomic backup for:', dbPath);
  const db = new DatabaseSync(dbPath);

  // 1. Force WAL Checkpoint to flush uncommitted pages into main db file
  console.log('[BACKUP] Running PRAGMA wal_checkpoint(TRUNCATE)...');
  db.exec('PRAGMA wal_checkpoint(TRUNCATE);');

  // 2. Generate timestamped target backup path
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-${timestamp}.sqlite`);

  // 3. VACUUM INTO creates a clean, atomic snapshot
  console.log(`[BACKUP] Executing VACUUM INTO '${backupFile}'...`);
  const vacuumStmt = db.prepare(`VACUUM INTO ?;`);
  vacuumStmt.run(backupFile);
  db.close();

  // 4. Verify integrity of the newly created backup
  console.log('[BACKUP] Verifying integrity of backup file...');
  const verifyDb = new DatabaseSync(backupFile, { readOnly: true });
  const integrityRow = verifyDb.prepare('PRAGMA integrity_check;').get();
  verifyDb.close();

  if (integrityRow && integrityRow.integrity_check === 'ok') {
    const stats = fs.statSync(backupFile);
    console.log(`[BACKUP SUCCESS] Backup created & verified (${(stats.size / 1024).toFixed(2)} KB):`, backupFile);
  } else {
    console.error('[BACKUP FAILED] Integrity check failed:', integrityRow);
    process.exit(1);
  }

  // 5. Rotate backups: retain only latest 20 backups
  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('backup-') && f.endsWith('.sqlite'))
    .map(f => ({ name: f, path: path.join(backupDir, f), time: fs.statSync(path.join(backupDir, f)).mtimeMs }))
    .sort((a, b) => b.time - a.time);

  if (files.length > 20) {
    console.log(`[BACKUP] Rotating backups (keeping 20 newest, removing ${files.length - 20})...`);
    for (let i = 20; i < files.length; i++) {
      fs.unlinkSync(files[i].path);
      console.log(`[BACKUP] Removed old backup: ${files[i].name}`);
    }
  }

  process.exit(0);
} catch (err) {
  console.error('[BACKUP CRITICAL ERROR]:', err);
  process.exit(1);
}
