# Panduan Tipografi & Sistem Form — KOV Koffie Portal

> Terapkan pada `public/kov_layout.html` (referensi) dan port ke `public/assets/css/kov-portal.css`
> (Single Source of Truth untuk seluruh view EJS). Prinsip induk: **framed-sheet** — permukaan flat,
> hairline `1px solid #e2e8f0`, aksen KOV Botanical Pine `#166534`, nol ornamen slop.

---

## 1. Prinsip yang ditegakkan

1. **Satu skala, satu sumber** — semua `font-size` berasal dari token; tidak ada angka liar (13.5px,
   9.5px, `!important` perang) di markup.
2. **Flat surfaces** — kartu/tombol/tab **tanpa bayangan saat diam**. Bayangan hanya untuk lapisan
   nyata: focus ring input (0 0 0 3px pine 12%), dan modal (overlay + blur).
3. **Monospace hanya untuk data angka** — NIK, no. rekening, KPI numeral, tanggal = JetBrains Mono
   `tabular-nums`. Label dan body tidak pernah mono.
4. **Uppercase caps hanya di tiga tempat**: label KPI (10px), header kolom tabel (11px).
   Selain itu normal-case.
5. **Warna berasal dari token** — tidak ada `text-slate-500`, `bg-emerald-800`, dll. liar di markup.

---

## 2. Skala tipe: 7 slot, rasio ±1.25–1.45

Semua ukuran UI dalam sistem ini terpeta ke salah satu slot berikut. Rasio antar-slot longgar
(dua setengah tingkat antara body 13px dan H1 24px) — hierarki jelas tanpa perlu warna berani.

| Token      | Nilai | Rasio ke body | Peran tunggal                          | Contoh di portal                |
|------------|-------|--------------|----------------------------------------|---------------------------------|
| `--fs-2xs` | 10px  | 0.77×        | micro-caps KPI (`t-caps`)              | "TOTAL PELAMAR"                 |
| `--fs-xs`  | 11px  | 0.85×        | badge status, th tabel, teks sekunder  | "Diterima", "KANDIDAT & PENDIDIKAN" |
| `--fs-sm`  | 12px  | 0.92×        | label form, helper, subtitle           | "Nama Lengkap Sesuai KTP"       |
| `--fs-md`  | 13px  | 1×           | **body utama**: input, tombol, td      | nilai input, sel tabel          |
| `--fs-lg`  | 16px  | 1.23×        | judul seksi form (`h3`)                | "Informasi Identitas Diri"      |
| `--fs-xl`  | 20px  | 1.54×        | judul kartu (`h2`), angka KPI          | "Formulir Biodata…", "5 Data"   |
| `--fs-2xl` | 24px  | 1.85×        | judul halaman (`h1`)                   | "Sistem Formulir Biodata Terpadu" |

```css
:root {
  --fs-2xs: 10px; --fs-xs: 11px; --fs-sm: 12px; --fs-md: 13px;
  --fs-lg: 16px;  --fs-xl: 20px; --fs-2xl: 24px;
  --lh-tight: 1.25;   /* heading & KPI */
  --lh-body: 1.55;    /* body, teks tabel */
  --ls-caps: 0.07em;  /* hanya untuk micro-caps */
  --ls-display: -0.02em; /* judul tampilan, merapatkan optik ala Jakarta Sans */
}
```

**Bobot, ketat maksimal 3:** 400 (body), 600 (label/tombol/seksi/KPI), 700 (H1–H2, th tabel).
Jangan pernah 800; jangan pakai warna untuk membuat hierarki yang seharusnya ukuran.

**Leading & tracking konkret:**
- H1 24px → line-height 1.25, tracking −0.02em.
- KPI numeral 20px mono → 600, tracking −0.01em; labelnya di atas 10px caps +0.07em.
- Body/td 13px → line-height 1.55; teks sekunder 11px sama leading-nya (jaga ritme baris ganda).

---

## 3. Rasio heading : body (bukti konkret)

```
H1   24px  ━━━━━━━━━━━━━━━━━━━━━━   (≈ 1.85 × body)
H2   20px  ━━━━━━━━━━━━━━━━━
H3   16px  ━━━━━━━━━━━━
BODY 13px  ━━━━━━━━               baseline semua komponen
SM   12px  ━━━━━━━
XS   11px  ━━━━━
2XS  10px  ━━━━
```

Aturan praktis: **dua tingkat ukuran di antara setiap lompatan hierarki yang merendah**. Judul
seksi (13→16) lompat 1 slot; judul halaman (13→24) lompat 2 slot — inilah yang membuat halaman
terasa "disusun manusia": lompatan tidak seragam, tapi terukur.

---

## 4. Ritme spasi: grid 4px

Semua jarak kelipatan 4. Ritme vertikal form (naik-turun diukur dari baseline):

| Antara                          | Nilai      | Kenapa                                       |
|---------------------------------|-----------|----------------------------------------------|
| label → input                   | **6px**   | label "menempel" ke miliknya                 |
| input → pasangan berikutnya     | **20px**  | jeda internal grid (`gap-5` = 20px)          |
| seksi → seksi (didahului garis) | **24–32px** + hairline `1px #e2e8f0` | garis di sini berfungsi, bukan hiasan |
| judul seksi → grid field        | **16px**  |                                              |
| padding kartu                   | 24px (mobil) → 40px (desktop, `p-6 sm:p-10`) |                      |
| Tinggi input / tombol           | **42px**  | satu ukuran, semua kontrol sejajar           |

Simetri grid: **dua kolom sama lebar** (`grid-cols-2`, gap 20px), label di ATAS field, Selector
wajib `*` 10–12px merah `--required-ink #be123c` di KANAN label. Satu pola diulang 10/10 label
lebih baik daripada 10 variasi "cantik".

---

## 5. Checklist QA (yang harus 100 sebelum lanjut)

- [ ] `grep "font-size: [0-9]"` → **0 hit**; semua lewat token.
- [ ] Tidak ada `text-[n.n px]`, `!important` ukuran, `transition: all`.
- [ ] Shadow: hanya focus-ring input + modal.
- [ ] Uppercase hanya `t-caps` KPI + th tabel.
- [ ] Semua warna inline = `var(--…)`; kelas Tailwind warna liar = 0.
- [ ] Modal: `position: fixed; inset: 0; flex center` (sudah diverifikasi Puppeteer).
- [ ] Lint taste `--app`: **0 FAIL**.
- [ ] Skala final 10/11/12/13/16/20/24 — tidak ada nilai di luar daftar.

## 6. Status verifikiasi sesi ini

- Lint: **0 FAIL, 28 WARN** (sisa = mono data angka, token warna dark-mode, blur overlay modal —
  semuanya disengaja dan bisa dipertahankan).
- Puppeteer: render 1440/900 + 390/844 tanpa error konsol; modal ter-overlay benar.
- Sintaks JS: 2 blok skrip valid (`new Function` check); kurung CSS seimbang.
