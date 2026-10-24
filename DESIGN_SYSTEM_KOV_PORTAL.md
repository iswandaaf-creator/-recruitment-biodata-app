# KOV Management Portal — Official Design System & Component Governance

Dokumen standar tata kelola antarmuka resmi untuk seluruh aplikasi **KOV Management Portal** (HR Recruitment, Reviewer Divisi, Operasional Berita Acara, Purchase Order, Surat Tugas & LPJ, dan Rekap Belanja IT).

---

## 1. Palet Warna Semantik & Makna (Strict Purposeful Color)

Warna aksen **hanya** dipakai untuk makna fungsional. Dilarang keras menambah warna dekoratif acak (seperti ungu-pink, cyan neon, atau gradien pelangi).

| Warna | Token CSS | Nilai Hex | Makna & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Hijau (Emerald)** | `--kov-primary-600` | `#059669` / `#ecfdf5` | Tab aktif, status aktif, angka positif, aksi utama ("Salin Link", "Catat Belanja", "Buat Surat Tugas"). |
| **Biru (Sapphire)** | `--kov-blue` | `#2563eb` / `#eff6ff` | Informasi umum, status "Belum Diproses", angka total (Total Pelamar / Total PO). |
| **Kuning / Oranye** | `--kov-amber` / `--kov-orange` | `#d97706` / `#ea580c` | Menunggu approval, pending, perlu perhatian ("Dipertimbangkan", "Duplikat"). |
| **Merah (Rose / Crimson)** | `--kov-rose` | `#dc2626` / `#fef2f2` | Ditolak, aksi destruktif (Hapus, Batalkan), tombol Logout. |
| **Ungu (Amethyst)** | `--kov-purple` | `#7c3aed` / `#f5f3ff` | Khusus nilai uang / biaya (berpasangan dengan ikon dompet `fa-wallet`). |
| **Netral (Slate & White)** | `--kov-slate-900`, `--kov-border` | `#0f172a`, `#ffffff`, `#e2e8f0` | Seluruh struktur: kartu biasa, form input, bingkai tabel, search bar, dropdown. |

---

## 2. Tipografi & Bentuk (Typography & Geometry)

* **Font Utama**: Sans geometris `Plus Jakarta Sans` untuk seluruh teks antarmuka, heading, tombol, label, dan data tabel.
* **Font Monospace**: Hanya digunakan untuk data teknis:
  - URL form publik (`https://internal.kovgroups.com/?ref=...`)
  - Token formulir (`c-3ffjgveg`)
  - Nomor transaksi resmi (`IT-202610-001`, `PO-202610-001`, `ST-KOV-001`)
  - NIK, nomor rekening bank, dan IP address.
* **Bentuk & Radius**:
  - **Kartu (Cards)**: Background putih, radius `16–20px` (standar `18px`), border `1px` abu-hijau tipis (`#dcece5` / `#e2e8f0`), bayangan sangat ringan (`box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04)`).
  - **Tombol & Form Input**: Radius `10px`.
  - **Pill / Status / Filter**: Benar-benar bulat (`border-radius: 9999px`).
  - *Larangan*: Tanpa bayangan tebal, tanpa glassmorphism berlebihan, dan tanpa border bergradien.
* **Ikon**: Satu keluarga ikon garis/solid sederhana (Font Awesome 6) di dalam kotak kecil bertint warna semantik. **Nol emoji**.

---

## 3. Pola Komponen Standar

### A. Sidebar Navigation
* **Bagian Atas**: Logo KOV + teks "Management Portal".
* **Grup Menu**: Label KAPITAL kecil berjarak huruf lebar (`letter-spacing: 0.08em; font-size: 0.68rem; font-weight: 700;`):
  - `REKRUTMEN & HR`
  - `OPERASIONAL`
  - `INFRASTRUKTUR & IT`
  - `SISTEM`
* **Menu Aktif**: Pil hijau penuh (`#059669`) dengan teks putih tebal dan glow tipis.
* **Latar Belakang**: Hijau tua hampir hitam (`#071a14` ke `#020806`) dengan gradien vertikal halus ke bawah.
* **Bagian Bawah**: Tombol Mode Gelap, kartu profil pengguna (avatar huruf, nama, badge peran), dan tombol Keluar bernuansa merah gelap (`#dc2626`).

### B. Topbar
* Judul halaman tebal, didampingi keterangan abu-abu singkat di sebelahnya.
* Tombol hamburger dan sakelar tema berupa kotak bergaris.
* Aksi utama halaman terletak di kanan atas (misal "Export Excel", "Buat PO Baru").

### C. Tab Halaman (Sub-Navigasi)
* Deretan pil berikon di atas konten (misal: Berita Acara / Purchase Order / Surat Tugas).
* Tab aktif: Hijau penuh (`#059669`), tab lainnya putih bergaris tipis.

### D. Kartu Statistik (2 Varian Standar)
1. **Varian Dashboard HR**: Ikon tint di kiri atas, chevron bulat di kanan atas, angka besar tebal, label judul, lalu keterangan kecil di bawah. Kartu yang sedang aktif difilter diberi highlight border hijau emerald.
2. **Varian Modul Operasional**: Label KAPITAL kecil berwarna, angka besar berwarna (angka 0 tetap ditampilkan apa adanya: `0` atau `Rp 0`), keterangan di bawah, ikon tint di kanan dengan sparkline tipis.

### E. Kartu Tautan / Form Publik
* Strip hijau / ikon tautan di kiri, judul form, URL dalam kotak monospace, deretan tombol:
  - **Acak Token Baru**: Sekunder (putih bergaris + ikon acak hijau).
  - **Salin Link**: Utama hijau (`#059669` + ikon rantai/copy).
  - **Buka Form**: Sekunder (putih bergaris + ikon eksternal).

### F. Filter, Pencarian & Tabel
* **Search Box**: Ikon kaca pembesar dengan placeholder deskriptif yang menyebut kolom nyata (*"Cari nama, NIK, Rekening..."* / *"Cari No BA, Nama Barang, Outlet, PIC..."*).
* **Filter Pills**: Deretan pil berhitung bulat (*Semua (2)*, *Belum Diproses (1)*, *Diterima (1)*); yang aktif berwarna hijau penuh.
* **Tabel**:
  - Header: Latar abu-hijau muda (`#f4faf7`), teks huruf KAPITAL kecil berjarak.
  - Baris Data: Tiap baris adalah blok terpisah yang bersih dengan jarak rapi.
  - Status: Pil bulat kecil dengan titik dot berdenyut halus.
  - Identitas Orang: Avatar huruf dalam kotak hijau pucat + nama tebal.
  - Format Angka: Titik ribuan Rupiah (`Rp 17.400.000`), tanggal terstruktur (`20/10/2026 01:07`).

### G. Keadaan Kosong (Empty State)
* Ikon abu-abu besar di tengah kartu.
* Judul tebal (*"Belum Ada Purchase Order"*).
* Satu kalimat arahan yang menunjuk tombol nyata (*"Klik tombol 'Buat PO Baru' di atas untuk menerbitkan PO pertama."*).
* **Nol ilustrasi lucu/kartun**.

---

## 4. Matriks Padanan Halaman (Pattern Matching)

| Kebutuhan Modul | Halaman Acuan Pola |
| :--- | :--- |
| **Daftar + status + filter pil** | Dashboard HR (`/admin` - Daftar Pelamar Kerja) |
| **Daftar dengan catatan/review per baris** | Reviewer Divisi (`/reviewer`) |
| **Modul form publik + tab + KPI** | Berita Acara (`/admin/operasional`), Surat Tugas & LPJ (`/admin/operasional/surat-tugas`) |
| **Daftar dokumen transaksi resmi / baru** | Purchase Order (`/admin/operasional/po`) |
| **Transaksi multi-item + filter outlet** | Rekap Belanja IT (`/admin/it`) |

---

## 5. Daftar Periksa Anti-Slop (Quality Assurance Gate)

Sebelum kode di-merge atau dideploy, **Kuki** dan **Opus** memverifikasi seluruh poin ini:
- [x] **Zero Gradien Pelangi**: Tidak ada gradien ungu-pink, teks bergradien, atau warna cyan neon.
- [x] **Zero Emoji**: Tidak ada emoji sebagai ikon atau hiasan judul di antarmuka web.
- [x] **Zero Blobs / Partikel**: Tidak ada ilustrasi dekoratif kartun, hero section raksasa, atau blob mengambang.
- [x] **Radius Terstandarisasi**: Kartu `16–20px`, tombol/input `10px`, pil `9999px`.
- [x] **Data Nyata**: Tidak ada teks dummy generik (*Lorem Ipsum*, *John Doe*). Angka statistik nol ditampilkan nyata (`0` / `Rp 0`).
- [x] **Dukungan Mode Gelap**: Seluruh komponen memakai token tema (`var(--kov-*)`), tidak ada warna hardcoded yang merusak dark mode.
