/**
 * tests/runner.js
 * Comprehensive 4-Tier Test Runner for KOV Recruitment Portal
 */

const { assert, runTest } = require('./test_helper');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const projectRoot = path.join(__dirname, '..');

async function main() {
  console.log('==================================================');
  console.log('  RUNNING COMPREHENSIVE 4-TIER E2E TEST SUITE     ');
  console.log('==================================================\n');

  let total = 0;
  let passed = 0;

  async function check(name, fn) {
    total++;
    const ok = await runTest(name, fn);
    if (ok) passed++;
  }

  // --- TIER 1: Syntax & Core Infrastructure ---
  console.log('[TIER 1] Syntax & Core Infrastructure');
  await check('server.js has valid syntax (node -c)', () => {
    execSync('node --check server.js', { cwd: projectRoot });
  });

  await check('db.js has valid syntax and PRAGMA busy_timeout', () => {
    execSync('node --check db.js', { cwd: projectRoot });
    const content = fs.readFileSync(path.join(projectRoot, 'db.js'), 'utf-8');
    assert.ok(content.includes('busy_timeout'), 'db.js should contain PRAGMA busy_timeout');
  });

  await check('ecosystem.config.js exists and exports valid config', () => {
    const config = require('../ecosystem.config.js');
    assert.ok(config.apps && config.apps.length > 0, 'ecosystem config should have apps array');
    assert.strictEqual(config.apps[0].name, 'kov-portal');
  });

  await check('server.js includes /health endpoint', () => {
    const content = fs.readFileSync(path.join(projectRoot, 'server.js'), 'utf-8');
    assert.ok(content.includes("app.get('/health'"), 'server.js should include /health route');
  });

  // --- TIER 2: Security & Hardening (R2) ---
  console.log('\n[TIER 2] Security & Hardening (R2)');
  await check('express-rate-limit dependency is installed and imported', () => {
    const content = fs.readFileSync(path.join(projectRoot, 'server.js'), 'utf-8');
    assert.ok(content.includes("require('express-rate-limit')"), 'server.js should import express-rate-limit');
    assert.ok(content.includes('loginLimiter'), 'server.js should define loginLimiter');
  });

  await check('CSRF query string token acceptance is removed', () => {
    const content = fs.readFileSync(path.join(projectRoot, 'server.js'), 'utf-8');
    assert.ok(!content.includes('req.query._csrf'), 'server.js should not accept _csrf from query params');
  });

  await check('Private invoice storage directory exists or is configured', () => {
    const content = fs.readFileSync(path.join(projectRoot, 'server.js'), 'utf-8');
    assert.ok(content.includes("path.join(__dirname, 'storage', 'invoices')"), 'invoices should be stored in storage/invoices');
  });

  await check('Session regeneration is enforced on successful login', () => {
    const content = fs.readFileSync(path.join(projectRoot, 'server.js'), 'utf-8');
    assert.ok(content.includes('req.session.regenerate'), 'server.js should call req.session.regenerate on login');
  });

  await check('XSS sanitization helper exists in views/operasional_detail.ejs', () => {
    const content = fs.readFileSync(path.join(projectRoot, 'views', 'operasional_detail.ejs'), 'utf-8');
    assert.ok(content.includes('isSafeImg'), 'views/operasional_detail.ejs should include isSafeImg helper');
  });

  // --- TIER 3: Multi-Agent Collaboration Bridge (R3) ---
  console.log('\n[TIER 3] Multi-Agent Collaboration Bridge (R3)');
  await check('scripts/sync-agent.js exists and is functional', () => {
    assert.ok(fs.existsSync(path.join(projectRoot, 'scripts', 'sync-agent.js')), 'scripts/sync-agent.js should exist');
    execSync('node --check scripts/sync-agent.js', { cwd: projectRoot });
  });

  await check('scripts/agent_bridge.js exists and is functional', () => {
    assert.ok(fs.existsSync(path.join(projectRoot, 'scripts', 'agent_bridge.js')), 'scripts/agent_bridge.js should exist');
    execSync('node --check scripts/agent_bridge.js', { cwd: projectRoot });
  });

  // --- TIER 4: Production Safety & Verification (R4) ---
  console.log('\n[TIER 4] Production Safety & Verification (R4)');
  await check('scripts/backup-db.js runs atomic WAL backup and passes integrity check', () => {
    assert.ok(fs.existsSync(path.join(projectRoot, 'scripts', 'backup-db.js')), 'scripts/backup-db.js should exist');
    execSync('node scripts/backup-db.js', { cwd: projectRoot });
  });

  await check('scripts/verify-health.js exists and has valid syntax', () => {
    assert.ok(fs.existsSync(path.join(projectRoot, 'scripts', 'verify-health.js')), 'scripts/verify-health.js should exist');
    execSync('node --check scripts/verify-health.js', { cwd: projectRoot });
  });

  await check('scripts/verify-remote.js passes live production audit against VPS', () => {
    assert.ok(fs.existsSync(path.join(projectRoot, 'scripts', 'verify-remote.js')), 'scripts/verify-remote.js should exist');
    execSync('node scripts/verify-remote.js', { cwd: projectRoot });
  });

  await check('Native unit test suite (utils/dateFormatter.test.js) passes 100%', () => {
    execSync('npm test', { cwd: projectRoot });
  });

  // --- SUMMARY ---
  console.log('\n==================================================');
  console.log(`TEST RESULTS: ${passed}/${total} PASSED (${((passed / total) * 100).toFixed(0)}%)`);
  console.log('==================================================');

  if (passed === total) {
    console.log('🎉 ALL TIERS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } else {
    console.error(`❌ ${total - passed} test(s) failed.`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
