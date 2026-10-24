#!/usr/bin/env node
/**
 * scripts/deploy.js
 * Deployment orchestrator pipeline:
 * 1. Pre-deploy DB & .env backup
 * 2. Syntax validation
 * 3. Git sync & merge validation
 * 4. PM2 / VPS rollout trigger
 * 5. Health verification & remote availability
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.join(__dirname, '..');

function step(num, title, fn) {
  console.log(`\n[STEP ${num}] ${title}...`);
  try {
    fn();
    console.log(`[STEP ${num} OK] Completed successfully.`);
  } catch (err) {
    console.error(`[STEP ${num} FAILED]:`, err.message);
    process.exit(1);
  }
}

// 1. Pre-deploy backup
step(1, 'Executing atomic database backup', () => {
  execSync('node scripts/backup-db.js', { cwd: projectRoot, stdio: 'inherit' });
});

// 2. Syntax & test suite verification
step(2, 'Validating code syntax & running tests', () => {
  execSync('node --check server.js', { cwd: projectRoot, stdio: 'inherit' });
  execSync('node --check db.js', { cwd: projectRoot, stdio: 'inherit' });
  execSync('npm test', { cwd: projectRoot, stdio: 'inherit' });
});

// 3. Multi-agent sync status
step(3, 'Checking multi-agent collaboration status', () => {
  execSync('node scripts/agent_bridge.js status', { cwd: projectRoot, stdio: 'inherit' });
});

// 4. Remote VPS automated rollout via SSH
step(4, 'Executing remote VPS deployment via SSH (103.119.237.21)', () => {
  execSync('node scripts/remote-deploy.js', { cwd: projectRoot, stdio: 'inherit' });
});

// 5. Remote availability check
step(5, 'Auditing production VPS availability & security headers', () => {
  execSync('node scripts/verify-remote.js', { cwd: projectRoot, stdio: 'inherit' });
});

console.log('\n==================================================');
console.log('🎉 DEPLOYMENT VERIFICATION PIPELINE PASSED 100%!');
console.log('==================================================');
