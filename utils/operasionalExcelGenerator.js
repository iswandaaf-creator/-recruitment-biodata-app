const ExcelJS = require('exceljs');

async function generateOperasionalExcel(records) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('BA Pengajuan Barang');

  // Define Columns
  worksheet.columns = [
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

  // Styling Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '0F5132' } // Dark Green Operasional Theme
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Add Data Rows
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

    // Formatting numbers
    row.getCell('harga_satuan_estimasi').numFmt = '#,##0';
    row.getCell('total_estimasi').numFmt = '#,##0';
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = { generateOperasionalExcel };
