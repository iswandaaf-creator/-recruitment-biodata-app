#!/usr/bin/env node
/**
 * scripts/verify-health.js
 * Polls local health check endpoint http://127.0.0.1:3000/health with retries
 */

const http = require('http');

const HEALTH_URL = process.env.HEALTH_URL || 'http://127.0.0.1:3000/health';
const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 1000;

function checkHealth(attempt = 1) {
  console.log(`[HEALTH CHECK] Attempt ${attempt}/${MAX_RETRIES} to ${HEALTH_URL}...`);

  const req = http.get(HEALTH_URL, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const json = JSON.parse(data);
          console.log('[HEALTH OK] Service is healthy:', json);
          process.exit(0);
        } catch (e) {
          console.log('[HEALTH OK] Service returned 200 but not JSON:', data);
          process.exit(0);
        }
      } else {
        console.warn(`[HEALTH WARN] Received HTTP status ${res.statusCode}.`);
        retry(attempt);
      }
    });
  });

  req.on('error', (err) => {
    console.warn(`[HEALTH WARN] Connection failed: ${err.message}`);
    retry(attempt);
  });
}

function retry(attempt) {
  if (attempt >= MAX_RETRIES) {
    console.error(`[HEALTH FAIL] Max retries (${MAX_RETRIES}) reached. Service is not healthy.`);
    process.exit(1);
  }
  setTimeout(() => checkHealth(attempt + 1), RETRY_DELAY_MS);
}

checkHealth();
