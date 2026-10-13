const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');

// Shared Tesseract Worker
let cachedWorker = null;

async function getTesseractWorker() {
  if (!cachedWorker) {
    cachedWorker = await Tesseract.createWorker('eng');
  }
  return cachedWorker;
}

/**
 * Intelligent categorization of IT items based on keywords
 */
function categorizeITItem(itemName = '') {
  const name = itemName.toLowerCase();

  // Jaringan & Network
  if (
    name.includes('kabel') && (name.includes('utp') || name.includes('lan') || name.includes('cat5') || name.includes('cat6') || name.includes('fiber') || name.includes('patch')) ||
    name.includes('router') || name.includes('mikrotik') || name.includes('switch') || name.includes('hub') ||
    name.includes('rj45') || name.includes('crimping') || name.includes('access point') || name.includes('wifi') ||
    name.includes('modem') || name.includes('lan card') || name.includes('ethernet') || name.includes('antena') ||
    name.includes('server') || name.includes('rack') || name.includes('patch panel') || name.includes('barrel')
  ) {
    return 'Jaringan & Network';
  }

  // Hardware & Komputer
  if (
    name.includes('ssd') || name.includes('nvme') || name.includes('harddisk') || name.includes('hdd') ||
    name.includes('ram') || name.includes('sodimm') || name.includes('ddr') || name.includes('processor') ||
    name.includes('intel') || name.includes('amd') || name.includes('motherboard') || name.includes('mobo') ||
    name.includes('power supply') || name.includes('psu') || name.includes('casing') || name.includes('pc') ||
    name.includes('komputer') || name.includes('laptop') || name.includes('monitor') || name.includes('keyboard') ||
    name.includes('mouse') || name.includes('printer') || name.includes('scanner') || name.includes('thermal printer')
  ) {
    return 'Hardware & Komputer';
  }

  // CCTV & Keamanan
  if (
    name.includes('cctv') || name.includes('dvr') || name.includes('nvr') || name.includes('kamera') ||
    name.includes('camera') || name.includes('ip cam') || name.includes('bnc') || name.includes('adaptor cctv') ||
    name.includes('coaxial') || name.includes('balun')
  ) {
    return 'CCTV & Keamanan';
  }

  // Software & Lisensi
  if (
    name.includes('lisensi') || name.includes('license') || name.includes('windows') || name.includes('office') ||
    name.includes('antivirus') || name.includes('kaspersky') || name.includes('eset') || name.includes('pos software') ||
    name.includes('domain') || name.includes('hosting') || name.includes('subscription')
  ) {
    return 'Software & Lisensi';
  }

  // Perawatan & Service
  if (
    name.includes('thermal paste') || name.includes('pasta') || name.includes('service') || name.includes('servis') ||
    name.includes('perawatan') || name.includes('cleaning') || name.includes('pembersihan') || name.includes('blower') ||
    name.includes('kuas') || name.includes('baterai cmos') || name.includes('obeng') || name.includes('pasta pendingin')
  ) {
    return 'Perawatan & Service';
  }

  // Aksesoris & Peripheral
  if (
    name.includes('kabel hdmi') || name.includes('hdmi') || name.includes('vga') || name.includes('converter') ||
    name.includes('otg') || name.includes('flashdisk') || name.includes('usb') || name.includes('hub usb') ||
    name.includes('kabel power') || name.includes('colokan') || name.includes('stop kontak') || name.includes('uticon') ||
    name.includes('roll kabel') || name.includes('headset') || name.includes('speaker') || name.includes('mousepad') ||
    name.includes('kabel sata') || name.includes('card reader')
  ) {
    return 'Aksesoris & Peripheral';
  }

  return 'Operasional & Lainnya';
}

/**
 * Clean & Parse Indonesian/Standard dates into YYYY-MM-DD
 */
function parseInvoiceDate(text = '') {
  // Regex 1: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const m1 = text.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/);
  if (m1) {
    const day = m1[1].padStart(2, '0');
    const month = m1[2].padStart(2, '0');
    const year = m1[3];
    return `${year}-${month}-${day}`;
  }

  // Regex 2: YYYY-MM-DD
  const m2 = text.match(/\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/);
  if (m2) {
    const year = m2[1];
    const month = m2[2].padStart(2, '0');
    const day = m2[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Regex 3: DD MMMM YYYY (e.g. 12 Oktober 2026)
  const monthMap = {
    jan: '01', januari: '01', january: '01',
    feb: '02', februari: '02', february: '02',
    mar: '03', maret: '03', march: '03',
    apr: '04', april: '04',
    mei: '05', may: '05',
    jun: '06', juni: '06', june: '06',
    jul: '07', juli: '07', july: '07',
    agu: '08', agustus: '08', aug: '08', august: '08',
    sep: '09', september: '09',
    okt: '10', oktober: '10', oct: '10', october: '10',
    nop: '11', nov: '11', november: '11',
    des: '12', desember: '12', dec: '12', december: '12'
  };

  const m3 = text.match(/\b(\d{1,2})\s+([A-Za-z]{3,10})\s+(\d{4})\b/);
  if (m3) {
    const day = m3[1].padStart(2, '0');
    const monStr = m3[2].toLowerCase();
    const year = m3[3];
    const mon = monthMap[monStr];
    if (mon) {
      return `${year}-${mon}-${day}`;
    }
  }

  // Default to today
  return new Date().toISOString().slice(0, 10);
}

/**
 * Parse numeric amounts from currency strings
 */
function parsePrice(str = '') {
  if (!str) return 0;
  // Remove currency words, spaces, symbols
  const clean = str.replace(/[^\d,\.]/g, '').trim();
  if (!clean) return 0;

  // Handle Indonesian formatting: 1.850.000 or 1,850,000 or 1850000
  if (clean.includes('.') && clean.includes(',')) {
    // 1.850.000,00 -> 1850000
    return Math.round(parseFloat(clean.replace(/\./g, '').replace(',', '.')) || 0);
  }
  if (clean.includes('.')) {
    // Check if dot is thousand separator (e.g. 1.850.000)
    const parts = clean.split('.');
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      return parseInt(clean.replace(/\./g, ''), 10) || 0;
    }
    return Math.round(parseFloat(clean) || 0);
  }
  if (clean.includes(',')) {
    // Check if comma is thousand separator (e.g. 1,850,000)
    const parts = clean.split(',');
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      return parseInt(clean.replace(/,/g, ''), 10) || 0;
    }
    return Math.round(parseFloat(clean.replace(',', '.')) || 0);
  }
  return parseInt(clean, 10) || 0;
}

/**
 * Intelligent Receipt and Invoice Parser from Raw Text
 */
function parseInvoiceText(rawText = '', originalFilename = '') {
  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const fullText = lines.join(' ');
  const lowerText = fullText.toLowerCase();

  // 1. Detect No Transaksi / Invoice / Resi
  let noTransaksi = '';
  // Pattern Tokopedia: INV/20261012/MPL/112233
  const invMatch = fullText.match(/\b(INV\/[A-Za-z0-9\/\-]+)\b/i);
  if (invMatch) {
    noTransaksi = invMatch[1];
  } else {
    // Generic invoice / nota match
    const noMatch = fullText.match(/(?:No\.?|Invoice|Faktur|Nota|Resi|Order ID|No Transaksi)[\s\:\#]*([A-Za-z0-9\-\/]{4,25})/i);
    if (noMatch && !noMatch[1].toLowerCase().includes('telepon') && !noMatch[1].toLowerCase().includes('hp')) {
      noTransaksi = noMatch[1].trim();
    }
  }

  // 2. Detect Tanggal
  const tanggal = parseInvoiceDate(fullText);

  // 3. Detect Outlet KOV (Default Kantor Pusat Semarang)
  let unitOutlet = 'Kantor Pusat Semarang';
  if (lowerText.includes('pekalongan')) unitOutlet = 'Outlet Pekalongan';
  else if (lowerText.includes('rinjani')) unitOutlet = 'Outlet Rinjani';
  else if (lowerText.includes('ngaliyan')) unitOutlet = 'Outlet Ngaliyan';
  else if (lowerText.includes('purwokerto')) unitOutlet = 'Outlet Purwokerto';
  else if (lowerText.includes('solo')) unitOutlet = 'Outlet Solo';
  else if (lowerText.includes('semarang') && !lowerText.includes('pusat')) unitOutlet = 'Outlet Semarang';
  else if (lowerText.includes('kantor pusat') || lowerText.includes('pusat')) unitOutlet = 'Kantor Pusat Semarang';

  // 4. Detect Vendor / Toko
  let vendorToko = '';
  const knownVendors = [
    'Tokopedia', 'Shopee', 'Agres Komputer', 'Bhinneka', 'Gramedia',
    'Mitra IT', 'ELS Computer', 'EnterKomputer', 'Plaza Komputer',
    'Ace Hardware', 'Toko Komputer', 'Official Store', 'Bukalapak', 'Blibli'
  ];

  for (const kv of knownVendors) {
    if (lowerText.includes(kv.toLowerCase())) {
      // Find exact capitalization from known
      vendorToko = kv;
      break;
    }
  }

  if (!vendorToko) {
    // Inspect top 6 lines of invoice
    for (let i = 0; i < Math.min(6, lines.length); i++) {
      const line = lines[i];
      if (
        line.length > 2 &&
        !line.match(/invoice|faktur|nota|kwitansi|struk|receipt|toko|jl\.|jalan|no\.|tanggal/i) &&
        !line.match(/^\d+$/)
      ) {
        vendorToko = line.slice(0, 40);
        break;
      }
    }
  }

  if (!vendorToko) {
    vendorToko = 'Vendor / Toko IT';
  }

  // 5. Detect Metode Bayar
  let metodeBayar = 'Transfer Bank';
  if (lowerText.includes('transfer') || lowerText.includes('bca') || lowerText.includes('mandiri') || lowerText.includes('bni') || lowerText.includes('bri') || lowerText.includes('va ') || lowerText.includes('virtual account')) {
    metodeBayar = 'Transfer Bank';
  } else if (lowerText.includes('tunai') || lowerText.includes('cash') || lowerText.includes('petty cash')) {
    metodeBayar = 'Petty Cash / Tunai';
  } else if (lowerText.includes('qris') || lowerText.includes('gopay') || lowerText.includes('ovo') || lowerText.includes('shopeepay')) {
    metodeBayar = 'E-Wallet / QRIS';
  } else if (lowerText.includes('kartu kredit') || lowerText.includes('credit card') || lowerText.includes('debit')) {
    metodeBayar = 'Kartu Kredit Perusahaan';
  } else if (lowerText.includes('tempo') || lowerText.includes('hutang') || lowerText.includes('credit')) {
    metodeBayar = 'Tempo / Invoice';
  }

  // 6. Detect Status Bayar
  let statusBayar = 'Lunas';
  if (lowerText.includes('pending') || lowerText.includes('menunggu') || lowerText.includes('unpaid')) {
    statusBayar = 'Pending';
  } else if (lowerText.includes('reimburse') || lowerText.includes('talangan')) {
    statusBayar = 'Reimburse';
  }

  // 7. Detect Total Biaya
  let totalBiaya = 0;
  // Search for lines containing Total / Grand Total / Jumlah
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (line.match(/(?:total|grand total|jumlah tagihan|total belanja|total pembayaran|tagihan|netto)/i)) {
      const priceMatches = line.match(/(?:Rp\.?|\b)\s*([0-9\.\,]{4,})/g);
      if (priceMatches && priceMatches.length > 0) {
        for (const pm of priceMatches) {
          const val = parsePrice(pm);
          if (val > totalBiaya && val > 1000) {
            totalBiaya = val;
          }
        }
      }
    }
  }

  // 8. Line Items Extraction (Multi-Item)
  const items = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Skip empty or header/footer noise lines
    if (
      !line ||
      line.match(/^(invoice|faktur|tanggal|tgl|alamat|pembayaran|subtotal|ppn|pajak|ongkir|ongkos|diskon|total|kembalian|kasir|terima kasih|halaman|telp|whatsapp)/i)
    ) {
      continue;
    }

    // Strip leading number bullet (e.g., "1. ", "2) ", "- ")
    line = line.replace(/^[-*•\d]+[\.\)\-]\s*/, '').trim();

    // Case 1: Line with "=" sign, e.g. "SSD NVMe 512GB Kingston 2 Pcs x 450.000 = 900.000"
    if (line.includes('=')) {
      const parts = line.split('=');
      const leftPart = parts[0].trim();
      const subtotalVal = parsePrice(parts[1].trim());

      // Check leftPart for quantity and unit price, prioritizing explicit "x" separator
      const qtyMatch = leftPart.match(/(\d+)\s*(pcs|unit|roll|rol|box|meter|set|paket|btl)?\s*(?:x|\*|\@)\s*(?:Rp\.?|\b)\s*([0-9\.\,]{3,})/i) ||
                       leftPart.match(/(\d+)\s*(pcs|unit|roll|rol|box|meter|set|paket|btl)\s*(?:Rp\.?|\b)\s*([0-9\.\,]{3,})/i);
      let qty = 1;
      let unitPrice = subtotalVal;
      let nama = leftPart;
      let satuan = 'Unit';

      if (qtyMatch) {
        qty = parseInt(qtyMatch[1], 10) || 1;
        const u = qtyMatch[2] ? qtyMatch[2].toLowerCase() : '';
        if (u.includes('roll') || u.includes('rol')) satuan = 'Roll';
        else if (u.includes('box')) satuan = 'Box';
        else if (u.includes('meter')) satuan = 'Meter';
        else if (u.includes('set') || u.includes('paket')) satuan = 'Paket';
        else if (u.includes('pcs') || u.includes('btl')) satuan = 'Pcs';

        unitPrice = parsePrice(qtyMatch[3]) || (subtotalVal > 0 ? Math.round(subtotalVal / qty) : 0);
        nama = leftPart.replace(qtyMatch[0], '').replace(/[x\*]\s*$/, '').trim();
      } else {
        nama = leftPart.replace(/(?:Rp\.?|\b)\s*[0-9\.\,]+$/, '').trim();
      }

      if (nama.length >= 3 && (subtotalVal > 0 || unitPrice > 0)) {
        items.push({
          nama,
          kategori: categorizeITItem(nama),
          qty,
          satuan,
          harga: unitPrice > 0 ? unitPrice : subtotalVal,
          subtotal: subtotalVal > 0 ? subtotalVal : (qty * unitPrice)
        });
        continue;
      }
    }

    // Case 2: Line with "x" and prices, e.g. "2 Pcs x 450.000" or "Kabel LAN 1 Roll x Rp 850.000"
    const xMatch = line.match(/^(.+?)\s+(\d+)\s*(pcs|unit|roll|rol|box|meter|m|set|paket)?\s*(?:x|\*|\@)\s*(?:Rp\.?|\b)\s*([0-9\.\,]{4,})/i);
    if (xMatch) {
      const nama = xMatch[1].trim();
      const qty = parseInt(xMatch[2], 10) || 1;
      const unitPrice = parsePrice(xMatch[4]);
      let satuan = 'Unit';
      const u = xMatch[3] ? xMatch[3].toLowerCase() : '';
      if (u.includes('roll') || u.includes('rol')) satuan = 'Roll';
      else if (u.includes('box')) satuan = 'Box';
      else if (u.includes('pcs')) satuan = 'Pcs';
      else if (u.includes('meter') || u === 'm') satuan = 'Meter';

      if (nama.length >= 3 && unitPrice > 0) {
        items.push({
          nama,
          kategori: categorizeITItem(nama),
          qty,
          satuan,
          harga: unitPrice,
          subtotal: qty * unitPrice
        });
        continue;
      }
    }

    // Case 3: Leading quantity, e.g. "2 x SSD NVMe 512GB Kingston Rp 450.000"
    const leadQtyMatch = line.match(/^(\d+)\s*(?:x|pcs|unit|roll|box)?\s+(.+?)(?:Rp\.?|\b)\s*([0-9\.\,]{4,})$/i);
    if (leadQtyMatch) {
      const qty = parseInt(leadQtyMatch[1], 10) || 1;
      const nama = leadQtyMatch[2].trim();
      const price = parsePrice(leadQtyMatch[3]);
      if (nama.length >= 3 && price > 0 && !nama.match(/total|subtotal|kembali/i)) {
        items.push({
          nama,
          kategori: categorizeITItem(nama),
          qty,
          satuan: 'Unit',
          harga: price,
          subtotal: qty * price
        });
        continue;
      }
    }

    // Case 4: Product name followed by Price at end of line
    // e.g. "Mikrotik RB750Gr3 hEX  Rp 850.000"
    const pMatch = line.match(/(.+?)(?:Rp\.?|\b)\s*([0-9\.\,]{4,})$/);
    if (pMatch) {
      const potentialName = pMatch[1].trim();
      const price = parsePrice(pMatch[2]);
      if (
        potentialName.length >= 4 &&
        price > 1000 &&
        !potentialName.match(/total|subtotal|ppn|biaya|kembali|cash|tunai|tagihan/i)
      ) {
        let qty = 1;
        let satuan = 'Unit';
        const qMatch = potentialName.match(/(\d+)\s*(pcs|unit|roll|box|meter)/i);
        if (qMatch) {
          qty = parseInt(qMatch[1], 10) || 1;
          const u = qMatch[2].toLowerCase();
          if (u.includes('roll')) satuan = 'Roll';
          else if (u.includes('box')) satuan = 'Box';
          else if (u.includes('pcs')) satuan = 'Pcs';
          else if (u.includes('meter')) satuan = 'Meter';
        }

        const cleanName = potentialName.replace(/\d+\s*(?:pcs|unit|roll|box|meter)/i, '').trim();

        items.push({
          nama: cleanName,
          kategori: categorizeITItem(cleanName),
          qty,
          satuan,
          harga: price,
          subtotal: qty * price
        });
      }
    }
  }

  // Fallback: If no line items cleanly parsed, create 1 comprehensive item from invoice summary
  if (items.length === 0) {
    let fallbackName = 'Pembelian & Kebutuhan IT';
    // Try to find a line with product name keywords
    for (const l of lines) {
      if (
        (l.match(/kabel|lan|switch|router|mikrotik|ssd|ram|komputer|cctv|cat6|keyboard|mouse|hdmi/i)) &&
        !l.match(/invoice|faktur|toko|tgl|total/i)
      ) {
        fallbackName = l.replace(/^[-*•\d\.\)]+\s*/, '').slice(0, 60).trim();
        break;
      }
    }

    const calculatedTotal = totalBiaya > 0 ? totalBiaya : 0;
    items.push({
      nama: fallbackName,
      kategori: categorizeITItem(fallbackName),
      qty: 1,
      satuan: 'Unit',
      harga: calculatedTotal,
      subtotal: calculatedTotal
    });
  }

  // Calculate or verify totalBiaya
  let sumSubtotal = items.reduce((acc, it) => acc + (it.subtotal || 0), 0);
  if (totalBiaya <= 0 || (sumSubtotal > 0 && Math.abs(totalBiaya - sumSubtotal) > totalBiaya * 0.5)) {
    totalBiaya = sumSubtotal;
  }

  // Generate Keterangan
  const keterangan = items.length > 1
    ? `Pembelian ${items[0].nama} dan ${items.length - 1} item lainnya di ${vendorToko}`
    : `Pembelian ${items[0].nama} di ${vendorToko}`;

  return {
    no_transaksi: noTransaksi,
    tanggal,
    unit_outlet: unitOutlet,
    vendor_toko: vendorToko,
    metode_bayar: metodeBayar,
    status_bayar: statusBayar,
    keterangan,
    total_biaya: totalBiaya,
    items
  };
}

/**
 * Main OCR & Document Processor (100% Offline & Local, ZERO API Key required!)
 */
async function scanInvoiceDocument(filePath, mimeType = '', originalFilename = '') {
  if (!fs.existsSync(filePath)) {
    throw new Error('File invoice tidak ditemukan di server.');
  }

  let extractedText = '';
  const isPdf = mimeType.includes('pdf') || filePath.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      extractedText = pdfData.text || '';
    } catch (pdfErr) {
      console.warn('PDF Parse error, attempting OCR:', pdfErr.message);
    }
  }

  // If text is still empty or it's an image file: Run Tesseract OCR locally
  if (!extractedText || extractedText.trim().length < 15) {
    try {
      const worker = await getTesseractWorker();
      const ocrResult = await worker.recognize(filePath);
      extractedText = (ocrResult && ocrResult.data && ocrResult.data.text) ? ocrResult.data.text : '';
    } catch (ocrErr) {
      console.error('Tesseract OCR error:', ocrErr);
      throw new Error('Gagal membaca gambar nota: ' + ocrErr.message);
    }
  }

  if (!extractedText || extractedText.trim().length === 0) {
    throw new Error('Tidak ada teks yang dapat dikenali dari file invoice yang di-upload.');
  }

  // Parse structured data from extracted text
  const structuredData = parseInvoiceText(extractedText, originalFilename);
  return structuredData;
}

module.exports = {
  scanInvoiceDocument,
  parseInvoiceText,
  categorizeITItem
};
