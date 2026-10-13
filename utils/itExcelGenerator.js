const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const { formatDate, formatDateTime } = require('./dateFormatter');

async function generateITExcel(records, filterOptions = {}) {
  const workbook = new ExcelJS.Workbook();

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
    records = records.filter(r => (r.vendor_toko || '').toLowerCase().includes(vendor.toLowerCase()));
  }

  const sheetName = (outletName && outletName !== 'ALL' && outletName !== 'Semua Outlet')
    ? outletName.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 30)
    : 'Rekap Belanja IT';
  const worksheet = workbook.addWorksheet(sheetName);

  // Embed Logo KOV if exists
  const logoPath = path.join(__dirname, '..', 'public', 'logo_kov_hijau.png');
  if (fs.existsSync(logoPath)) {
    const logoId = workbook.addImage({
      buffer: fs.readFileSync(logoPath),
      extension: 'png',
    });
    worksheet.addImage(logoId, {
      tl: { col: 0, row: 0 },
      ext: { width: 140, height: 42 }
    });
  }

  // Header Title
  worksheet.getRow(1).height = 32;
  worksheet.mergeCells('C1:N1');
  const titleCell = worksheet.getCell('C1');
  titleCell.value = (outletName && outletName !== 'ALL' && outletName !== 'Semua Outlet')
    ? `REKAPITULASI PEMBELANJAAN IT - ${outletName.toUpperCase()} - KOV GROUP`
    : 'REKAPITULASI PEMBELANJAAN IT PER OUTLET - KOV GROUP';
  titleCell.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: '0F5132' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

  // Subtitle Metadata (Outlet, Vendor, Periode, Filter Item)
  worksheet.getRow(2).height = 20;
  worksheet.mergeCells('C2:N2');
  const metaCell1 = worksheet.getCell('C2');
  metaCell1.value = `Outlet: ${outletName}  |  Vendor: ${vendorLabel}  |  Periode: ${periodeLabel}  |  Filter Item: ${filterItemLabel}`;
  metaCell1.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '334155' } };
  metaCell1.alignment = { vertical: 'middle', horizontal: 'left' };

  worksheet.getRow(3).height = 18;
  worksheet.mergeCells('C3:N3');
  const metaCell2 = worksheet.getCell('C3');

  // Columns definition
  const columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Outlet / Unit', key: 'unit_outlet', width: 24 },
    { header: 'Tanggal', key: 'tanggal', width: 14 },
    { header: 'No. Transaksi', key: 'no_transaksi', width: 18 },
    { header: 'Vendor / Toko', key: 'vendor_toko', width: 25 },
    { header: 'Nama Barang / Item', key: 'nama_barang', width: 36 },
    { header: 'Kategori IT', key: 'kategori', width: 22 },
    { header: 'Qty', key: 'qty', width: 8 },
    { header: 'Satuan', key: 'satuan', width: 10 },
    { header: 'Harga Satuan (Rp)', key: 'harga_satuan', width: 18 },
    { header: 'Subtotal (Rp)', key: 'subtotal', width: 20 },
    { header: 'Metode Bayar', key: 'metode_bayar', width: 18 },
    { header: 'Status', key: 'status_bayar', width: 14 },
    { header: 'Bukti / No. Resi', key: 'bukti_transaksi', width: 22 }
  ];

  const headerRow = worksheet.getRow(5);
  headerRow.height = 28;

  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    worksheet.getColumn(idx + 1).width = col.width;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0F5132' } // KOV Forest Green
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: '0F5132' } },
      left: { style: 'thin', color: { argb: '198754' } },
      bottom: { style: 'medium', color: { argb: '0B3D26' } },
      right: { style: 'thin', color: { argb: '198754' } }
    };
  });

  let currentRow = 6;
  let rowCounter = 1;
  let totalKeseluruhan = 0;
  let totalItemCount = 0;

  records.forEach((nota) => {
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

    items.forEach((item) => {
      const q = Number(item.qty || 1);
      const h = Number(item.harga || item.harga_satuan || 0);
      const subt = Number(item.subtotal || (q * h));
      totalKeseluruhan += subt;
      totalItemCount++;

      const row = worksheet.getRow(currentRow);
      row.height = 22;

      const values = [
        rowCounter++,
        nota.unit_outlet || '-',
        formatDate(nota.tanggal),
        nota.no_transaksi || '-',
        nota.vendor_toko || '-',
        item.nama || item.nama_barang || '-',
        item.kategori || nota.kategori || '-',
        q,
        item.satuan || 'Unit',
        h,
        subt,
        nota.metode_bayar || '-',
        nota.status_bayar || 'Lunas',
        nota.bukti_transaksi || '-'
      ];

      values.forEach((val, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        cell.value = val;
        cell.font = { name: 'Segoe UI', size: 9 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } }
        };

        if (colIdx === 0 || colIdx === 2 || colIdx === 3 || colIdx === 7 || colIdx === 8 || colIdx === 11 || colIdx === 12) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colIdx === 9 || colIdx === 10) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '#,##0';
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });

      currentRow++;
    });
  });

  // Set line 3 metadata value with computed counts
  metaCell2.value = `Export: ${formatDateTime(new Date())} | Total Transaksi: ${records.length} Nota (${totalItemCount} Item) | Total Pengeluaran: Rp ${totalKeseluruhan.toLocaleString('id-ID')}`;
  metaCell2.font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: '64748B' } };
  metaCell2.alignment = { vertical: 'middle', horizontal: 'left' };

  // Summary Row Total
  const totalRow = worksheet.getRow(currentRow);
  totalRow.height = 26;
  worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
  const totalLabel = totalRow.getCell(1);
  totalLabel.value = 'TOTAL PENGELUARAN PEMBELANJAAN IT';
  totalLabel.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '0F172A' } };
  totalLabel.alignment = { vertical: 'middle', horizontal: 'right' };
  totalLabel.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'F1F5F9' }
  };

  const totalValueCell = totalRow.getCell(11);
  totalValueCell.value = totalKeseluruhan;
  totalValueCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: '0F5132' } };
  totalValueCell.numFmt = '#,##0';
  totalValueCell.alignment = { vertical: 'middle', horizontal: 'right' };
  totalValueCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'DCFCE7' } // Light green accent
  };

  for (let c = 1; c <= 14; c++) {
    const cCell = totalRow.getCell(c);
    cCell.border = {
      top: { style: 'medium', color: { argb: '0F5132' } },
      bottom: { style: 'double', color: { argb: '0F5132' } }
    };
  }

  return await workbook.xlsx.writeBuffer();
}

module.exports = { generateITExcel };
