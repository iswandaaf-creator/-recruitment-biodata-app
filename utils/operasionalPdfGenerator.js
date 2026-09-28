const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

async function generateOperasionalPDF(baData) {
  const templatePath = path.join(__dirname, '..', 'views', 'operasional_ba_pdf.ejs');

  const html = await ejs.renderFile(templatePath, { ba: baData });

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

module.exports = { generateOperasionalPDF };
