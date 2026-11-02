const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const outDir = path.join(__dirname, '..', 'public', 'screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('1. Capturing Admin Login...');
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(outDir, '01_admin_login.png'), fullPage: true });

  console.log('2. Logging in...');
  await page.type('input[name="username"]', 'admin');
  await page.type('input[name="password"]', 'admin123');
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);

  console.log('3. Capturing Admin Dashboard...');
  await page.screenshot({ path: path.join(outDir, '02_admin_dashboard.png'), fullPage: true });

  console.log('4. Capturing Candidate Detail...');
  try {
    await page.goto('http://localhost:3000/admin/candidate/1', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(outDir, '04_candidate_detail.png'), fullPage: true });
  } catch (e) {
    console.log('Candidate 1 not found or error:', e.message);
  }

  console.log('5. Capturing Candidate Form...');
  await page.goto('http://localhost:3000/?ref=c-kovdemo', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(outDir, '03_candidate_form.png'), fullPage: true });

  await browser.close();
  console.log('All screenshots saved successfully to ' + outDir);
})();
