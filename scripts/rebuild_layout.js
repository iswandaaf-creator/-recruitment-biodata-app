const fs = require('fs');
const path = require('path');

const newHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KOV Koffie — Management Portal &amp; Integrated Form System</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com/3.4.17"></script>
  <script>
    tailwind.config = {
      darkMode: ['selector', '[data-theme="dark"]']
    };
  </script>
  <style>
    :root {
      /* Typography */
      --font-display: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;

      /* KOV Executive Minimalist Palette */
      --bg-canvas: #f8fafc;
      --bg-surface: #ffffff;
      --bg-subtle: #f1f5f9;
      --bg-hover: #f8fafc;

      /* Hairline Rules */
      --border-hairline: #e2e8f0;
      --border-subtle: #f1f5f9;
      --border-input: #cbd5e1;
      --border-input-focus: #166534;

      /* Inks */
      --ink-primary: #0f172a;      /* Obsidian Slate 900 */
      --ink-secondary: #334155;    /* Slate 700 */
      --ink-muted: #64748b;        /* Slate 500 */
      --ink-faint: #94a3b8;        /* Slate 400 */

      /* Brand Botanical Pine */
      --kov-pine: #166534;
      --kov-pine-hover: #14532d;
      --kov-pine-light: #f0fdf4;
      --kov-pine-border: #bbf7d0;

      /* Status Tokens */
      --status-emerald-bg: #f0fdf4;
      --status-emerald-border: #bbf7d0;
      --status-emerald-ink: #166534;

      --status-amber-bg: #fffbeb;
      --status-amber-border: #fde68a;
      --status-amber-ink: #b45309;

      --status-rose-bg: #fff1f2;
      --status-rose-border: #fecdd3;
      --status-rose-ink: #be123c;

      --status-blue-bg: #eff6ff;
      --status-blue-border: #bfdbfe;
      --status-blue-ink: #1d4ed8;

      /* Geometry */
      --radius-sm: 6px;
      --radius-md: 8px;
      --radius-lg: 12px;
      --radius-xl: 16px;
      --radius-pill: 9999px;

      /* Elevations */
      --shadow-subtle: 0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.03);
      --shadow-card: 0 4px 6px -1px rgba(15, 23, 42, 0.04), 0 2px 4px -2px rgba(15, 23, 42, 0.03);
      --shadow-modal: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
      --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
    }

    [data-theme="dark"] {
      --bg-canvas: #090d16;
      --bg-surface: #111827;
      --bg-subtle: #1e293b;
      --bg-hover: #1f293d;

      --border-hairline: #1e293b;
      --border-subtle: #192231;
      --border-input: #334155;
      --border-input-focus: #22c55e;

      --ink-primary: #f8fafc;
      --ink-secondary: #cbd5e1;
      --ink-muted: #94a3b8;
      --ink-faint: #64748b;

      --kov-pine: #22c55e;
      --kov-pine-hover: #16a34a;
      --kov-pine-light: rgba(34, 197, 94, 0.12);
      --kov-pine-border: rgba(34, 197, 94, 0.25);

      --status-emerald-bg: rgba(34, 197, 94, 0.12);
      --status-emerald-border: rgba(34, 197, 94, 0.25);
      --status-emerald-ink: #4ade80;

      --status-amber-bg: rgba(245, 158, 11, 0.12);
      --status-amber-border: rgba(245, 158, 11, 0.25);
      --status-amber-ink: #fbbf24;

      --status-rose-bg: rgba(239, 68, 68, 0.12);
      --status-rose-border: rgba(239, 68, 68, 0.25);
      --status-rose-ink: #f87171;

      --status-blue-bg: rgba(59, 130, 246, 0.12);
      --status-blue-border: rgba(59, 130, 246, 0.25);
      --status-blue-ink: #60a5fa;
    }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100vh;
      font-family: var(--font-sans);
      background-color: var(--bg-canvas);
      color: var(--ink-primary);
      -webkit-font-smoothing: antialiased;
    }

    input, select, textarea, button {
      color: var(--ink-primary);
      font-family: inherit;
    }

    .font-display {
      font-family: var(--font-display);
      letter-spacing: -0.025em;
    }

    .font-mono-num {
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
    }

    /* Icon system */
    .kov-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      stroke-width: 1.85;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    /* Cards */
    .kov-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-subtle);
      transition: box-shadow 0.2s var(--ease-smooth);
    }
    .kov-card:hover {
      box-shadow: var(--shadow-card);
    }

    /* Form Fields */
    .kov-field {
      width: 100%;
      height: 42px;
      padding: 0 14px;
      background: var(--bg-surface);
      border: 1px solid var(--border-input);
      border-radius: var(--radius-md);
      font-size: 13.5px;
      color: var(--ink-primary);
      outline: none;
      transition: all 0.18s var(--ease-smooth);
    }
    .kov-field:focus {
      border-color: var(--border-input-focus);
      box-shadow: 0 0 0 3px rgba(22, 101, 52, 0.12);
    }
    select.kov-field {
      cursor: pointer;
    }

    /* Buttons */
    .btn-primary {
      height: 42px;
      padding: 0 20px;
      background: var(--kov-pine);
      color: #ffffff;
      border: 1px solid transparent;
      border-radius: var(--radius-md);
      font-size: 13px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.16s ease;
      white-space: nowrap;
    }
    .btn-primary:hover {
      background: var(--kov-pine-hover);
      transform: translateY(-0.5px);
    }
    .btn-primary:active {
      transform: translateY(0);
    }

    .btn-outline {
      height: 42px;
      padding: 0 18px;
      background: var(--bg-surface);
      color: var(--ink-secondary);
      border: 1px solid var(--border-input);
      border-radius: var(--radius-md);
      font-size: 13px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.16s ease;
      white-space: nowrap;
    }
    .btn-outline:hover {
      background: var(--bg-subtle);
      border-color: var(--ink-muted);
      color: var(--ink-primary);
    }

    .btn-icon {
      width: 38px;
      height: 38px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-hairline);
      background: var(--bg-surface);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--ink-secondary);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-icon:hover {
      background: var(--bg-subtle);
      color: var(--ink-primary);
    }

    /* Nav Pills */
    .nav-tab-pill {
      height: 36px;
      padding: 0 16px;
      border-radius: var(--radius-md);
      font-size: 13px;
      font-weight: 500;
      color: var(--ink-secondary);
      background: transparent;
      border: 1px solid transparent;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .nav-tab-pill:hover {
      color: var(--ink-primary);
      background: var(--bg-subtle);
    }
    .nav-tab-pill.active {
      background: var(--bg-surface);
      color: var(--kov-pine);
      font-weight: 600;
      border-color: var(--border-hairline);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }

    /* Badges */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px;
      font-size: 11px;
      font-weight: 600;
      border-radius: var(--radius-pill);
      white-space: nowrap;
      border: 1px solid transparent;
    }
    .badge-emerald { background: var(--status-emerald-bg); color: var(--status-emerald-ink); border-color: var(--status-emerald-border); }
    .badge-amber   { background: var(--status-amber-bg); color: var(--status-amber-ink); border-color: var(--status-amber-border); }
    .badge-rose    { background: var(--status-rose-bg); color: var(--status-rose-ink); border-color: var(--status-rose-border); }
    .badge-blue    { background: var(--status-blue-bg); color: var(--status-blue-ink); border-color: var(--status-blue-border); }

    /* Tables */
    .kov-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .kov-table thead th {
      color: var(--ink-muted);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 14px 20px;
      border-bottom: 1px solid var(--border-hairline);
      text-align: left;
      background: var(--bg-subtle);
    }
    .kov-table tbody td {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-subtle);
      vertical-align: middle;
      color: var(--ink-primary);
    }
    .kov-table tbody tr:hover td {
      background: var(--bg-hover);
    }

    /* Modal Backdrop */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(4px);
      z-index: 99998;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
  </style>
</head>
<body class="flex flex-col min-h-screen">

  <!-- =======================================================================
       1. GLOBAL SUITE HEADER (64px) - Symmetrical & Clean Navigation
       ======================================================================= -->
  <header class="h-16 px-6 lg:px-10 border-b flex items-center justify-between gap-4 sticky top-0 z-50" style="background: var(--bg-surface); border-color: var(--border-hairline);">
    <!-- Brand Identity -->
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-base shadow-sm" style="background: var(--kov-pine);">
        K
      </div>
      <div>
        <div class="font-display font-bold text-sm tracking-tight flex items-center gap-1.5" style="color: var(--ink-primary);">
          KOV KOFFIE
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full" style="background: var(--status-emerald-bg); color: var(--status-emerald-ink); border: 1px solid var(--status-emerald-border);">HOLDING</span>
        </div>
        <div class="text-[11px] font-medium" style="color: var(--ink-muted);">Management Portal &amp; Form Suite</div>
      </div>
    </div>

    <!-- Center Workspace Switcher (Full Tabs Navigation) -->
    <nav class="hidden md:flex items-center gap-1 p-1 rounded-lg border" style="background: var(--bg-subtle); border-color: var(--border-hairline);" id="mainWorkspaceTabs">
      <button type="button" class="nav-tab-pill active" data-tab="form">
        <svg class="kov-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        <span>Sistem Formulir</span>
      </button>
      <button type="button" class="nav-tab-pill" data-tab="candidates">
        <svg class="kov-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span>Direktori Pelamar</span>
      </button>
      <button type="button" class="nav-tab-pill" data-tab="calendar">
        <svg class="kov-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span>Kalender Seleksi</span>
      </button>
      <button type="button" class="nav-tab-pill" data-tab="operasional">
        <svg class="kov-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        <span>BA &amp; PO</span>
      </button>
    </nav>

    <!-- Right Controls: Role Selector, Search & Theme -->
    <div class="flex items-center gap-2.5">
      <div class="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs" style="background: var(--bg-surface); border-color: var(--border-hairline);">
        <span class="w-2 h-2 rounded-full" style="background: var(--kov-pine);"></span>
        <select id="roleSelector" class="bg-transparent font-semibold outline-none cursor-pointer text-xs" style="color: var(--ink-primary);">
          <option value="admin">Super Admin HR</option>
          <option value="reviewer">Reviewer Divisi</option>
          <option value="manager">Manajer Operasional</option>
        </select>
      </div>

      <button type="button" id="btnToggleTheme" class="btn-icon" title="Ubah Tema Tampilan">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
      </button>
    </div>
  </header>

  <!-- =======================================================================
       2. HERO METRIC STRIP (Symmetrical 4-KPI Grid)
       ======================================================================= -->
  <section class="border-b py-6 px-6 lg:px-10" style="background: var(--bg-surface); border-color: var(--border-hairline);">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="font-display text-xl sm:text-2xl font-bold tracking-tight" id="heroHeadline">
            Sistem Formulir Biodata Terpadu
          </h1>
          <span class="badge badge-emerald" id="heroBadge">Sistem Aktif</span>
        </div>
        <p class="text-xs sm:text-sm mt-1 leading-relaxed" style="color: var(--ink-muted);" id="heroSubtitle">
          Pendaftaran calon karyawan resmi, otorisasi data KTP, dan arsip terpusat KOV Koffie Group.
        </p>
      </div>

      <!-- Quick KPI Counters -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <div class="px-4 py-3 rounded-xl border" style="background: var(--bg-subtle); border-color: var(--border-hairline);">
          <div class="text-[10px] font-bold uppercase tracking-wider" style="color: var(--ink-muted);">Total Pelamar</div>
          <div class="font-display font-mono-num text-lg font-bold mt-0.5" style="color: var(--ink-primary);" id="kpiTotal">5 Data</div>
        </div>
        <div class="px-4 py-3 rounded-xl border" style="background: var(--bg-subtle); border-color: var(--border-hairline);">
          <div class="text-[10px] font-bold uppercase tracking-wider" style="color: var(--ink-muted);">Perlu Review</div>
          <div class="font-display font-mono-num text-lg font-bold mt-0.5" style="color: var(--status-amber-ink);" id="kpiReview">2 Berkas</div>
        </div>
        <div class="px-4 py-3 rounded-xl border" style="background: var(--bg-subtle); border-color: var(--border-hairline);">
          <div class="text-[10px] font-bold uppercase tracking-wider" style="color: var(--ink-muted);">Siap PKWT</div>
          <div class="font-display font-mono-num text-lg font-bold mt-0.5" style="color: var(--status-emerald-ink);" id="kpiLulus">2 Lulus</div>
        </div>
        <div class="px-4 py-3 rounded-xl border" style="background: var(--bg-subtle); border-color: var(--border-hairline);">
          <div class="text-[10px] font-bold uppercase tracking-wider" style="color: var(--ink-muted);">Agenda Aktif</div>
          <div class="font-display font-mono-num text-lg font-bold mt-0.5" style="color: var(--status-blue-ink);" id="kpiAgenda">3 Jadwal</div>
        </div>
      </div>
    </div>
  </section>

  <!-- =======================================================================
       3. MAIN WORKSPACE CONTAINER (MAX-W-7XL, GENEROUS BREATHING ROOM)
       ======================================================================= -->
  <main class="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-10">

    <!-- =====================================================================
         VIEW 1: SISTEM FORMULIR BIODATA TERPADU (Default Star View)
         ===================================================================== -->
    <section id="viewForm" class="space-y-6">
      <!-- Symmetrical Multi-Step Form Card -->
      <div class="kov-card p-6 sm:p-10 max-w-4xl mx-auto">
        <!-- Form Header & Progress Steps -->
        <div class="border-b pb-6 mb-8" style="border-color: var(--border-hairline);">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 class="font-display text-lg sm:text-xl font-bold" style="color: var(--ink-primary);">Formulir Biodata Calon Karyawan</h2>
              <p class="text-xs sm:text-sm mt-1" style="color: var(--ink-muted);">Isi seluruh data dengan jujur dan teliti sesuai identitas asli KTP.</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold px-3 py-1 rounded-full border" style="background: var(--status-emerald-bg); color: var(--status-emerald-ink); border-color: var(--status-emerald-border);">
                Langkah 1 dari 3: Identitas Diri
              </span>
            </div>
          </div>
        </div>

        <form id="candidateApplicationForm" class="space-y-8" novalidate>
          <!-- Section 1: Identitas Pribadi -->
          <div>
            <div class="flex items-center gap-2 mb-4">
              <span class="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white" style="background: var(--kov-pine);">1</span>
              <h3 class="font-display font-bold text-sm tracking-tight" style="color: var(--ink-primary);">Informasi Identitas Diri</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color: var(--ink-secondary);">Nama Lengkap Sesuai KTP <span class="text-rose-500">*</span></label>
                <input type="text" id="inpNama" value="Budi Santoso" required class="kov-field" placeholder="Masukkan nama lengkap">
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color: var(--ink-secondary);">Nomor Induk Kependudukan (NIK 16 Digit) <span class="text-rose-500">*</span></label>
                <input type="text" id="inpNik" value="3374012410980001" maxlength="16" required class="kov-field font-mono-num" placeholder="3374xxxxxxxxxxxx">
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color: var(--ink-secondary);">Nomor WhatsApp Aktif <span class="text-rose-500">*</span></label>
                <input type="tel" id="inpHp" value="0812-3456-7890" required class="kov-field font-mono-num" placeholder="08xxxxxxxxxx">
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color: var(--ink-secondary);">Alamat Email Resmi <span class="text-rose-500">*</span></label>
                <input type="email" id="inpEmail" value="budi.santoso@kov.id" required class="kov-field" placeholder="nama@email.com">
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color: var(--ink-secondary);">Tempat &amp; Tanggal Lahir <span class="text-rose-500">*</span></label>
                <input type="text" id="inpTtl" value="Semarang, 24 Oktober 1998" required class="kov-field" placeholder="Kota, DD Bulan YYYY">
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color: var(--ink-secondary);">Jenis Kelamin <span class="text-rose-500">*</span></label>
                <select id="inpGender" class="kov-field">
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Section 2: Posisi & Penempatan -->
          <div class="pt-6 border-t" style="border-color: var(--border-hairline);">
            <div class="flex items-center gap-2 mb-4">
              <span class="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white" style="background: var(--kov-pine);">2</span>
              <h3 class="font-display font-bold text-sm tracking-tight" style="color: var(--ink-primary);">Pilihan Divisi &amp; Outlet Penempatan</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color: var(--ink-secondary);">Divisi Tujuan <span class="text-rose-500">*</span></label>
                <select id="inpDivisi" class="kov-field">
                  <option value="Barista">Barista &amp; Roastery</option>
                  <option value="Kitchen">Kitchen &amp; Pastry</option>
                  <option value="Operasional">Operasional Outlet</option>
                  <option value="FAT">Finance, Accounting &amp; Tax</option>
                  <option value="IT">IT Support &amp; Network</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color: var(--ink-secondary);">Outlet Pilihan <span class="text-rose-500">*</span></label>
                <select id="inpOutlet" class="kov-field">
                  <option value="KOV Koffie Sula">KOV Koffie Sula (Holding)</option>
                  <option value="KOV Heritage Kota Lama">KOV Heritage Kota Lama</option>
                  <option value="KOV Motion Soeta">KOV Motion Soeta</option>
                  <option value="KOV Factory Rinjani">KOV Factory Rinjani</option>
                  <option value="Outlet Pekalongan">Outlet Pekalongan</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color: var(--ink-secondary);">Pendidikan Terakhir <span class="text-rose-500">*</span></label>
                <input type="text" id="inpPendidikan" value="D3 Perhotelan" required class="kov-field" placeholder="Contoh: S1 Manajemen, SMK Pariwisata">
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color: var(--ink-secondary);">Pengalaman Kerja Relevan</label>
                <input type="text" id="inpPengalaman" value="4 Tahun Barista &amp; Roastery" class="kov-field" placeholder="Contoh: 2 Tahun Head Barista">
              </div>
            </div>
          </div>

          <!-- Section 3: Payroll & Dokumen Berkas -->
          <div class="pt-6 border-t" style="border-color: var(--border-hairline);">
            <div class="flex items-center gap-2 mb-4">
              <span class="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white" style="background: var(--kov-pine);">3</span>
              <h3 class="font-display font-bold text-sm tracking-tight" style="color: var(--ink-primary);">Rekening Payroll &amp; Lampiran Berkas</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color: var(--ink-secondary);">Nomor Rekening Payroll <span class="text-rose-500">*</span></label>
                <input type="text" id="inpRekening" value="BCA 1234567890" required class="kov-field font-mono-num" placeholder="BCA / Mandiri / BNI / BRI">
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5" style="color: var(--ink-secondary);">Upload Berkas CV &amp; KTP (PDF / ZIP)</label>
                <input type="file" class="kov-field !py-2 text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer">
              </div>
            </div>
          </div>

          <!-- Form Action Footer -->
          <div class="pt-6 border-t flex flex-wrap items-center justify-between gap-4" style="border-color: var(--border-hairline);">
            <div class="flex items-center gap-2 text-xs" style="color: var(--ink-muted);">
              <svg class="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>Enkripsi data sesuai standar kepatuhan privasi karyawan KOV Group.</span>
            </div>

            <div class="flex items-center gap-3">
              <button type="reset" class="btn-outline">Reset Kolom</button>
              <button type="submit" class="btn-primary" id="btnSubmitBiodata">
                <svg class="kov-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                <span>Simpan &amp; Verifikasi Berkas</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>

    <!-- =====================================================================
         VIEW 2: DIREKTORI PELAMAR (Spacious Professional Data Table)
         ===================================================================== -->
    <section id="viewCandidates" class="hidden space-y-5">
      <!-- Filter Toolbar -->
      <div class="kov-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-2 flex-wrap">
          <button type="button" class="nav-tab-pill active" data-filter="all">Semua Status</button>
          <button type="button" class="nav-tab-pill" data-filter="Belum Diproses">Belum Diproses</button>
          <button type="button" class="nav-tab-pill" data-filter="Dipertimbangkan">Dipertimbangkan</button>
          <button type="button" class="nav-tab-pill" data-filter="Diterima">Diterima</button>
        </div>

        <div class="flex items-center gap-3">
          <input type="text" id="tableSearchInput" placeholder="Cari pelamar..." class="kov-field !h-9 text-xs !w-56">
          <select id="tableDivisiSelect" class="kov-field !h-9 text-xs !w-40 font-semibold">
            <option value="all">Semua Divisi</option>
            <option value="Barista">Barista</option>
            <option value="Kitchen">Kitchen</option>
            <option value="Operasional">Operasional</option>
            <option value="FAT">FAT</option>
            <option value="IT">IT Support</option>
          </select>
        </div>
      </div>

      <!-- Data Table Card -->
      <div class="kov-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="kov-table">
            <thead>
              <tr>
                <th style="width: 28%;">Kandidat &amp; Pendidikan</th>
                <th style="width: 24%;">Posisi &amp; Outlet</th>
                <th style="width: 26%;">NIK KTP &amp; Rekening</th>
                <th style="width: 22%; text-align: right;">Status &amp; Tindakan</th>
              </tr>
            </thead>
            <tbody id="candidateTableBody"></tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- =====================================================================
         VIEW 3: KALENDER SELEKSI & AGENDA INTERAKTIF
         ===================================================================== -->
    <section id="viewCalendar" class="hidden space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Calendar Grid (2 Cols) -->
        <div class="kov-card p-6 lg:col-span-2">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h2 class="font-display font-bold text-base" style="color: var(--ink-primary);" id="calHeaderTitle">Oktober 2026</h2>
              <p class="text-xs" style="color: var(--ink-muted);">Pilih tanggal untuk melihat atau menambahkan jadwal seleksi.</p>
            </div>
            <div class="flex items-center gap-1.5">
              <button type="button" id="btnCalPrev" class="btn-icon !w-8 !h-8 text-xs">&lsaquo;</button>
              <button type="button" id="btnCalNext" class="btn-icon !w-8 !h-8 text-xs">&rsaquo;</button>
            </div>
          </div>

          <div class="grid grid-cols-7 text-center font-bold text-xs mb-2 py-2 border-b" style="color: var(--ink-muted); border-color: var(--border-hairline);">
            <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span>
          </div>
          <div class="grid grid-cols-7 gap-1.5 font-mono-num text-sm" id="fullCalendarGrid"></div>
        </div>

        <!-- Agenda & Composer (1 Col) -->
        <div class="kov-card p-6 space-y-5">
          <div class="border-b pb-4" style="border-color: var(--border-hairline);">
            <h3 class="font-display font-bold text-sm" style="color: var(--ink-primary);">Tambah Agenda Seleksi</h3>
            <p class="text-xs mt-0.5" style="color: var(--ink-muted);">Tanggal terpilih: <span class="font-bold text-emerald-700" id="selectedDateLabel">24/10/2026</span></p>
          </div>

          <form id="calendarAgendaForm" class="space-y-3">
            <div>
              <label class="block text-xs font-semibold mb-1" style="color: var(--ink-secondary);">Judul Agenda / Nama Pelamar</label>
              <input type="text" id="calAgendaTitle" placeholder="Contoh: Interview Barista — Budi" required class="kov-field !h-9 text-xs">
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-semibold mb-1" style="color: var(--ink-secondary);">Kategori</label>
                <select id="calAgendaCategory" class="kov-field !h-9 text-xs">
                  <option value="Interview">Interview</option>
                  <option value="Uji Praktik">Uji Praktik</option>
                  <option value="Onboarding">Onboarding</option>
                  <option value="PKWT">Tanda Tangan PKWT</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1" style="color: var(--ink-secondary);">Jam</label>
                <input type="time" id="calAgendaTime" value="10:00" class="kov-field !h-9 text-xs font-mono-num">
              </div>
            </div>
            <button type="submit" class="btn-primary w-full !h-9 text-xs mt-2">
              + Simpan ke Jadwal
            </button>
          </form>

          <div class="pt-4 border-t" style="border-color: var(--border-hairline);">
            <h4 class="font-display font-bold text-xs uppercase tracking-wider mb-3" style="color: var(--ink-muted);">Daftar Agenda Aktif</h4>
            <div class="space-y-2 max-h-56 overflow-y-auto pr-1" id="agendaItemsList"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- =====================================================================
         VIEW 4: BERITA ACARA & PO OPERASIONAL
         ===================================================================== -->
    <section id="viewOperasional" class="hidden space-y-6">
      <div class="kov-card p-6">
        <div class="border-b pb-4 mb-4" style="border-color: var(--border-hairline);">
          <h2 class="font-display font-bold text-base" style="color: var(--ink-primary);">Pengajuan Berita Acara &amp; Purchase Order</h2>
          <p class="text-xs" style="color: var(--ink-muted);">Daftar pengajuan pengadaan barang outlet yang memerlukan otorisasi manajemen.</p>
        </div>

        <div class="overflow-x-auto">
          <table class="kov-table">
            <thead>
              <tr>
                <th>No. Dokumen</th>
                <th>Outlet &amp; Pemohon</th>
                <th>Perihal / Barang</th>
                <th class="text-right">Estimasi Biaya</th>
                <th class="text-right">Status &amp; Otorisasi</th>
              </tr>
            </thead>
            <tbody id="operasionalTableBody"></tbody>
          </table>
        </div>
      </div>
    </section>

  </main>

  <!-- =======================================================================
       4. MODAL DIALOGS (Symmetrical, Crisp, Professional)
       ======================================================================= -->
  <div id="candidateDetailModal" class="hidden modal-overlay">
    <div class="kov-card max-w-lg w-full p-6 sm:p-8 animate-fade" id="candidateModalContent"></div>
  </div>

  <div id="toastRoot" class="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"></div>

  <script>
    // State Store
    const state = {
      activeTab: 'form',
      activeRole: 'admin',
      filterStatus: 'all',
      filterDivisi: 'all',
      searchQuery: '',
      selectedDate: '24/10/2026',
      calMonth: 9,
      calYear: 2026,
      candidates: [
        { id: 1, nama: 'Budi Santoso', nik: '3374012410980001', rek: 'BCA 1234567890', hp: '0812-3456-7890', email: 'budi@kov.id', divisi: 'Barista', posisi: 'Head Barista', outlet: 'KOV Koffie Sula', pendidikan: 'D3 Perhotelan', pengalaman: '4 Tahun Barista & Roastery', status: 'Diterima', tanggal: '24/10/2026', catatan: 'Kalibrasi espresso sangat presisi dan latte art bersih.' },
        { id: 2, nama: 'Siti Rahma', nik: '3374021505000002', rek: 'Mandiri 9876543210', hp: '0823-4567-8901', email: 'siti@kov.id', divisi: 'Operasional', posisi: 'Supervisor Outlet', outlet: 'KOV Heritage Kota Lama', pendidikan: 'S1 Manajemen', pengalaman: '3 Tahun SPV F&B', status: 'Belum Diproses', tanggal: '24/10/2026', catatan: 'Pengalaman inventory dan POS cashier teruji.' },
        { id: 3, nama: 'Agus Setiawan', nik: '3374031102990003', rek: 'BRI 5556667778', hp: '0834-5678-9012', email: 'agus@kov.id', divisi: 'Kitchen', posisi: 'Pastry & Cook', outlet: 'KOV Motion Soeta', pendidikan: 'SMK Tata Boga', pengalaman: '2.5 Tahun Kitchen', status: 'Dipertimbangkan', tanggal: '23/10/2026', catatan: 'Croissant lamination perlu kalibrasi temperatur oven.' },
        { id: 4, nama: 'Dewi Lestari', nik: '3374040808010004', rek: 'BCA 1122334455', hp: '0845-6789-0123', email: 'dewi@kov.id', divisi: 'FAT', posisi: 'Finance & Tax Staff', outlet: 'Kantor Pusat Semarang', pendidikan: 'S1 Akuntansi', pengalaman: '3 Tahun Pajak & POS', status: 'Diterima', tanggal: '22/10/2026', catatan: 'Rekonsiliasi accurate dan e-Faktur sangat cepat.' },
        { id: 5, nama: 'Rian Firmansyah', nik: '3374051904970005', rek: 'BNI 7788990011', hp: '0856-7890-1234', email: 'rian@kov.id', divisi: 'IT', posisi: 'IT Support & Network', outlet: 'KOV Factory Rinjani', pendidikan: 'S1 Teknik Informatika', pengalaman: '4 Tahun Mikrotik & CCTV', status: 'Belum Diproses', tanggal: '26/10/2026', catatan: 'Keahlian Mikrotik routing & CCTV outlet sangat solid.' }
      ],
      memos: [
        { id: 101, tanggal: '24/10/2026', waktu: '10:00', kategori: 'Interview', judul: 'Interview Barista — Budi Santoso', selesai: false },
        { id: 102, tanggal: '24/10/2026', waktu: '14:00', kategori: 'Uji Praktik', judul: 'Uji Kalibrasi Espresso Siti Rahma', selesai: false },
        { id: 103, tanggal: '26/10/2026', waktu: '09:30', kategori: 'PKWT', judul: 'Tanda Tangan PKWT Karyawan Baru', selesai: false }
      ],
      baList: [
        { id: 201, no: 'BA/OPS/2026/001', outlet: 'Outlet Pekalongan', pemohon: 'Hendra Saputra', perihal: 'Mesin Grinder Espresso Nuova Simonelli', estimasi: 12500000, status: 'Menunggu Approval' },
        { id: 202, no: 'BA/OPS/2026/002', outlet: 'Kantor Pusat Semarang', pemohon: 'Budi Santoso', perihal: 'Freezer Stainless 4 Pintu', estimasi: 24000000, status: 'Disetujui' }
      ]
    };

    function showToast(title, msg, type = 'success') {
      const root = document.getElementById('toastRoot');
      const toast = document.createElement('div');
      toast.className = 'kov-card p-4 flex items-start gap-3 pointer-events-auto border-l-4';
      toast.style.borderLeftColor = type === 'error' ? '#e11d48' : '#166534';
      toast.innerHTML = \`
        <div class="flex-1">
          <div class="font-display font-bold text-xs" style="color: var(--ink-primary);">\${title}</div>
          <div class="text-[11px] mt-0.5" style="color: var(--ink-muted);">\${msg}</div>
        </div>
      \`;
      root.appendChild(toast);
      setTimeout(() => { toast.remove(); }, 2800);
    }

    function renderWorkspaceTabs() {
      const tabs = document.querySelectorAll('#mainWorkspaceTabs button');
      tabs.forEach(btn => {
        const t = btn.getAttribute('data-tab');
        btn.classList.toggle('active', t === state.activeTab);
      });

      document.getElementById('viewForm').classList.toggle('hidden', state.activeTab !== 'form');
      document.getElementById('viewCandidates').classList.toggle('hidden', state.activeTab !== 'candidates');
      document.getElementById('viewCalendar').classList.toggle('hidden', state.activeTab !== 'calendar');
      document.getElementById('viewOperasional').classList.toggle('hidden', state.activeTab !== 'operasional');

      const headlines = {
        form: 'Sistem Formulir Biodata Terpadu',
        candidates: 'Direktori Calon Karyawan',
        calendar: 'Agenda & Kalender Seleksi HRD',
        operasional: 'Pengajuan Berita Acara & PO'
      };
      const subtitles = {
        form: 'Pendaftaran calon karyawan resmi, otorisasi data KTP, dan arsip terpusat KOV Koffie Group.',
        candidates: 'Daftar kandidat pelamar yang telah masuk, verifikasi status berkas, dan ekspor dokumen.',
        calendar: 'Jadwalkan agenda interview, uji praktik, dan penandatanganan kontrak kerja.',
        operasional: 'Otorisasi kebutuhan barang dan pengadaan inventaris seluruh cabang outlet.'
      };
      document.getElementById('heroHeadline').textContent = headlines[state.activeTab];
      document.getElementById('heroSubtitle').textContent = subtitles[state.activeTab];
    }

    function renderCandidatesTable() {
      const tbody = document.getElementById('candidateTableBody');
      const isReviewer = state.activeRole === 'reviewer';

      const filtered = state.candidates.filter(c => {
        const matchStatus = state.filterStatus === 'all' || c.status === state.filterStatus;
        const matchDivisi = state.filterDivisi === 'all' || c.divisi === state.filterDivisi;
        const matchSearch = !state.searchQuery || \`\${c.nama} \${c.nik} \${c.posisi} \${c.outlet}\`.toLowerCase().includes(state.searchQuery);
        return matchStatus && matchDivisi && matchSearch;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-10 text-xs text-slate-500">Tidak ada data pelamar yang cocok.</td></tr>';
        return;
      }

      tbody.innerHTML = filtered.map(c => {
        const badgeClass = c.status === 'Diterima' ? 'badge-emerald' : (c.status === 'Belum Diproses' ? 'badge-blue' : 'badge-amber');
        const displayNik = isReviewer ? c.nik.slice(0, 6) + '******' + c.nik.slice(-2) : c.nik;

        return \`
          <tr>
            <td>
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs" style="background: var(--status-emerald-bg); color: var(--status-emerald-ink); border: 1px solid var(--status-emerald-border);">
                  \${c.nama.charAt(0)}
                </div>
                <div>
                  <div class="font-display font-bold text-xs sm:text-sm" style="color: var(--ink-primary);">\${c.nama}</div>
                  <div class="text-[11px]" style="color: var(--ink-muted);">\${c.pendidikan} &bull; Tgl: \${c.tanggal}</div>
                </div>
              </div>
            </td>
            <td>
              <div class="font-semibold text-xs" style="color: var(--ink-primary);">\${c.posisi}</div>
              <div class="text-[11px] mt-0.5" style="color: var(--ink-muted);">\${c.outlet} &bull; <span class="badge badge-emerald !text-[9.5px] !py-0 !px-1.5">\${c.divisi}</span></div>
            </td>
            <td>
              <div class="font-mono-num text-xs font-semibold" style="color: var(--ink-primary);">\${displayNik}</div>
              <div class="font-mono-num text-[11px]" style="color: var(--ink-muted);">\${c.rek} &bull; \${c.hp}</div>
            </td>
            <td class="text-right">
              <div class="inline-flex items-center gap-2">
                <span class="badge \${badgeClass}">\${c.status}</span>
                <button type="button" class="btn-outline !h-8 !px-2.5 !text-xs" onclick="openCandidateDetail(\${c.id})">Detail</button>
              </div>
            </td>
          </tr>
        \`;
      }).join('');
    }

    function openCandidateDetail(id) {
      const c = state.candidates.find(x => x.id === id);
      if (!c) return;

      const modal = document.getElementById('candidateDetailModal');
      const box = document.getElementById('candidateModalContent');
      box.innerHTML = \`
        <div class="flex items-center justify-between pb-4 mb-4 border-b" style="border-color: var(--border-hairline);">
          <div>
            <h3 class="font-display text-base font-bold">\${c.nama}</h3>
            <p class="text-xs mt-0.5" style="color: var(--ink-muted);">\${c.posisi} &bull; \${c.outlet}</p>
          </div>
          <button type="button" class="btn-icon !w-7 !h-7 text-xs" onclick="closeModal()">&times;</button>
        </div>
        <div class="space-y-3 text-xs">
          <div class="flex justify-between py-1 border-b" style="border-color: var(--border-subtle);"><span class="text-slate-500">NIK KTP</span><span class="font-mono-num font-semibold">\${c.nik}</span></div>
          <div class="flex justify-between py-1 border-b" style="border-color: var(--border-subtle);"><span class="text-slate-500">Kontak WhatsApp</span><span class="font-mono-num font-semibold">\${c.hp}</span></div>
          <div class="flex justify-between py-1 border-b" style="border-color: var(--border-subtle);"><span class="text-slate-500">Rekening Payroll</span><span class="font-mono-num font-semibold">\${c.rek}</span></div>
          <div class="flex justify-between py-1 border-b" style="border-color: var(--border-subtle);"><span class="text-slate-500">Pengalaman</span><span class="font-semibold">\${c.pengalaman}</span></div>
          <div class="p-3 rounded-lg mt-3" style="background: var(--bg-subtle);">
            <div class="font-bold text-[10px] uppercase text-slate-500 mb-1">Catatan Evaluasi HRD</div>
            <div class="text-xs italic">"\${c.catatan}"</div>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6 pt-4 border-t" style="border-color: var(--border-hairline);">
          <button type="button" class="btn-outline !h-9 text-xs" onclick="updateStatus(\${c.id}, 'Dipertimbangkan')">Pertimbangkan</button>
          <button type="button" class="btn-primary !h-9 text-xs" onclick="updateStatus(\${c.id}, 'Diterima')">Terima Pelamar</button>
        </div>
      \`;
      modal.classList.remove('hidden');
    }

    function closeModal() {
      document.getElementById('candidateDetailModal').classList.add('hidden');
    }

    function updateStatus(id, newStatus) {
      const c = state.candidates.find(x => x.id === id);
      if (c) {
        c.status = newStatus;
        closeModal();
        renderCandidatesTable();
        showToast('Status Diperbarui', \`\${c.nama} telah ditandai \${newStatus}.\`);
      }
    }

    function renderCalendar() {
      const grid = document.getElementById('fullCalendarGrid');
      grid.innerHTML = '';
      for (let d = 1; d <= 31; d++) {
        const dateStr = \`\${String(d).padStart(2, '0')}/10/2026\`;
        const isSelected = state.selectedDate === dateStr;
        const hasMemo = state.memos.some(m => m.tanggal === dateStr);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = \`h-10 rounded-lg flex flex-col items-center justify-center font-semibold text-xs border transition \${isSelected ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white hover:bg-slate-100 border-slate-200'}\`;
        btn.innerHTML = \`
          <span>\${d}</span>
          \${hasMemo ? \`<span class="w-1.5 h-1.5 rounded-full \${isSelected ? 'bg-white' : 'bg-emerald-600'} mt-0.5"></span>\` : ''}
        \`;
        btn.onclick = () => {
          state.selectedDate = dateStr;
          document.getElementById('selectedDateLabel').textContent = dateStr;
          renderCalendar();
          renderMemos();
        };
        grid.appendChild(btn);
      }
    }

    function renderMemos() {
      const list = document.getElementById('agendaItemsList');
      const filtered = state.memos.filter(m => m.tanggal === state.selectedDate);

      if (filtered.length === 0) {
        list.innerHTML = '<div class="text-xs text-slate-400 py-3 text-center">Tidak ada agenda pada tanggal ini.</div>';
        return;
      }

      list.innerHTML = filtered.map(m => \`
        <div class="p-2.5 rounded-lg border text-xs flex items-center justify-between" style="background: var(--bg-surface); border-color: var(--border-hairline);">
          <div>
            <div class="font-bold">\${m.judul}</div>
            <div class="text-[10px] text-slate-500 mt-0.5 font-mono-num">\${m.waktu} &bull; \${m.kategori}</div>
          </div>
          <span class="badge badge-emerald !text-[9.5px]">Aktif</span>
        </div>
      \`).join('');
    }

    function renderOperasionalTable() {
      const tbody = document.getElementById('operasionalTableBody');
      tbody.innerHTML = state.baList.map(r => \`
        <tr>
          <td><span class="font-mono-num font-bold text-xs">\${r.no}</span></td>
          <td><div class="font-bold text-xs">\${r.outlet}</div><div class="text-[11px] text-slate-500">\${r.pemohon}</div></td>
          <td><div class="text-xs">\${r.perihal}</div></td>
          <td class="text-right"><span class="font-mono-num font-bold text-xs text-emerald-800">Rp \${r.estimasi.toLocaleString('id-ID')}</span></td>
          <td class="text-right">
            <span class="badge \${r.status === 'Disetujui' ? 'badge-emerald' : 'badge-amber'}">\${r.status}</span>
          </td>
        </tr>
      \`).join('');
    }

    // Event Listeners
    document.getElementById('mainWorkspaceTabs').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-tab]');
      if (!btn) return;
      state.activeTab = btn.getAttribute('data-tab');
      renderWorkspaceTabs();
    });

    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        state.filterStatus = e.currentTarget.getAttribute('data-filter');
        renderCandidatesTable();
      });
    });

    document.getElementById('tableSearchInput').addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      renderCandidatesTable();
    });

    document.getElementById('tableDivisiSelect').addEventListener('change', (e) => {
      state.filterDivisi = e.target.value;
      renderCandidatesTable();
    });

    document.getElementById('candidateApplicationForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const nama = document.getElementById('inpNama').value.trim();
      const nik = document.getElementById('inpNik').value.trim();
      const hp = document.getElementById('inpHp').value.trim();
      const email = document.getElementById('inpEmail').value.trim();
      const divisi = document.getElementById('inpDivisi').value;
      const outlet = document.getElementById('inpOutlet').value;
      const pendidikan = document.getElementById('inpPendidikan').value;
      const rek = document.getElementById('inpRekening').value;
      const pengalaman = document.getElementById('inpPengalaman').value;

      state.candidates.unshift({
        id: Date.now(),
        nama,
        nik,
        hp,
        email,
        divisi,
        posisi: 'Calon Staff ' + divisi,
        outlet,
        pendidikan,
        pengalaman,
        rek,
        status: 'Belum Diproses',
        tanggal: '24/10/2026',
        catatan: 'Pendaftaran mandiri melalui Sistem Formulir Biodata.'
      });

      renderCandidatesTable();
      showToast('Pendaftaran Berhasil', \`Biodata \${nama} berhasil disimpan ke sistem.\`);
      state.activeTab = 'candidates';
      renderWorkspaceTabs();
    });

    document.getElementById('calendarAgendaForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const judul = document.getElementById('calAgendaTitle').value.trim();
      const kategori = document.getElementById('calAgendaCategory').value;
      const waktu = document.getElementById('calAgendaTime').value;

      state.memos.push({
        id: Date.now(),
        tanggal: state.selectedDate,
        waktu,
        kategori,
        judul,
        selesai: false
      });

      document.getElementById('calAgendaTitle').value = '';
      renderCalendar();
      renderMemos();
      showToast('Agenda Tersimpan', \`\${judul} dijadwalkan pada \${state.selectedDate}\`);
    });

    document.getElementById('roleSelector').addEventListener('change', (e) => {
      state.activeRole = e.target.value;
      renderCandidatesTable();
      showToast('Peran Diubah', 'Beralih ke mode: ' + e.target.options[e.target.selectedIndex].text);
    });

    document.getElementById('btnToggleTheme').addEventListener('click', () => {
      const html = document.documentElement;
      const isDark = html.getAttribute('data-theme') === 'dark';
      if (isDark) {
        html.removeAttribute('data-theme');
        showToast('Tema Terang', 'Palet KOV Botanical Pine aktif.');
      } else {
        html.setAttribute('data-theme', 'dark');
        showToast('Tema Gelap', 'Palet Obsidian Slate aktif.');
      }
    });

    // Init
    renderWorkspaceTabs();
    renderCandidatesTable();
    renderCalendar();
    renderMemos();
    renderOperasionalTable();
  </script>
</body>
</html>
`;

// Write to Downloads
const destDownload = 'C:\\\\Users\\\\ACER\\\\Downloads\\\\kov_koffie_natural_pastel_hand_crafted_system_layout.html';
fs.writeFileSync(destDownload, newHtml, 'utf8');
console.log('Successfully written to Downloads:', destDownload);

// Write to public/kov_layout.html
const destPublic = 'C:\\\\Users\\\\ACER\\\\recruitment-biodata-app\\\\public\\\\kov_layout.html';
fs.writeFileSync(destPublic, newHtml, 'utf8');
console.log('Successfully written to Public:', destPublic);
