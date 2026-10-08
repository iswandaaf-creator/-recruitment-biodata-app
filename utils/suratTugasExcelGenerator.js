const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function generateSuratTugasExcel(records) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Surat Tugas & LPJ');

  // Embed KOV Logo Image if exists
  const logoPath = path.join(__dirname, '..', 'public', 'logo_kov_hijau.png');
  if (fs.existsSync(logoPath)) {
    const logoId = workbook.addImage({
      buffer: fs.readFileSync(logoPath),
      extension: 'png',
    });
    worksheet.addImage(logoId, {
      tl: { col: 0, row: 0 },
      ext: { width: 150, height: 46 }
    });
  }

  // Row 1: Space for Logo
  worksheet.getRow(1).height = 38;

  // Title Headers
  worksheet.mergeCells('C1:P1');
  const titleCell = worksheet.getCell('C1');
  titleCell.value = 'REKAPITULASI SURAT TUGAS & FORM PERTANGGUNGJAWABAN (LPJ) - KOV GROUP';
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: '0F5132' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

  worksheet.mergeCells('C2:P2');
  const subTitleCell = worksheet.getCell('C2');
  subTitleCell.value = `Exported: ${new Date().toLocaleDateString('id-ID')} | Total Dokumen: ${records.length}`;
  subTitleCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: '555555' } };
  subTitleCell.alignment = { vertical: 'middle', horizontal: 'left' };

  worksheet.getRow(3).height = 10;

  // Column Headers (Row 4)
  const columns = [
    { header: 'No. Surat', key: 'no_surat', width: 22 },
    { header: 'Tgl Surat', key: 'tanggal_surat', width: 14 },
    { header: 'Pembuat (User)', key: 'user_pembuat_nama', width: 22 },
    { header: 'Jabatan (KA Outlet)', key: 'user_pembuat_jabatan', width: 20 },
    { header: 'Divisi', key: 'divisi_terkait', width: 18 },
    { header: 'Petugas / Penerima Tugas', key: 'petugas_str', width: 30 },
    { header: 'Lokasi Tujuan', key: 'lokasi_tujuan', width: 22 },
    { header: 'Kota Tujuan', key: 'kota_tujuan', width: 16 },
    { header: 'Tgl Berangkat', key: 'tanggal_berangkat', width: 14 },
    { header: 'Tgl Kembali', key: 'tanggal_kembali', width: 14 },
    { header: 'Keperluan', key: 'keperluan', width: 30 },
    { header: 'KA Divisi', key: 'ka_divisi_nama', width: 20 },
    { header: 'Status KA Divisi', key: 'status_ka_divisi', width: 16 },
    { header: 'Status GM', key: 'status_gm', width: 16 },
    { header: 'Status Surat', key: 'status_surat', width: 18 },
    { header: 'Jml Hari Realisasi', key: 'realisasi_jumlah_hari', width: 18 },
    { header: 'Uang Dinas (Rp)', key: 'uang_dinas_total', width: 18 },
    { header: 'Uang Menginap (Rp)', key: 'uang_menginap_total', width: 18 },
    { header: 'Transportasi (Rp)', key: 'biaya_transportasi', width: 18 },
    { header: 'Penginapan (Rp)', key: 'biaya_penginapan', width: 18 },
    { header: 'Biaya Lain (Rp)', key: 'biaya_lainnya', width: 18 },
    { header: 'Total Biaya LPJ (Rp)', key: 'total_biaya', width: 20 },
    { header: 'Status LPJ', key: 'status_lpj', width: 16 }
  ];

  const headerRow = worksheet.getRow(4);
  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    worksheet.getColumn(idx + 1).width = col.width;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0F5132' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } }
    };
  });
  headerRow.height = 26;

  // Data Rows
  let currentRowIdx = 5;
  records.forEach((rec) => {
    const row = worksheet.getRow(currentRowIdx);

    // Format petugas names
    let petugasStr = '';
    try {
      const pArr = typeof rec.petugas_json === 'string' ? JSON.parse(rec.petugas_json || '[]') : (rec.petugas || []);
      petugasStr = pArr.map(p => `${p.nama} (${p.jabatan || ''})`).join(', ');
    } catch (e) {
      petugasStr = rec.lpj_nama || '';
    }

    const rowData = [
      rec.no_surat || `ST/KOV/${rec.id}`,
      rec.tanggal_surat || '',
      rec.user_pembuat_nama || '',
      rec.user_pembuat_jabatan || '',
      rec.divisi_terkait || '',
      petugasStr,
      rec.lokasi_tujuan || '',
      rec.kota_tujuan || '',
      rec.tanggal_berangkat || '',
      rec.tanggal_kembali || '',
      rec.keperluan || '',
      rec.ka_divisi_nama || '',
      rec.status_ka_divisi || 'Pending',
      rec.status_gm || 'Pending',
      rec.status_surat || 'Menunggu Approval',
      rec.realisasi_jumlah_hari || 0,
      rec.uang_dinas_total || 0,
      rec.uang_menginap_total || 0,
      rec.biaya_transportasi || 0,
      rec.biaya_penginapan || 0,
      rec.biaya_lainnya || 0,
      rec.total_biaya || 0,
      rec.status_lpj || 'Draft'
    ];

    rowData.forEach((val, idx) => {
      const cell = row.getCell(idx + 1);
      cell.value = val;
      cell.font = { name: 'Segoe UI', size: 9.5 };
      cell.alignment = { vertical: 'middle', horizontal: (idx >= 15 && idx <= 21) ? 'right' : 'left' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'CCCCCC' } },
        left: { style: 'thin', color: { argb: 'CCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
        right: { style: 'thin', color: { argb: 'CCCCCC' } }
      };

      if (idx >= 16 && idx <= 21 && typeof val === 'number') {
        cell.numFmt = '#,##0';
      }
    });

    row.height = 22;
    currentRowIdx++;
  });

  return await workbook.xlsx.writeBuffer();
}

module.exports = { generateSuratTugasExcel };
