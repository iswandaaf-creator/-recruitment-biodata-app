const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

async function generateSuratTugasPDF(stData) {
  const templatePath = path.join(__dirname, '..', 'views', 'surat_tugas_pdf_template.ejs');

  // Read KOV Logo as Base64
  let logoBase64 = '';
  const logoPath = path.join(__dirname, '..', 'public', 'logo_kov_hijau.png');
  if (fs.existsSync(logoPath)) {
    logoBase64 = 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64');
  }

  // Parse JSON data safely
  let petugas = [];
  if (typeof stData.petugas_json === 'string' && stData.petugas_json) {
    try { petugas = JSON.parse(stData.petugas_json); } catch (e) { petugas = []; }
  } else if (Array.isArray(stData.petugas)) {
    petugas = stData.petugas;
  }

  let pelaksanaan_tugas = [];
  if (typeof stData.pelaksanaan_tugas_json === 'string' && stData.pelaksanaan_tugas_json) {
    try { pelaksanaan_tugas = JSON.parse(stData.pelaksanaan_tugas_json); } catch (e) { pelaksanaan_tugas = []; }
  } else if (Array.isArray(stData.pelaksanaan_tugas)) {
    pelaksanaan_tugas = stData.pelaksanaan_tugas;
  }

  const st = {
    ...stData,
    petugas,
    pelaksanaan_tugas
  };

  const html = await ejs.renderFile(templatePath, { st, logoBase64 });

  let launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  };

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  } else if (process.platform === 'win32') {
    const possiblePaths = [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        launchOptions.executablePath = p;
        break;
      }
    }
  } else if (fs.existsSync('/usr/bin/chromium')) {
    launchOptions.executablePath = '/usr/bin/chromium';
  } else if (fs.existsSync('/usr/bin/chromium-browser')) {
    launchOptions.executablePath = '/usr/bin/chromium-browser';
  }

  let browser;
  try {
    browser = await puppeteer.launch(launchOptions);
  } catch (err) {
    delete launchOptions.executablePath;
    browser = await puppeteer.launch(launchOptions);
  }

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '12mm',
        right: '15mm',
        bottom: '12mm',
        left: '15mm'
      }
    });

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}

module.exports = { generateSuratTugasPDF };
