const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const { formatDate, formatDateTime } = require('./dateFormatter');

async function generateITPDF(records, filterOptions = {}) {
  const templatePath = path.join(__dirname, '..', 'views', 'it_rekap_pdf.ejs');

  // Parse filter options
  const outletName = (typeof filterOptions === 'string') 
    ? filterOptions 
    : (filterOptions.outlet || 'Semua Outlet');
  const startDate = filterOptions.start_date || '';
  const endDate = filterOptions.end_date || '';
  const keyword = filterOptions.keyword || filterOptions.search || filterOptions.item || '';
  const kategori = filterOptions.kategori || '';
  const vendor = filterOptions.vendor || '';
  const vendorLabel = vendor ? vendor : 'Semua Vendor';

  // Periode Label
  let periodeLabel = 'Semua Periode';
  if (startDate && endDate) {
    periodeLabel = `${formatDate(startDate)} s/d ${formatDate(endDate)}`;
  } else if (startDate) {
    periodeLabel = `Mulai ${formatDate(startDate)}`;
  } else if (endDate) {
    periodeLabel = `Hingga ${formatDate(endDate)}`;
  }

  // Filter Item Label
  let filterItemLabel = 'Semua Item';
  if (keyword && kategori) {
    filterItemLabel = `"${keyword}" (${kategori})`;
  } else if (keyword) {
    filterItemLabel = `Kata Kunci: "${keyword}"`;
  } else if (kategori) {
    filterItemLabel = `Kategori: ${kategori}`;
  }

  // Filter records by vendor if provided
  if (vendor) {
    records = records.filter(nota => (nota.vendor_toko || '').toLowerCase().includes(vendor.toLowerCase()));
  }

  // Read KOV Logo as Base64
  let logoBase64 = '';
  const logoPath = path.join(__dirname, '..', 'public', 'logo_kov_2.jpg');
  const fallbackLogo = path.join(__dirname, '..', 'public', 'logo_kov_hijau.png');
  const targetLogo = fs.existsSync(logoPath) ? logoPath : fallbackLogo;
  if (fs.existsSync(targetLogo)) {
    const mime = targetLogo.endsWith('.png') ? 'image/png' : 'image/jpeg';
    logoBase64 = `data:${mime};base64,` + fs.readFileSync(targetLogo).toString('base64');
  }

  // Flatten & filter items for each nota
  const flatItems = [];
  let totalBiaya = 0;

  records.forEach(nota => {
    let items = [];
    if (nota.items_json) {
      try {
        items = JSON.parse(nota.items_json);
      } catch (e) {
        items = [];
      }
    }

    if (!items || items.length === 0) {
      items = [{
        nama: nota.nama_barang || '-',
        kategori: nota.kategori || 'Operasional & Lainnya',
        qty: Number(nota.qty || 1),
        satuan: nota.satuan || 'Unit',
        harga: Number(nota.harga_satuan || 0),
        subtotal: Number(nota.total_biaya || 0)
      }];
    }

    // Filter sub-items if keyword or kategori is specified
    if (keyword || kategori) {
      const filteredSub = items.filter(it => {
        const matchKw = !keyword || (
          (it.nama || '').toLowerCase().includes(keyword.toLowerCase()) ||
          (it.kategori || '').toLowerCase().includes(keyword.toLowerCase()) ||
          (nota.vendor_toko || '').toLowerCase().includes(keyword.toLowerCase()) ||
          (nota.no_transaksi || '').toLowerCase().includes(keyword.toLowerCase())
        );
        const matchKat = !kategori || (it.kategori === kategori);
        return matchKw && matchKat;
      });

      if (filteredSub.length > 0) {
        items = filteredSub;
      }
    }

    items.forEach(it => {
      const q = Number(it.qty || 1);
      const h = Number(it.harga || it.harga_satuan || 0);
      const subt = Number(it.subtotal || (q * h));
      totalBiaya += subt;

      flatItems.push({
        tanggal: formatDate(nota.tanggal),
        no_transaksi: nota.no_transaksi || '-',
        unit_outlet: nota.unit_outlet || '-',
        vendor_toko: nota.vendor_toko || '-',
        metode_bayar: nota.metode_bayar || '-',
        status_bayar: nota.status_bayar || 'Lunas',
        bukti_transaksi: nota.bukti_transaksi || '',
        nama_barang: it.nama || it.nama_barang || '-',
        kategori: it.kategori || nota.kategori || 'Operasional & Lainnya',
        qty: q,
        satuan: it.satuan || 'Unit',
        harga_satuan: h,
        subtotal: subt
      });
    });
  });

  const html = await ejs.renderFile(templatePath, {
    records,
    flatItems,
    outletName,
    vendorLabel,
    periodeLabel,
    filterItemLabel,
    totalBiaya,
    logoBase64,
    formatDate,
    formatDateTime
  });

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
      landscape: true,
      printBackground: true,
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '12mm',
        right: '12mm'
      }
    });

    return pdfBuffer;
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { generateITPDF };
