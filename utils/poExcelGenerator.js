const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function generatePOExcel(records) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Purchase Orders');

  // Embed KOV Logo Image if exists
  const logoPath = path.join(__dirname, '..', 'public', 'logo_kov_hijau.png');
  if (fs.existsSync(logoPath)) {
    const logoId = workbook.addImage({
      buffer: fs.readFileSync(logoPath),
      extension: 'png',
    });
    worksheet.addImage(logoId, {
      tl: { col: 0, row: 0 },
      ext: { width: 160, height: 50 }
    });
  }

  // Row 1: Space for Logo
  worksheet.getRow(1).height = 40;

  // Row 2 & 3: Title Header
  worksheet.mergeCells('C1:N1');
  const titleCell = worksheet.getCell('C1');
  titleCell.value = 'REKAPITULASI PURCHASE ORDER (PO) - KOV GROUP OPERASIONAL';
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: '0F5132' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

  worksheet.mergeCells('C2:N2');
  const subTitleCell = worksheet.getCell('C2');
  subTitleCell.value = `Exported Date: ${new Date().toLocaleDateString('id-ID')} | Total PO: ${records.length}`;
  subTitleCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: '555555' } };
  subTitleCell.alignment = { vertical: 'middle', horizontal: 'left' };

  worksheet.getRow(3).height = 10;

  // Column Headers (Row 4)
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

  const headerRow = worksheet.getRow(4);
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
      tanggal_po: item.tanggal_po || '',
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
