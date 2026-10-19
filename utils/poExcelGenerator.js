const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const { formatDate, formatDateTime } = require('./dateFormatter');

async function generatePOExcel(records) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Purchase Orders');

  // Embed KOV Logo Image if exists
  const logoPath = path.join(__dirname, '..', 'public', 'logo_kov_2.jpg');
  const fallbackLogo = path.join(__dirname, '..', 'public', 'logo_kov_hijau.png');
  const targetLogo = fs.existsSync(logoPath) ? logoPath : fallbackLogo;
  if (fs.existsSync(targetLogo)) {
    const ext = targetLogo.endsWith('.png') ? 'png' : 'jpeg';
    const logoId = workbook.addImage({
      buffer: fs.readFileSync(targetLogo),
      extension: ext,
    });
    worksheet.addImage(logoId, {
      tl: { col: 0, row: 0 },
      ext: { width: 44, height: 44 }
    });
  }

  // Row 1: Document Title Header
  worksheet.mergeCells('B1:N1');
  const titleCell = worksheet.getCell('B1');
  titleCell.value = 'KOV GROUP / KOV KOFFIE — REKAPITULASI PURCHASE ORDER (PO)';
  titleCell.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F5132' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  worksheet.getRow(1).height = 30;

  // Row 2: Address Banner
  worksheet.mergeCells('B2:N2');
  const addrCell = worksheet.getCell('B2');
  addrCell.value = 'Jl. Sultan Agung No.135, Kaliwiru, Kec. Candisari, Kota Semarang, Jawa Tengah 50232  |  IG : KOV KOFFIE';
  addrCell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: '334155' } };
  addrCell.alignment = { vertical: 'middle', horizontal: 'left' };
  worksheet.getRow(2).height = 20;

  // Row 3: Subtitle
  worksheet.mergeCells('A3:N3');
  const subTitleCell = worksheet.getCell('A3');
  subTitleCell.value = `Tanggal Ekspor: ${formatDateTime(new Date())}  |  Total Data: ${records.length} PO`;
  subTitleCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: '555555' } };
  subTitleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  worksheet.getRow(3).height = 20;

  // Row 4: Spacer Row
  worksheet.getRow(4).height = 8;

  // Column Headers (Row 5)
  const columns = [
    { header: 'No. PO', key: 'no_po', width: 24 },
    { header: 'Tanggal PO', key: 'tanggal_po', width: 15 },
    { header: 'Nama Vendor (PT)', key: 'vendor_nama', width: 25 },
    { header: 'Nama Dagang', key: 'vendor_nama_dagang', width: 18 },
    { header: 'Perihal', key: 'perihal', width: 25 },
    { header: 'Unit Kerja', key: 'unit_kerja', width: 22 },
    { header: 'Lokasi Kirim', key: 'lokasi_kirim', width: 22 },
    { header: 'Termin Bayar', key: 'termin_bayar', width: 20 },
    { header: 'Subtotal (Rp)', key: 'subtotal', width: 18 },
    { header: 'PPN Nominal (Rp)', key: 'ppn_nominal', width: 18 },
    { header: 'Total Netto (Rp)', key: 'total_netto', width: 20 },
    { header: 'Status PO', key: 'status_po', width: 18 },
    { header: 'Dibuat Oleh', key: 'dibuat_oleh_nama', width: 20 },
    { header: 'Disetujui Oleh', key: 'disetujui_oleh_nama', width: 20 }
  ];

  const headerRow = worksheet.getRow(5);
  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F5132' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getColumn(idx + 1).width = col.width;
  });
  headerRow.height = 28;

  // Data Rows
  records.forEach(item => {
    const row = worksheet.addRow({
      no_po: item.no_po || `PO/KOV/${item.id}`,
      tanggal_po: formatDate(item.tanggal_po),
      vendor_nama: item.vendor_nama || '',
      vendor_nama_dagang: item.vendor_nama_dagang || '',
      perihal: item.perihal || '',
      unit_kerja: item.unit_kerja || '',
      lokasi_kirim: item.lokasi_kirim || '',
      termin_bayar: item.termin_bayar || '',
      subtotal: Number(item.subtotal || 0),
      ppn_nominal: Number(item.ppn_nominal || 0),
      total_netto: Number(item.total_netto || 0),
      status_po: item.status_po || 'Reguler / Approved',
      dibuat_oleh_nama: item.dibuat_oleh_nama || '',
      disetujui_oleh_nama: item.disetujui_oleh_nama || ''
    });

    row.getCell(9).numFmt = '#,##0';
    row.getCell(10).numFmt = '#,##0';
    row.getCell(11).numFmt = '#,##0';
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = { generatePOExcel };
