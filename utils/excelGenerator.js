const ExcelJS = require('exceljs');

async function generateExcel(candidates = []) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Recruitment System HR';
  workbook.lastModifiedBy = 'Recruitment System HR';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Color Palette Constants (Professional Corporate Palette)
  const COLORS = {
    NAVY_PRIMARY: '1F4E78',      // Main header background
    NAVY_SECONDARY: '2F5597',    // Secondary header / detail sheet
    ICE_BLUE: 'F2F6FA',          // Zebra row background
    WHITE: 'FFFFFF',             // Default white
    BORDER_GRAY: 'D9D9D9',       // Cell border color
    TEXT_DARK: '1A1A1A',         // Primary text
    STATUS_DITERIMA_BG: 'E2F0D9',   // Soft green
    STATUS_DITERIMA_FG: '276A3C',   // Dark green text
    STATUS_DIPERTIMBANGKAN_BG: 'FFF3CD', // Soft yellow
    STATUS_DIPERTIMBANGKAN_FG: '856404', // Dark amber text
    STATUS_DITOLAK_BG: 'F8D7DA',    // Soft red
    STATUS_DITOLAK_FG: '721C24',    // Dark red text
    STATUS_BELUM_BG: 'E9ECEF',     // Soft gray
    STATUS_BELUM_FG: '495057'      // Dark gray text
  };

  // Border Style Definition
  const thinBorder = {
    top: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } },
    left: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } },
    bottom: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } },
    right: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } }
  };

  // Helper: Format Date string
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  // =========================================================================
  // SHEET 1: DAFTAR KANDIDAT & RINGKASAN STATISTIK
  // =========================================================================
  const summarySheet = workbook.addWorksheet('Daftar Kandidat');
  summarySheet.views = [{ showGridLines: true }];

  // 1. Title Banner
  summarySheet.mergeCells('A1:R1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = 'REKAPITULASI DATA REKRUTMEN PELAMAR KARYAWAN';
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: COLORS.WHITE } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_PRIMARY } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  summarySheet.getRow(1).height = 36;

  // 2. Subtitle / Metadata Info
  summarySheet.mergeCells('A2:R2');
  const subCell = summarySheet.getCell('A2');
  const totalCount = candidates.length;
  const countDiterima = candidates.filter(c => c.kesimpulan_status === 'Diterima').length;
  const countDipertimbangkan = candidates.filter(c => c.kesimpulan_status === 'Dipertimbangkan').length;
  const countDitolak = candidates.filter(c => c.kesimpulan_status === 'Ditolak').length;
  const countBelum = totalCount - (countDiterima + countDipertimbangkan + countDitolak);

  subCell.value = `Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}  |  Total Pelamar: ${totalCount} Orang  [ Diterima: ${countDiterima} | Dipertimbangkan: ${countDipertimbangkan} | Ditolak: ${countDitolak} | Belum Diproses: ${countBelum} ]`;
  subCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: '595959' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'left' };
  summarySheet.getRow(2).height = 22;

  // Empty row for spacing
  summarySheet.getRow(3).height = 10;

  // 3. Table Column Definitions
  const summaryColumns = [
    { header: 'NO', key: 'no', width: 6, align: 'center' },
    { header: 'ID', key: 'id', width: 8, align: 'center' },
    { header: 'TANGGAL SUBMIT', key: 'created_at', width: 18, align: 'center' },
    { header: 'NAMA LENGKAP', key: 'nama_lengkap', width: 28, align: 'left' },
    { header: 'NAMA PANGGILAN', key: 'nama_panggilan', width: 16, align: 'left' },
    { header: 'POSISI DILAMAR', key: 'posisi_dilamar', width: 24, align: 'left' },
    { header: 'EMAIL', key: 'email', width: 26, align: 'left' },
    { header: 'NO. HANDPHONE', key: 'no_hp', width: 17, align: 'center' },
    { header: 'JENIS KELAMIN', key: 'jenis_kelamin', width: 14, align: 'center' },
    { header: 'NOMOR KK', key: 'nomor_kk', width: 20, align: 'center' },
    { header: 'NO. REKENING BANK', key: 'no_rekening', width: 22, align: 'left' },
    { header: 'GAJI POKOK', key: 'gaji_pokok', width: 18, align: 'right' },
    { header: 'PRODUKTIVITAS', key: 'produktivitas', width: 18, align: 'left' },
    { header: 'TGL JOIN', key: 'tgl_join', width: 14, align: 'center' },
    { header: 'TGL RESIGN', key: 'tgl_resign', width: 14, align: 'center' },
    { header: 'KOTA DOMISILI', key: 'kota_domisili', width: 18, align: 'left' },
    { header: 'GAJI DIHARAPKAN', key: 'gaji_diharapkan', width: 20, align: 'right' },
    { header: 'ADA FOTO', key: 'foto_kandidat', width: 12, align: 'center' },
    { header: 'STATUS REKRUTMEN', key: 'kesimpulan_status', width: 20, align: 'center' }
  ];

  // Set Header Row on Row 4
  const headerRowIndex = 4;
  const summaryHeaderRow = summarySheet.getRow(headerRowIndex);
  summaryHeaderRow.height = 28;

  summaryColumns.forEach((col, i) => {
    const cell = summaryHeaderRow.getCell(i + 1);
    cell.value = col.header;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLORS.WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_PRIMARY } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = thinBorder;
    summarySheet.getColumn(i + 1).width = col.width;
  });

  // 4. Data Rows
  let startRow = 5;
  candidates.forEach((c, index) => {
    const row = summarySheet.getRow(startRow);
    row.height = 24;
    const isEven = index % 2 === 1;
    const rowBgColor = isEven ? COLORS.ICE_BLUE : COLORS.WHITE;

    const rowData = [
      index + 1,
      c.id,
      formatDate(c.created_at),
      c.nama_lengkap || '-',
      c.nama_panggilan || '-',
      c.posisi_dilamar || '-',
      c.email || '-',
      c.no_hp || '-',
      c.jenis_kelamin || '-',
      c.nomor_kk || '-',
      c.no_rekening || '-',
      c.gaji_pokok || '-',
      c.produktivitas || '-',
      c.tgl_join ? formatDate(c.tgl_join) : '-',
      c.tgl_resign ? formatDate(c.tgl_resign) : '-',
      c.kota_domisili || '-',
      c.gaji_diharapkan || '-',
      c.foto_kandidat ? 'Ya' : 'Tidak',
      c.kesimpulan_status || 'Belum Diproses'
    ];

    rowData.forEach((val, i) => {
      const cell = row.getCell(i + 1);
      cell.value = val;
      cell.font = { name: 'Segoe UI', size: 9.5, color: { argb: COLORS.TEXT_DARK } };
      cell.alignment = { vertical: 'middle', horizontal: summaryColumns[i].align || 'left' };
      cell.border = thinBorder;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };

      // Special Status Badge Formatting
      if (summaryColumns[i].key === 'kesimpulan_status') {
        let statusBg = COLORS.STATUS_BELUM_BG;
        let statusFg = COLORS.STATUS_BELUM_FG;

        if (val === 'Diterima') {
          statusBg = COLORS.STATUS_DITERIMA_BG;
          statusFg = COLORS.STATUS_DITERIMA_FG;
        } else if (val === 'Dipertimbangkan') {
          statusBg = COLORS.STATUS_DIPERTIMBANGKAN_BG;
          statusFg = COLORS.STATUS_DIPERTIMBANGKAN_FG;
        } else if (val === 'Ditolak') {
          statusBg = COLORS.STATUS_DITOLAK_BG;
          statusFg = COLORS.STATUS_DITOLAK_FG;
        }

        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusBg } };
        cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: statusFg } };
      }
    });

    startRow++;
  });


  // =========================================================================
  // SHEET 2: DETAIL DATA LENGKAP KANDIDAT & RIWAYAT
  // =========================================================================
  const detailSheet = workbook.addWorksheet('Detail Data Lengkap');
  detailSheet.views = [{ showGridLines: true }];

  // 1. Title Banner Sheet 2
  detailSheet.mergeCells('A1:AC1');
  const titleCell2 = detailSheet.getCell('A1');
  titleCell2.value = 'DETAIL LENGKAP BIODATA & RIWAYAT PELAMAR';
  titleCell2.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: COLORS.WHITE } };
  titleCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_SECONDARY } };
  titleCell2.alignment = { vertical: 'middle', horizontal: 'center' };
  detailSheet.getRow(1).height = 36;

  // 2. Columns Definition
  const detailColumns = [
    { header: 'ID', key: 'id', width: 8, align: 'center' },
    { header: 'NAMA LENGKAP', key: 'nama_lengkap', width: 26, align: 'left' },
    { header: 'NOMOR KTP', key: 'nomor_ktp', width: 20, align: 'center' },
    { header: 'NOMOR KK', key: 'nomor_kk', width: 20, align: 'center' },
    { header: 'NO. REKENING BANK', key: 'no_rekening', width: 22, align: 'left' },
    { header: 'GAJI POKOK', key: 'gaji_pokok', width: 18, align: 'right' },
    { header: 'PRODUKTIVITAS', key: 'produktivitas', width: 18, align: 'left' },
    { header: 'TGL JOIN', key: 'tgl_join', width: 14, align: 'center' },
    { header: 'TGL RESIGN', key: 'tgl_resign', width: 14, align: 'center' },
    { header: 'KEWARGANEGARAAN', key: 'kewarganegaraan', width: 16, align: 'center' },
    { header: 'SUKU', key: 'suku', width: 14, align: 'center' },
    { header: 'GOL. DARAH', key: 'golongan_darah', width: 12, align: 'center' },
    { header: 'ALAMAT KTP', key: 'alamat_ktp', width: 35, align: 'left' },
    { header: 'KOTA KTP', key: 'kota_ktp', width: 18, align: 'left' },
    { header: 'KODE POS KTP', key: 'kode_pos_ktp', width: 14, align: 'center' },
    { header: 'ALAMAT DOMISILI', key: 'alamat_domisili', width: 35, align: 'left' },
    { header: 'KOTA DOMISILI', key: 'kota_domisili', width: 18, align: 'left' },
    { header: 'STATUS DOMISILI', key: 'status_alamat_domisili', width: 20, align: 'center' },
    { header: 'TELP RUMAH', key: 'no_telp_rumah', width: 16, align: 'center' },
    { header: 'HOBBY', key: 'hobby', width: 22, align: 'left' },
    { header: 'ALASAN REKRUTMEN', key: 'alasan_rekrutmen', width: 35, align: 'left' },
    { header: 'MINAT & PASSION', key: 'minat_passion', width: 35, align: 'left' },
    { header: 'RENCANA 3-5 TAHUN', key: 'rencana_3_5_tahun', width: 35, align: 'left' },
    { header: 'PRESTASI', key: 'prestasi', width: 35, align: 'left' },
    { header: 'MELAMAR PERUSAHAAN LAIN', key: 'melamar_perusahaan_lain', width: 30, align: 'left' },
    { header: 'RIWAYAT KESEHATAN', key: 'riwayat_kesehatan', width: 35, align: 'left' },
    { header: 'PERKIRAAN BERGABUNG', key: 'perkiraan_bergabung', width: 22, align: 'center' },
    { header: 'GAJI DIHARAPKAN', key: 'gaji_diharapkan', width: 20, align: 'right' },
    { header: 'KESIMPULAN HR', key: 'kesimpulan_status', width: 20, align: 'center' }
  ];

  // Set Header Row on Row 3
  const detailHeaderRow = detailSheet.getRow(3);
  detailHeaderRow.height = 28;

  detailColumns.forEach((col, i) => {
    const cell = detailHeaderRow.getCell(i + 1);
    cell.value = col.header;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLORS.WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_SECONDARY } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = thinBorder;
    detailSheet.getColumn(i + 1).width = col.width;
  });

  // Data Rows Sheet 2
  let detailStartRow = 4;
  candidates.forEach((c, index) => {
    const row = detailSheet.getRow(detailStartRow);
    row.height = 26;
    const isEven = index % 2 === 1;
    const rowBgColor = isEven ? COLORS.ICE_BLUE : COLORS.WHITE;

    const rowData = [
      c.id,
      c.nama_lengkap || '-',
      c.nomor_ktp || '-',
      c.nomor_kk || '-',
      c.no_rekening || '-',
      c.gaji_pokok || '-',
      c.produktivitas || '-',
      c.tgl_join ? formatDate(c.tgl_join) : '-',
      c.tgl_resign ? formatDate(c.tgl_resign) : '-',
      c.kewarganegaraan || '-',
      c.suku || '-',
      c.golongan_darah || '-',
      c.alamat_ktp || '-',
      c.kota_ktp || '-',
      c.kode_pos_ktp || '-',
      c.alamat_domisili || '-',
      c.kota_domisili || '-',
      c.status_alamat_domisili || '-',
      c.no_telp_rumah || '-',
      c.hobby || '-',
      c.alasan_rekrutmen || '-',
      c.minat_passion || '-',
      c.rencana_3_5_tahun || '-',
      c.prestasi || '-',
      c.melamar_perusahaan_lain || '-',
      c.riwayat_kesehatan || '-',
      c.perkiraan_bergabung || '-',
      c.gaji_diharapkan || '-',
      c.kesimpulan_status || 'Belum Diproses'
    ];

    rowData.forEach((val, i) => {
      const cell = row.getCell(i + 1);
      cell.value = val;
      cell.font = { name: 'Segoe UI', size: 9.5, color: { argb: COLORS.TEXT_DARK } };
      cell.alignment = { vertical: 'middle', horizontal: detailColumns[i].align || 'left', wrapText: true };
      cell.border = thinBorder;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };

      if (detailColumns[i].key === 'kesimpulan_status') {
        let statusBg = COLORS.STATUS_BELUM_BG;
        let statusFg = COLORS.STATUS_BELUM_FG;

        if (val === 'Diterima') {
          statusBg = COLORS.STATUS_DITERIMA_BG;
          statusFg = COLORS.STATUS_DITERIMA_FG;
        } else if (val === 'Dipertimbangkan') {
          statusBg = COLORS.STATUS_DIPERTIMBANGKAN_BG;
          statusFg = COLORS.STATUS_DIPERTIMBANGKAN_FG;
        } else if (val === 'Ditolak') {
          statusBg = COLORS.STATUS_DITOLAK_BG;
          statusFg = COLORS.STATUS_DITOLAK_FG;
        }

        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusBg } };
        cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: statusFg } };
      }
    });

    detailStartRow++;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = { generateExcel };
