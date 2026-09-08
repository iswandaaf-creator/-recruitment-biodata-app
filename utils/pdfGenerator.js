const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

async function generatePDF(candidateData) {
  const templatePath = path.join(__dirname, '..', 'views', 'pdf_template.ejs');
  
  // Parse JSON fields safely
  const candidate = {
    ...candidateData,
    keluarga_kandung: typeof candidateData.keluarga_kandung === 'string' ? JSON.parse(candidateData.keluarga_kandung || '{}') : candidateData.keluarga_kandung,
    keluarga_menikah: typeof candidateData.keluarga_menikah === 'string' ? JSON.parse(candidateData.keluarga_menikah || '{}') : candidateData.keluarga_menikah,
    pendidikan_formal: typeof candidateData.pendidikan_formal === 'string' ? JSON.parse(candidateData.pendidikan_formal || '{}') : candidateData.pendidikan_formal,
    pendidikan_non_formal: typeof candidateData.pendidikan_non_formal === 'string' ? JSON.parse(candidateData.pendidikan_non_formal || '[]') : candidateData.pendidikan_non_formal,
    referensi: typeof candidateData.referensi === 'string' ? JSON.parse(candidateData.referensi || '[]') : candidateData.referensi,
    riwayat_pekerjaan: typeof candidateData.riwayat_pekerjaan === 'string' ? JSON.parse(candidateData.riwayat_pekerjaan || '[]') : candidateData.riwayat_pekerjaan,
    social_media: typeof candidateData.social_media === 'string' ? JSON.parse(candidateData.social_media || '{}') : candidateData.social_media,
    catatan_wawancara_1: typeof candidateData.catatan_wawancara_1 === 'string' ? JSON.parse(candidateData.catatan_wawancara_1 || '{}') : candidateData.catatan_wawancara_1,
    catatan_wawancara_2: typeof candidateData.catatan_wawancara_2 === 'string' ? JSON.parse(candidateData.catatan_wawancara_2 || '{}') : candidateData.catatan_wawancara_2,
    catatan_wawancara_3: typeof candidateData.catatan_wawancara_3 === 'string' ? JSON.parse(candidateData.catatan_wawancara_3 || '{}') : candidateData.catatan_wawancara_3
  };

  const html = await ejs.renderFile(templatePath, { candidate });

  let launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  };

  // Check for environment variable, Linux Chromium, or Windows Edge/Chrome
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

module.exports = { generatePDF };
