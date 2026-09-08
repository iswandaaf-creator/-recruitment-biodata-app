const ExcelJS = require('exceljs');

async function generateExcel(candidates) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Recruitment System';
  workbook.created = new Date();

  // SHEET 1: RINGKASAN KANDIDAT
  const summarySheet = workbook.addWorksheet('Daftar Kandidat');
  
  summarySheet.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Tanggal Submit', key: 'created_at', width: 20 },
    { header: 'Nama Lengkap', key: 'nama_lengkap', width: 25 },
    { header: 'Nama Panggilan', key: 'nama_panggilan', width: 15 },
    { header: 'Posisi Dilamar', key: 'posisi_dilamar', width: 22 },
    { header: 'Posisi Lain', key: 'posisi_lain', width: 20 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'No. Handphone', key: 'no_hp', width: 16 },
    { header: 'Jenis Kelamin', key: 'jenis_kelamin', width: 14 },
    { header: 'Tempat / Tgl Lahir', key: 'ttl', width: 25 },
    { header: 'Agama', key: 'agama', width: 12 },
    { header: 'Status Perkawinan', key: 'status_perkawinan', width: 18 },
    { header: 'Kota Domisili', key: 'kota_domisili', width: 18 },
    { header: 'Gaji Diharapkan', key: 'gaji_diharapkan', width: 20 },
    { header: 'Status Rekrutmen', key: 'kesimpulan_status', width: 18 }
  ];

  // Style Header Row
  const headerRow = summarySheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1F4E78' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  candidates.forEach(c => {
    summarySheet.addRow({
      id: c.id,
      created_at: c.created_at,
      nama_lengkap: c.nama_lengkap,
      nama_panggilan: c.nama_panggilan,
      posisi_dilamar: c.posisi_dilamar,
      posisi_lain: c.posisi_lain,
      email: c.email,
      no_hp: c.no_hp,
      jenis_kelamin: c.jenis_kelamin,
      ttl: `${c.tempat_lahir || ''}, ${c.tanggal_lahir || ''}`,
      agama: c.agama,
      status_perkawinan: c.status_perkawinan,
      kota_domisili: c.kota_domisili,
      gaji_diharapkan: c.gaji_diharapkan,
      kesimpulan_status: c.kesimpulan_status || 'Belum Diproses'
    });
  });

  // SHEET 2: DETAIL DATA LENGKAP
  const detailSheet = workbook.addWorksheet('Detail Data Lengkap');

  const detailColumns = [
    { header: 'ID Kandidat', key: 'id', width: 10 },
    { header: 'Nama Lengkap', key: 'nama_lengkap', width: 25 },
    { header: 'Nomor KTP', key: 'nomor_ktp', width: 20 },
    { header: 'Kewarganegaraan', key: 'kewarganegaraan', width: 15 },
    { header: 'Suku', key: 'suku', width: 15 },
    { header: 'Golongan Darah', key: 'golongan_darah', width: 12 },
    { header: 'Alamat KTP', key: 'alamat_ktp', width: 35 },
    { header: 'Kota KTP', key: 'kota_ktp', width: 18 },
    { header: 'Kode Pos KTP', key: 'kode_pos_ktp', width: 12 },
    { header: 'Alamat Domisili', key: 'alamat_domisili', width: 35 },
    { header: 'Kota Domisili', key: 'kota_domisili', width: 18 },
    { header: 'Status Alamat Domisili', key: 'status_alamat_domisili', width: 22 },
    { header: 'No Telp Rumah', key: 'no_telp_rumah', width: 16 },
    { header: 'Hobby', key: 'hobby', width: 20 },
    { header: 'Alasan Rekrutmen', key: 'alasan_rekrutmen', width: 35 },
    { header: 'Minat & Passion', key: 'minat_passion', width: 35 },
    { header: 'Rencana 3-5 Tahun', key: 'rencana_3_5_tahun', width: 35 },
    { header: 'Prestasi', key: 'prestasi', width: 35 },
    { header: 'Melamar Perusahaan Lain', key: 'melamar_perusahaan_lain', width: 30 },
    { header: 'Riwayat Kesehatan', key: 'riwayat_kesehatan', width: 35 },
    { header: 'Perkiraan Bergabung', key: 'perkiraan_bergabung', width: 22 },
    { header: 'Gaji Diharapkan', key: 'gaji_diharapkan', width: 20 },
    { header: 'Kesimpulan HR', key: 'kesimpulan_status', width: 18 }
  ];

  detailSheet.columns = detailColumns;
  const detailHeaderRow = detailSheet.getRow(1);
  detailHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  detailHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '2F5597' }
  };

  candidates.forEach(c => {
    detailSheet.addRow({
      id: c.id,
      nama_lengkap: c.nama_lengkap,
      nomor_ktp: c.nomor_ktp,
      kewarganegaraan: c.kewarganegaraan,
      suku: c.suku,
      golongan_darah: c.golongan_darah,
      alamat_ktp: c.alamat_ktp,
      kota_ktp: c.kota_ktp,
      kode_pos_ktp: c.kode_pos_ktp,
      alamat_domisili: c.alamat_domisili,
      kota_domisili: c.kota_domisili,
      status_alamat_domisili: c.status_alamat_domisili,
      no_telp_rumah: c.no_telp_rumah,
      hobby: c.hobby,
      alasan_rekrutmen: c.alasan_rekrutmen,
      minat_passion: c.minat_passion,
      rencana_3_5_tahun: c.rencana_3_5_tahun,
      prestasi: c.prestasi,
      melamar_perusahaan_lain: c.melamar_perusahaan_lain,
      riwayat_kesehatan: c.riwayat_kesehatan,
      perkiraan_bergabung: c.perkiraan_bergabung,
      gaji_diharapkan: c.gaji_diharapkan,
      kesimpulan_status: c.kesimpulan_status || 'Belum Diproses'
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = { generateExcel };
