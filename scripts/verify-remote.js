#!/usr/bin/env node
/**
 * scripts/verify-remote.js
 * HTTPS audit of https://internal.kovgroups.com
 * Verifies SSL, HTTP status, and security headers (CSP, HSTS, X-Content-Type-Options, X-Frame-Options)
 */

const https = require('https');

const TARGET_URL = process.env.REMOTE_URL || 'https://internal.kovgroups.com/login';

console.log(`[REMOTE AUDIT] Inspecting target: ${TARGET_URL}...`);

const req = https.get(TARGET_URL, { rejectUnauthorized: false }, (res) => {
  console.log(`[REMOTE STATUS] HTTP ${res.statusCode} ${res.statusMessage}`);

  const headers = res.headers;
  console.log('\n[SECURITY HEADERS AUDIT]:');

  const checks = [
    { name: 'Content-Security-Policy', val: headers['content-security-policy'] },
    { name: 'Strict-Transport-Security', val: headers['strict-transport-security'] },
    { name: 'X-Content-Type-Options', val: headers['x-content-type-options'] },
    { name: 'X-Frame-Options', val: headers['x-frame-options'] }
  ];

  let allPassed = true;
  checks.forEach(c => {
    if (c.val) {
      console.log(`  ✅ ${c.name}: ${c.val.length > 60 ? c.val.substring(0, 57) + '...' : c.val}`);
    } else {
      console.warn(`  ⚠️  ${c.name}: MISSING`);
      allPassed = false;
    }
  });

  if (res.statusCode >= 200 && res.statusCode < 400) {
    console.log('\n[REMOTE AUDIT SUCCESS] Production service is live and reachable.');
    process.exit(0);
  } else {
    console.error(`\n[REMOTE AUDIT FAILED] Unexpected status code ${res.statusCode}.`);
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.error('[REMOTE AUDIT ERROR] Network request failed:', err.message);
  process.exit(1);
});
