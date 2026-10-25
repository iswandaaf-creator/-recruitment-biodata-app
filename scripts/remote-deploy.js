#!/usr/bin/env node
/**
 * scripts/remote-deploy.js
 * Automated SSH Deployment Pipeline to Production VPS (103.119.237.21:20103)
 * Executes atomic DB backup, git sync from main, npm dependency check, and PM2 zero-downtime restart.
 */

const { Client } = require('ssh2');

const VPS_HOST = process.env.VPS_HOST || '103.119.237.21';
const VPS_PORT = parseInt(process.env.VPS_PORT || '20103', 10);
const VPS_USER = process.env.VPS_USER || 'root';
const VPS_PASS = process.env.VPS_PASS || 'Kovgroup26';
const REMOTE_APP_DIR = process.env.REMOTE_APP_DIR || '/var/www/kov-portal';

console.log(`[VPS DEPLOY] Connecting to ${VPS_USER}@${VPS_HOST}:${VPS_PORT}...`);

const conn = new Client();

const remoteCommands = `
set -e
echo ">>> [1/5] Backing up SQLite database..."
mkdir -p ${REMOTE_APP_DIR}/backups
timestamp=$(date +%Y%m%d_%H%M%S)
if [ -d "${REMOTE_APP_DIR}/db" ]; then
  cp -r ${REMOTE_APP_DIR}/db ${REMOTE_APP_DIR}/backups/db_backup_$timestamp
  echo "Backup successfully stored in ${REMOTE_APP_DIR}/backups/db_backup_$timestamp"
fi

echo ">>> [2/5] Fetching and syncing latest code from origin/main..."
cd ${REMOTE_APP_DIR}
git fetch origin main
CURRENT_COMMIT=$(git log -n 1 --oneline origin/main)
echo "Target commit: $CURRENT_COMMIT"
git reset --hard origin/main
git clean -fd -e db/ -e .env -e logs/ -e storage/

echo ">>> [3/5] Verifying production dependencies..."
npm install --omit=dev

echo ">>> [4/5] Reloading PM2 process 'kov-portal'..."
pm2 restart kov-portal --update-env
pm2 save

echo ">>> [5/5] Performing local health probe..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -s -f http://127.0.0.1:3000/health > /dev/null 2>&1; then
    echo "Health check succeeded on attempt $i:"
    curl -s http://127.0.0.1:3000/health
    echo ""
    exit 0
  fi
  echo "Waiting for app to initialize (attempt $i/10)..."
  sleep 2
done
echo "Health check failed after 10 attempts."
exit 1
`;

conn.on('ready', () => {
  console.log('[VPS DEPLOY] SSH connection established successfully.');
  console.log('[VPS DEPLOY] Triggering remote deployment script...');

  conn.exec(remoteCommands, (err, stream) => {
    if (err) {
      console.error('[VPS DEPLOY ERROR] Execution failed:', err.message);
      conn.end();
      process.exit(1);
    }

    stream.on('close', (code, signal) => {
      conn.end();
      if (code === 0) {
        console.log(`[VPS DEPLOY SUCCESS] Remote rollout completed cleanly (exit code: ${code}).`);
        process.exit(0);
      } else {
        console.error(`[VPS DEPLOY FAILED] Remote command failed with exit code: ${code}`);
        process.exit(code || 1);
      }
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
  console.error('[VPS DEPLOY ERROR] SSH Connection failed:', err.message);
  process.exit(1);
}).connect({
  host: VPS_HOST,
  port: VPS_PORT,
  username: VPS_USER,
  password: VPS_PASS,
  readyTimeout: 20000
});
