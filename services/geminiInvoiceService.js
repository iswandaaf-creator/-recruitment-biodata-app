const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const db = require('../db');

/**
 * Get Gemini API Key from environment or database settings
 */
async function getGeminiApiKey() {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
    return process.env.GEMINI_API_KEY.trim();
  }
  return new Promise((resolve) => {
    db.get('SELECT value FROM system_settings WHERE key = ?', ['gemini_api_key'], (err, row) => {
      if (!err && row && row.value && row.value.trim() !== '') {
        resolve(row.value.trim());
      } else {
        resolve('');
      }
    });
  });
}

/**
 * Save Gemini API Key into database settings
 */
async function saveGeminiApiKey(apiKey) {
  return new Promise((resolve, reject) => {
    const cleanKey = (apiKey || '').trim();
    db.run(
      `INSERT INTO system_settings (key, value, updated_at) VALUES ('gemini_api_key', ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      [cleanKey],
      (err) => {
        if (err) reject(err);
        else resolve(cleanKey);
      }
    );
  });
}

/**
 * Analyze and extract structured IT expense data from invoice document/image
 */
async function parseInvoiceWithGemini(filePath, mimeType, customApiKey = '') {
  const apiKey = (customApiKey && customApiKey.trim() !== '') 
    ? customApiKey.trim() 
    : (await getGeminiApiKey());

  if (!apiKey) {
    throw new Error('API Key Google Gemini belum diatur. Silakan masukkan Gemini API Key terlebih dahulu.');
  }

  if (!fs.existsSync(filePath)) {
    throw new Error('File invoice tidak ditemukan di server.');
  }

  const fileBuffer = fs.readFileSync(filePath);
  const base64Data = fileBuffer.toString('base64');

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
Anda adalah AI asisten akuntansi & IT KOV Group.
Tugas Anda adalah membaca, menganalisis, dan mengekstrak data dari foto/dokumen nota belanja, invoice, faktur, kwitansi, atau resi pembelian IT ini secara teliti dan akurat.

Keluarkan hasil HANYA dalam format JSON valid (tanpa markdown wrap, tanpa teks lain) dengan skema berikut:
{
  "no_transaksi": "string nomor nota/invoice/resi jika ada, atau kosong jika tidak ditemukan",
  "tanggal": "YYYY-MM-DD tanggal transaksi, jika tidak ada gunakan tanggal hari ini",
  "unit_outlet": "nama outlet KOV jika tertera (misal: 'Kantor Pusat Semarang', 'Outlet Pekalongan', 'Outlet Rinjani', 'Outlet Semarang', 'Outlet Ngaliyan', 'Outlet Purwokerto', 'Outlet Solo'), jika tidak tertera gunakan null",
  "vendor_toko": "nama toko, vendor, atau penjual pada nota",
  "metode_bayar": "pilih salah satu yang paling cocok: 'Transfer Bank', 'Petty Cash / Tunai', 'Kartu Kredit / Debit', 'E-Wallet / QRIS', 'Tempo / Hutang Vendor'",
  "status_bayar": "pilih 'Lunas' atau 'Pending'",
  "keterangan": "ringkasan singkat keperluan/barang belanja IT",
  "total_biaya": 0,
  "items": [
    {
      "nama": "nama barang belanja IT yang lengkap dan jelas",
      "kategori": "pilih salah satu yang paling tepat dari kategori resmi KOV berikut: 'Jaringan & Network' | 'Hardware & Komputer' | 'CCTV & Keamanan' | 'Software & Lisensi' | 'Perawatan & Service' | 'Aksesoris & Peripheral' | 'Operasional & Lainnya'",
      "qty": 1,
      "satuan": "Unit / Pcs / Roll / Box / Meter / Pack / Set",
      "harga": 0,
      "subtotal": 0
    }
  ]
}

Aturan penting:
1. Pastikan setiap item barang di dalam invoice dipisahkan ke array 'items'. Jika ada lebih dari 3 item yang berbeda, masukkan SEMUA itemnya secara rinci.
2. Nilai 'harga', 'subtotal', dan 'total_biaya' harus berupa angka numerik murni tanpa simbol Rp atau tanda titik pemisah ribuan.
3. Kategori barang WAJIB persis salah satu dari:
   - 'Jaringan & Network'
   - 'Hardware & Komputer'
   - 'CCTV & Keamanan'
   - 'Software & Lisensi'
   - 'Perawatan & Service'
   - 'Aksesoris & Peripheral'
   - 'Operasional & Lainnya'
`;

  const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: base64Data
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });

      let jsonText = (response.text || '').trim();
      jsonText = jsonText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

      const parsed = JSON.parse(jsonText);
      return parsed;
    } catch (err) {
      console.warn(`[Gemini Invoice OCR] Model ${model} encountered error:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('Gagal mengekstrak invoice dengan Gemini AI.');
}

module.exports = {
  getGeminiApiKey,
  saveGeminiApiKey,
  parseInvoiceWithGemini
};
