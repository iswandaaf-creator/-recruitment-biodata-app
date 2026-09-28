const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function generateOperasionalExcel(records) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('BA Pengajuan Barang');

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

  // Row 2 & 3: Document Title Header
  worksheet.mergeCells('C1:V1');
  const titleCell = worksheet.getCell('C1');
  titleCell.value = 'BERITA ACARA PENGAJUAN BARANG - DIVISI OPERASIONAL';
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: '0F5132' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

  worksheet.mergeCells('C2:V2');
  const subTitleCell = worksheet.getCell('C2');
  subTitleCell.value = `Exported Date: ${new Date().toLocaleDateString('id-ID')} | Total Records: ${records.length}`;
  subTitleCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: '555555' } };
  subTitleCell.alignment = { vertical: 'middle', horizontal: 'left' };

  // Empty Spacer Row 3
  worksheet.getRow(3).height = 10;

  // Row 4: Column Headers
  const columns = [
    { header: 'No. BA', key: 'no_ba', width: 22 },
    { header: 'Tgl Pengajuan', key: 'tanggal_pengajuan', width: 15 },
    { header: 'Outlet / Divisi', key: 'outlet_divisi', width: 20 },
    { header: 'Departemen', key: 'departemen', width: 18 },
    { header: 'PIC Pengajuan', key: 'pic_pengajuan', width: 20 },
    { header: 'Prioritas', key: 'prioritas', width: 12 },
    { header: 'Nama Barang / Equipment', key: 'nama_barang', width: 25 },
    { header: 'Status Barang', key: 'status_barang', width: 16 },
    { header: 'Kategori', key: 'kategori_barang', width: 16 },
    { header: 'Merk/Tipe/Model', key: 'merk_tipe_model', width: 20 },
    { header: 'Jumlah', key: 'jumlah', width: 10 },
    { header: 'Satuan', key: 'satuan', width: 10 },
    { header: 'Harga Satuan (Rp)', key: 'harga_satuan_estimasi', width: 18 },
    { header: 'Total Estimasi (Rp)', key: 'total_estimasi', width: 20 },
    { header: 'Tujuan & Justifikasi', key: 'tujuan_kebutuhan', width: 30 },
    { header: 'Kronologi Rusak (Jika ada)', key: 'kronologi_kerusakan', width: 30 },
    { header: 'Rekomendasi Evaluasi', key: 'rekomendasi', width: 18 },
    { header: 'Vendor', key: 'vendor_pembelian', width: 20 },
    { header: 'Sumber Budget', key: 'sumber_budget', width: 18 },
    { header: 'Treatment / Tindak Lanjut', key: 'treatment', width: 22 },
    { header: 'Status Approval', key: 'status_approval', width: 18 },
    { header: 'Tgl Dibuat', key: 'created_at', width: 20 }
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

  // Add Data Rows starting at Row 5
  records.forEach(item => {
    const row = worksheet.addRow({
      no_ba: item.no_ba || `BA/OPS/${item.id}`,
      tanggal_pengajuan: item.tanggal_pengajuan || '',
      outlet_divisi: item.outlet_divisi || '',
      departemen: item.departemen || '',
      pic_pengajuan: item.pic_pengajuan || '',
      prioritas: item.prioritas || 'Normal',
      nama_barang: item.nama_barang || '',
      status_barang: item.status_barang || '',
      kategori_barang: item.kategori_barang || '',
      merk_tipe_model: item.merk_tipe_model || '',
      jumlah: item.jumlah || 1,
      satuan: item.satuan || 'Pcs',
      harga_satuan_estimasi: Number(item.harga_satuan_estimasi || 0),
      total_estimasi: Number(item.total_estimasi || 0),
      tujuan_kebutuhan: item.tujuan_kebutuhan || '',
      kronologi_kerusakan: item.kronologi_kerusakan || '',
      rekomendasi: item.rekomendasi || '',
      vendor_pembelian: item.vendor_pembelian || '',
      sumber_budget: item.sumber_budget || '',
      treatment: item.treatment || '',
      status_approval: item.status_approval || 'Menunggu Approval',
      created_at: item.created_at || ''
    });

    row.getCell(13).numFmt = '#,##0'; // harga_satuan_estimasi
    row.getCell(14).numFmt = '#,##0'; // total_estimasi
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = { generateOperasionalExcel };
