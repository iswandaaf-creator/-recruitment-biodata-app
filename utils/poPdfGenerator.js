const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const db = require('../db');

const { formatDate, formatDateTime } = require('./dateFormatter');

async function generatePOPDF(poData) {
  const templatePath = path.join(__dirname, '..', 'views', 'po_pdf_template.ejs');

  // Look up master company info matching unit_kerja if exists
  let companyInfo = null;
  if (poData.unit_kerja) {
    try {
      companyInfo = await new Promise((resolve) => {
        db.get('SELECT * FROM companies WHERE LOWER(nama_perusahaan) = LOWER(?) OR LOWER(nama_outlet) = LOWER(?)', 
          [poData.unit_kerja.trim(), poData.unit_kerja.trim()], 
          (err, row) => resolve(row || null)
        );
      });
    } catch (e) {
      companyInfo = null;
    }
  }

  // Read KOV Logo as Base64 (prefer company custom logo if exists)
  let logoBase64 = '';
  let customLogoPath = null;
  if (companyInfo && companyInfo.logo_url) {
    const candidatePath = path.join(__dirname, '..', 'public', companyInfo.logo_url.replace(/^\//, ''));
    if (fs.existsSync(candidatePath)) {
      customLogoPath = candidatePath;
    }
  }

  const logoPath = customLogoPath || path.join(__dirname, '..', 'public', 'logo_kov_2.jpg');
  const fallbackLogo = path.join(__dirname, '..', 'public', 'logo_kov_hijau.png');
  const targetLogo = fs.existsSync(logoPath) ? logoPath : fallbackLogo;
  if (fs.existsSync(targetLogo)) {
    const ext = path.extname(targetLogo).toLowerCase();
    const mime = ext === '.png' ? 'image/png' : (ext === '.svg' ? 'image/svg+xml' : 'image/jpeg');
    logoBase64 = `data:${mime};base64,` + fs.readFileSync(targetLogo).toString('base64');
  }

  // Parse items JSON safely if passed as string
  const po = {
    ...poData,
    company_addr: companyInfo ? (companyInfo.alamat + (companyInfo.telepon ? ` | Telp: ${companyInfo.telepon}` : '')) : null,
    items: typeof poData.items_json === 'string' ? JSON.parse(poData.items_json || '[]') : (poData.items || [])
  };

  const html = await ejs.renderFile(templatePath, { po, logoBase64, formatDate, formatDateTime });

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

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '10mm',
      bottom: '10mm',
      left: '12mm',
      right: '12mm'
    }
  });

  await browser.close();
  return pdfBuffer;
}

module.exports = { generatePOPDF };
