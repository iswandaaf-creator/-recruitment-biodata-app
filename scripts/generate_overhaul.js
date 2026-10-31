const fs = require('fs');
const path = require('path');

const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KOV Koffie — Management Portal &amp; Executive Layout</title>
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
      /* Typography System */
      --font-display: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;

      /* KOV Executive Minimalist Palette (Framed-Sheet Architecture) */
      --bg-canvas: #f8fafc;
      --bg-surface: #ffffff;
      --bg-sidebar: #ffffff;
      --bg-subtle: #f8fafc;
      --bg-hover: #f1f5f9;

      /* Hairline Rules & Dividers */
      --border-hairline: #e2e8f0;
      --border-subtle: #f1f5f9;
      --border-input: #cbd5e1;
      --border-input-focus: #166534;

      /* Typography Inks */
      --ink-primary: #0f172a;      /* Obsidian Slate 900 - 14:1 contrast */
      --ink-secondary: #334155;    /* Slate 700 - Body & Data */
      --ink-muted: #64748b;        /* Slate 500 - Captions & Metadata */
      --ink-faint: #94a3b8;        /* Slate 400 - Placeholders */

      /* Brand Accents - KOV Botanical Pine */
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

      --status-slate-bg: #f8fafc;
      --status-slate-border: #e2e8f0;
      --status-slate-ink: #334155;

      /* Mathematical Symmetrical Geometry */
      --radius-sm: 6px;
      --radius-md: 8px;
      --radius-lg: 12px;
      --radius-xl: 14px;
      --radius-pill: 9999px;

      /* Crisp Professional Shadows */
      --shadow-subtle: 0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03);
      --shadow-hover: 0 4px 12px -2px rgba(15, 23, 42, 0.08);
      --shadow-dropdown: 0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
      --shadow-modal: 0 20px 25px -5px rgba(15, 23, 42, 0.15), 0 10px 10px -5px rgba(15, 23, 42, 0.04);
      --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Dark Mode Palette (Executive Slate) */
    [data-theme="dark"] {
      --bg-canvas: #090d16;
      --bg-surface: #111827;
      --bg-sidebar: #0d131f;
      --bg-subtle: #172033;
      --bg-hover: #1e293b;

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

      --status-slate-bg: #1e293b;
      --status-slate-border: #334155;
      --status-slate-ink: #cbd5e1;
    }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      width: 100vw;
      height: 100vh;
      font-family: var(--font-sans);
      background-color: var(--bg-canvas);
      color: var(--ink-primary);
      -webkit-font-smoothing: antialiased;
      overflow: hidden;
    }

    input, select, textarea, button {
      color: var(--ink-primary);
      font-family: inherit;
    }

    .font-display {
      font-family: var(--font-display);
      letter-spacing: -0.025em;
      color: var(--ink-primary);
    }

    .font-mono-num {
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
    }

    /* Crisp SVG Line Icons */
    .kov-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      stroke-width: 1.85;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition: all 0.15s ease;
    }

    /* Subtle Transitions */
    @keyframes fadeIn {
      0% { opacity: 0; transform: translateY(4px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes laserSweep {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    @keyframes shakeSlight {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-4px); }
      40%, 80% { transform: translateX(4px); }
    }
    @keyframes drawCheck {
      to { stroke-dashoffset: 0; }
    }

    .animate-fade { animation: fadeIn 0.22s var(--ease-smooth) both; }
    .kov-shake { animation: shakeSlight 0.32s ease both !important; }
    .kov-input-error {
      border-color: #e11d48 !important;
      background-color: var(--status-rose-bg) !important;
    }

    .kov-laser-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 2.5px;
      z-index: 99999;
      background: linear-gradient(90deg, #166534, #059669, #3b82f6, #166534);
      background-size: 200% 100%;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    }
    .kov-laser-bar.is-loading {
      opacity: 1;
      animation: laserSweep 1s linear infinite;
    }

    /* =========================================================================
       LAYOUT ARCHITECTURE: SYMMETRICAL FRAMED-SHEET
       ========================================================================= */
    .atelier-shell {
      display: flex;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }

    /* 1. Left Dock / Sidebar (232px) */
    .atelier-sidebar {
      width: 232px;
      flex: 0 0 232px;
      height: 100vh;
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border-hairline);
      display: flex;
      flex-direction: column;
      transition: width 0.2s var(--ease-smooth), flex-basis 0.2s var(--ease-smooth);
      z-index: 30;
    }
    .atelier-sidebar.collapsed {
      width: 68px;
      flex: 0 0 68px;
    }
    .atelier-sidebar.collapsed .hide-on-collapse { display: none !important; }
    .atelier-sidebar.collapsed .nav-btn { justify-content: center; padding: 10px 0; }

    .nav-group-heading {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--ink-muted);
      padding: 16px 14px 6px;
    }

    .nav-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 9px 12px;
      border-radius: var(--radius-md);
      font-size: 13px;
      font-weight: 500;
      color: var(--ink-secondary);
      background: transparent;
      border: 1px solid transparent;
      cursor: pointer;
      text-align: left;
      white-space: nowrap;
      transition: all 0.16s ease;
    }
    .nav-btn:hover {
      background: var(--bg-hover);
      color: var(--ink-primary);
    }
    .nav-btn.active {
      background: var(--kov-pine-light);
      color: var(--kov-pine);
      border-color: var(--kov-pine-border);
      font-weight: 600;
    }
    .nav-btn.active .kov-icon {
      stroke: var(--kov-pine);
    }

    /* 2. Main Content Canvas */
    .atelier-main {
      flex: 1 1 0%;
      min-width: 0;
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--bg-canvas);
      overflow: hidden;
    }

    .atelier-scroll {
      flex: 1 1 0%;
      overflow-y: auto;
      padding: 24px 32px 36px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* Editorial Header Band */
    .editorial-header-band {
      display: grid;
      grid-template-columns: 1.25fr 1fr;
      gap: 24px;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border-hairline);
    }
    @media (max-width: 960px) {
      .editorial-header-band { grid-template-columns: 1fr; }
    }

    /* Symmetrical 3-Card Summary Cluster */
    .tonal-summary-strip {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    @media (max-width: 640px) {
      .tonal-summary-strip { grid-template-columns: 1fr; }
    }

    .tonal-pill-card {
      padding: 14px 16px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-hairline);
      background: var(--bg-surface);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      box-shadow: var(--shadow-subtle);
      transition: transform 0.16s ease, box-shadow 0.16s ease;
    }
    .tonal-pill-card:hover {
      transform: translateY(-1.5px);
      box-shadow: var(--shadow-hover);
    }

    /* Symmetrical Workspace Grid */
    .workspace-asymmetric-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 280px;
      gap: 24px;
      align-items: start;
    }
    .workspace-asymmetric-grid.calendar-collapsed {
      grid-template-columns: minmax(0, 1fr);
    }
    .workspace-asymmetric-grid.calendar-collapsed #hrRightSidebar {
      display: none !important;
    }
    @media (max-width: 920px) {
      .workspace-asymmetric-grid { grid-template-columns: minmax(0, 1fr); }
    }

    /* Symmetrical Framed Cards */
    .kov-paper-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-subtle);
      overflow: hidden;
    }

    .kov-pad-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-subtle);
      overflow: hidden;
    }

    /* Status Pills */
    .status-pill {
      border-radius: var(--radius-pill);
      padding: 3.5px 10px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.01em;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
      border: 1px solid transparent;
    }
    .pill-emerald  { background: var(--status-emerald-bg); color: var(--status-emerald-ink); border-color: var(--status-emerald-border); }
    .pill-peach    { background: var(--status-amber-bg); color: var(--status-amber-ink); border-color: var(--status-amber-border); }
    .pill-ochre    { background: var(--status-amber-bg); color: var(--status-amber-ink); border-color: var(--status-amber-border); }
    .pill-lavender { background: var(--status-blue-bg); color: var(--status-blue-ink); border-color: var(--status-blue-border); }
    .pill-rose     { background: var(--status-rose-bg); color: var(--status-rose-ink); border-color: var(--status-rose-border); }

    /* Symmetrical High-Craft Buttons */
    .btn-kov-primary {
      height: 38px;
      padding: 0 16px;
      border-radius: var(--radius-md);
      background: var(--kov-pine);
      color: #ffffff;
      border: 1px solid transparent;
      font-size: 12.5px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      cursor: pointer;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.16s ease;
      white-space: nowrap;
    }
    .btn-kov-primary:hover {
      background: var(--kov-pine-hover);
      transform: translateY(-0.5px);
    }
    .btn-kov-primary:active {
      transform: translateY(0);
    }

    .btn-kov-outline {
      height: 38px;
      padding: 0 14px;
      border-radius: var(--radius-md);
      background: var(--bg-surface);
      color: var(--ink-secondary);
      border: 1px solid var(--border-input);
      font-size: 12.5px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      cursor: pointer;
      transition: all 0.16s ease;
      white-space: nowrap;
    }
    .btn-kov-outline:hover {
      background: var(--bg-hover);
      border-color: #94a3b8;
      color: var(--ink-primary);
    }

    .kov-soft-icon-btn {
      background: transparent;
      color: var(--ink-secondary);
      border-radius: var(--radius-sm);
      transition: all 0.15s ease;
    }
    .kov-soft-icon-btn:hover {
      background: var(--bg-hover);
      color: var(--ink-primary);
    }

    /* Filter Tabs */
    .kov-tab-pill {
      height: 32px;
      padding: 0 14px;
      border-radius: var(--radius-md);
      font-size: 12px;
      font-weight: 500;
      color: var(--ink-secondary);
      background: transparent;
      border: 1px solid transparent;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .kov-tab-pill:hover {
      color: var(--ink-primary);
      background: var(--bg-hover);
    }
    .kov-tab-pill.active {
      background: var(--kov-pine);
      color: #ffffff;
      font-weight: 600;
      border-color: var(--kov-pine);
      box-shadow: 0 1px 2px rgba(22, 101, 52, 0.2);
    }

    /* Crisp Data Table */
    .kov-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      color: var(--ink-primary);
    }
    .kov-table thead th {
      color: var(--ink-muted);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 12px 20px;
      border-bottom: 1px solid var(--border-hairline);
      text-align: left;
      white-space: nowrap;
      background: var(--bg-subtle);
    }
    .kov-table tbody td {
      height: 60px;
      padding: 12px 20px;
      border-bottom: 1px solid var(--border-subtle);
      vertical-align: middle;
      white-space: nowrap;
      color: var(--ink-primary);
    }
    .kov-table tbody tr:last-child td { border-bottom: none; }
    .kov-table tbody tr:hover td { background: var(--bg-hover); }

    /* Calendar Grid */
    .cal-day-btn {
      height: 30px;
      width: 100%;
      border-radius: var(--radius-sm);
      font-size: 11.5px;
      font-weight: 500;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border: 1px solid transparent;
      background: transparent;
      color: var(--ink-primary);
      transition: all 0.14s ease;
    }
    .cal-day-btn:hover {
      background: var(--bg-hover);
      color: var(--ink-primary);
    }
    .cal-day-btn.active {
      background: var(--kov-pine) !important;
      color: #ffffff !important;
      font-weight: 700;
    }
    .cal-dot {
      width: 4px;
      height: 4px;
      border-radius: 999px;
      margin-top: 1px;
    }

    /* Symmetrical Form Architecture */
    .kov-input, .kov-pastel-input {
      height: 40px;
      padding: 0 13px;
      background-color: var(--bg-surface) !important;
      color: var(--ink-primary) !important;
      border: 1px solid var(--border-input);
      border-radius: var(--radius-md);
      font-size: 13px;
      outline: none;
      transition: border-color 0.16s ease, box-shadow 0.16s ease;
      width: 100%;
    }
    .kov-input:focus, .kov-pastel-input:focus {
      border-color: var(--border-input-focus);
      box-shadow: 0 0 0 3px rgba(22, 101, 52, 0.12);
    }
    select.kov-input, select.kov-pastel-input {
      padding-right: 28px;
    }

    /* Toast Stack & Modal Backdrop */
    .kov-toast-stack {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 340px;
      pointer-events: none;
    }
    .kov-toast-card {
      pointer-events: auto;
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-lg);
      padding: 13px 16px;
      box-shadow: var(--shadow-dropdown);
      display: flex;
      align-items: center;
      gap: 12px;
      animation: fadeIn 0.2s var(--ease-smooth) forwards;
    }
    .kov-submit-overlay, .kov-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(4px);
      z-index: 99998;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .kov-submit-modal {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: var(--radius-xl);
      padding: 28px 32px;
      max-width: 360px;
      width: 100%;
      text-align: center;
      box-shadow: var(--shadow-modal);
      animation: fadeIn 0.22s var(--ease-smooth) forwards;
    }
  </style>
</head>
<body>

  <!-- Top Laser Loading Bar -->
  <div class="kov-laser-bar" id="topLaserBar"></div>

  <div class="atelier-shell">

    <!-- =======================================================================
         1. LEFT SIDEBAR (EXECUTIVE MINIMALIST DOCK - KOV BOTANICAL PINE)
         ======================================================================= -->
    <aside class="atelier-sidebar" id="kovSidebar">
      <!-- Brand Header -->
      <div class="h-16 px-4 border-b flex items-center justify-between gap-2" style="border-color: var(--border-hairline);">
        <div class="flex items-center gap-2.5 overflow-hidden">
          <img src="data:image/jpeg;base64,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" alt="KOV Logo" class="w-8 h-8 rounded-lg border p-0.5 object-cover bg-white flex-shrink-0" style="border-color: var(--border-hairline);">
          <div class="hide-on-collapse leading-tight">
            <div class="font-display font-bold text-xs tracking-tight" style="color: var(--ink-primary);">KOV Koffie<span style="color: var(--kov-pine);">.</span></div>
            <div class="text-[10px] font-medium" style="color: var(--ink-muted);">Management Portal</div>
          </div>
        </div>
        <button type="button" id="btnCollapseSidebar" class="w-7 h-7 rounded-md kov-soft-icon-btn flex items-center justify-center flex-shrink-0" title="Lipat Navigasi">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
      </div>

      <!-- Navigation Menu -->
      <nav class="flex-1 overflow-y-auto px-3 py-3 space-y-1" id="sidebarNav"></nav>

      <!-- Bottom Role Switcher & Theme Control -->
      <div class="p-3 border-t space-y-2.5" style="border-color: var(--border-hairline);">
        <div class="p-2.5 rounded-lg border hide-on-collapse" style="background: var(--bg-subtle); border-color: var(--border-hairline);">
          <label for="roleSelector" class="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style="color: var(--ink-muted);">Peran Aktif (RBAC)</label>
          <select id="roleSelector" class="w-full h-8 px-2.5 rounded-md border text-xs font-semibold outline-none cursor-pointer" style="background: var(--bg-surface); color: var(--ink-primary); border-color: var(--border-input);">
            <option value="admin">Super Admin HR</option>
            <option value="reviewer">Reviewer Divisi</option>
            <option value="manager">Manajer Operasional</option>
          </select>
        </div>

        <button type="button" id="btnToggleTheme" class="w-full h-8 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition" style="background: var(--bg-surface); border-color: var(--border-hairline); color: var(--ink-secondary);" title="Ubah Tema Tampilan">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
          <span class="hide-on-collapse" id="themeLabel">Mode Gelap</span>
        </button>
      </div>
    </aside>

    <!-- =======================================================================
         2. MAIN SYSTEM WORKSPACE (EXECUTIVE MINIMALIST ARCHITECTURE)
         ======================================================================= -->
    <main class="atelier-main" id="mainWorkspace">
      <!-- Top Bar (64px) -->
      <header class="h-16 px-8 border-b flex items-center justify-between gap-4 flex-shrink-0" style="background: var(--bg-surface); border-color: var(--border-hairline);">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="status-pill pill-emerald font-mono-num font-semibold" id="activeRoleBadge">Super Admin HR</span>
          <span class="text-xs hidden sm:inline" style="color: var(--ink-muted);">/</span>
          <span class="text-xs font-medium truncate hidden sm:inline" style="color: var(--ink-secondary);">KOV Semarang Roastery &amp; People</span>
        </div>

        <div class="flex items-center gap-3 flex-shrink-0">
          <!-- Search Bar -->
          <div class="flex items-center gap-2 h-9 px-3.5 rounded-lg border w-48 sm:w-64" style="background: var(--bg-subtle); border-color: var(--border-hairline);">
            <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" id="globalSearchInput" class="bg-transparent border-none outline-none text-xs font-medium w-full" style="color: var(--ink-primary);" placeholder="Cari nama, NIK, outlet...">
          </div>

          <button type="button" id="btnToggleRightCalendar" class="btn-kov-outline !h-9 text-xs" title="Sembunyikan / Tampilkan Kalender">
            <svg class="kov-icon !w-4 !h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span class="hidden sm:inline">Kalender</span>
          </button>

          <button type="button" id="btnTopbarPrimary" class="btn-kov-primary !h-9 text-xs">
            <svg class="kov-icon !w-4 !h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <span id="topbarPrimaryLabel">Salin Link Form</span>
          </button>
        </div>
      </header>

      <!-- Scrollable Workspace Body -->
      <div class="atelier-scroll">

        <!-- Row 1: Editorial Title Band + Symmetrical Metric Cards -->
        <section class="editorial-header-band">
          <div>
            <div class="flex items-center gap-2.5">
              <h1 class="font-display text-2xl font-bold tracking-tight" id="pageTitleHeading">Direktori Kandidat Pelamar</h1>
              <span class="status-pill pill-emerald font-mono-num font-semibold" id="headerCountPill">5 Data</span>
            </div>
            <p class="text-xs mt-1.5 leading-relaxed" style="color: var(--ink-muted);" id="pageSubtitleText">
              Direktori kandidat resmi, verifikasi berkas, dan agenda seleksi terintegrasi KOV Group.
            </p>
          </div>

          <!-- Symmetrical 3-Card Summary Cluster -->
          <div class="tonal-summary-strip" id="roleMetricTilesContainer"></div>
        </section>

        <!-- Row 2: Symmetrical 2-Column Workspace (Data Sheet + Agenda Memo Pad) -->
        <section class="workspace-asymmetric-grid" id="bentoWorkspaceGrid">
          <!-- Left: Main Module Sheet -->
          <div id="moduleContainer" class="animate-fade min-w-0"></div>

          <!-- Right: Calendar & Agenda Memo Pad -->
          <aside class="kov-pad-card" id="hrRightSidebar">
            <div class="px-5 py-4 border-b flex items-center justify-between" style="border-color: var(--border-hairline);">
              <div class="flex items-center gap-2">
                <svg class="kov-icon !w-4 !h-4" viewBox="0 0 24 24" fill="none" stroke="var(--kov-pine)">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <h2 class="font-display text-xs font-bold">Kalender &amp; Memo</h2>
              </div>
              <button type="button" id="btnNotifBell" class="status-pill pill-ochre cursor-pointer" title="Agenda Aktif">
                <span class="font-mono-num" id="pendingTaskBadge">3 Notif</span>
              </button>
            </div>

            <div class="p-4 space-y-4">
              <!-- Mini Calendar Grid -->
              <div class="p-3.5 rounded-xl border" style="background: var(--bg-subtle); border-color: var(--border-hairline);">
                <div class="flex items-center justify-between mb-2.5">
                  <span class="font-display text-xs font-bold" id="calTitle">Oktober 2026</span>
                  <div class="flex items-center gap-1">
                    <button type="button" id="btnPrevMonth" class="w-6 h-6 rounded kov-soft-icon-btn text-xs flex items-center justify-center font-bold" title="Bulan Sebelumnya">&lsaquo;</button>
                    <button type="button" id="btnResetCalDate" class="px-2 h-6 rounded text-[11px] font-semibold kov-soft-icon-btn" style="color: var(--kov-pine);">Semua</button>
                    <button type="button" id="btnNextMonth" class="w-6 h-6 rounded kov-soft-icon-btn text-xs flex items-center justify-center font-bold" title="Bulan Berikutnya">&rsaquo;</button>
                  </div>
                </div>

                <div class="grid grid-cols-7 text-center text-[10px] font-bold mb-1.5" style="color: var(--ink-muted);">
                  <span>Sn</span><span>Sl</span><span>Rb</span><span>Km</span><span>Jm</span><span>Sb</span><span>Mg</span>
                </div>
                <div class="grid grid-cols-7 gap-1 font-mono-num" id="calendarGrid"></div>
              </div>

              <!-- Click-Date Memo Composer -->
              <div class="p-4 rounded-xl border" style="background: var(--status-emerald-bg); border-color: var(--status-emerald-border);" id="memoComposerCard">
                <div class="flex items-center justify-between mb-2.5">
                  <span class="text-xs font-bold" style="color: var(--status-emerald-ink);">Catatan Tanggal</span>
                  <span class="font-mono-num text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border" style="color: var(--status-emerald-ink); border-color: var(--status-emerald-border);" id="composerSelectedDateBadge">24/10/2026</span>
                </div>

                <form id="hrMemoForm" class="space-y-2.5" novalidate>
                  <div>
                    <input type="text" id="memoTitleInput" placeholder="Tulis agenda / memo HRD..." class="kov-pastel-input !h-9 text-xs" style="border-color: var(--status-emerald-border);">
                    <div id="memoInlineError" class="hidden items-center gap-1 text-[11px] font-semibold mt-1" style="color: var(--status-rose-ink);">
                      <span id="memoInlineErrorText">Isi memo wajib ditulis dulu!</span>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <select id="memoCategorySelect" class="kov-pastel-input !h-8 text-xs font-semibold" style="border-color: var(--status-emerald-border);" aria-label="Kategori Memo">
                      <option value="Interview">Interview</option>
                      <option value="Uji Praktik">Uji Praktik</option>
                      <option value="Approval">Approval</option>
                      <option value="Onboarding">Onboarding</option>
                    </select>
                    <input type="time" id="memoTimeInput" value="10:00" class="kov-pastel-input !h-8 text-xs font-mono-num" style="border-color: var(--status-emerald-border);" aria-label="Jam Memo">
                  </div>

                  <input type="hidden" id="memoDateInput" value="2026-10-24">
                  <input type="hidden" id="memoPicInput" value="Tim HRD">
                  <input type="hidden" id="memoNoteInput" value="">

                  <button type="submit" id="btnSubmitMemo" class="btn-kov-primary w-full !h-8 text-xs">
                    <span>+ Simpan ke Kalender</span>
                  </button>
                </form>
              </div>

              <!-- Agenda List -->
              <div>
                <div class="text-xs font-bold mb-2.5" style="color: var(--ink-primary);" id="memoListHeading">Daftar Agenda</div>
                <div class="space-y-2 max-h-48 overflow-y-auto pr-0.5" id="hrMemoListBox"></div>
              </div>
            </div>
          </aside>
        </section>

      </div>
    </main>

  </div>

  <!-- Candidate Detail Modal -->
  <div id="candidateDetailModal" class="hidden kov-modal-backdrop">
    <div class="kov-paper-card max-w-lg w-full p-6" id="candidateDetailBody"></div>
  </div>

  <!-- Toast Stack & Submit Overlay -->
  <div class="kov-toast-stack" id="toastContainer"></div>
  <div id="submitOverlayRoot"></div>

  <script>
    // Symmetrical Feather/Lucide SVG Icons
    const ICONS = {
      candidates: \`<svg class="kov-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>\`,
      reviewer: \`<svg class="kov-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>\`,
      form: \`<svg class="kov-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>\`,
      ba: \`<svg class="kov-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>\`,
      po: \`<svg class="kov-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="9" cy="21" r="1"/>
        <circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>\`,
      st: \`<svg class="kov-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M22 2L11 13"/>
        <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
      </svg>\`,
      it: \`<svg class="kov-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
        <line x1="6" y1="6" x2="6.01" y2="6"/>
        <line x1="6" y1="18" x2="6.01" y2="18"/>
      </svg>\`,
      outlet: \`<svg class="kov-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>\`,
      users: \`<svg class="kov-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>\`
    };

    const state = {
      activeRole: 'admin',
      activeModule: 'hr',
      search: '',
      hrDivisi: 'all',
      hrStatus: 'all',
      selectedDate: null,
      shareToken: 'c-kov9821x',
      calMonth: 9,
      calYear: 2026,
      candidates: [
        { id: 1, tanggal: '24/10/2026', waktu: '10:15', nama: 'Budi Santoso', nik: '3374012410980001', rek: 'BCA 1234567890', hp: '0812-3456-7890', email: 'budi@kov.id', divisi: 'Barista', divPill: 'pill-peach', posisi: 'Head Barista', outlet: 'KOV Koffie Sula', pendidikan: 'D3 Perhotelan', pengalaman: '4 Tahun Barista & Roastery', status: 'Diterima', rating: 5, catatanReviewer: 'Latte art & kalibrasi espresso sangat rapi, pemahaman sensory tajam.', duplicate: false, color: '#f0fdf4', textColor: '#166534' },
        { id: 2, tanggal: '24/10/2026', waktu: '12:30', nama: 'Siti Rahma', nik: '3374021505000002', rek: 'Mandiri 9876543210', hp: '0823-4567-8901', email: 'siti@kov.id', divisi: 'Operasional', divPill: 'pill-lavender', posisi: 'Supervisor Outlet', outlet: 'KOV Heritage Kota Lama', pendidikan: 'S1 Manajemen', pengalaman: '3 Tahun SPV F&B Semarang', status: 'Belum Diproses', rating: 4, catatanReviewer: 'Leadership tegas, paham alur inventory dan POS kasir.', duplicate: false, color: '#eff6ff', textColor: '#1d4ed8' },
        { id: 3, tanggal: '23/10/2026', waktu: '14:20', nama: 'Agus Setiawan', nik: '3374031102990003', rek: 'BRI 5556667778', hp: '0834-5678-9012', email: 'agus@kov.id', divisi: 'Kitchen', divPill: 'pill-rose', posisi: 'Pastry & Cook', outlet: 'KOV Motion Soeta', pendidikan: 'SMK Tata Boga', pengalaman: '2.5 Tahun Pastry & Kitchen', status: 'Dipertimbangkan', rating: 3, catatanReviewer: 'Croissant lamination perlu kalibrasi temperatur oven proofing.', duplicate: true, color: '#fff1f2', textColor: '#be123c' },
        { id: 4, tanggal: '22/10/2026', waktu: '09:05', nama: 'Dewi Lestari', nik: '3374040808010004', rek: 'BCA 1122334455', hp: '0845-6789-0123', email: 'dewi@kov.id', divisi: 'FAT', divPill: 'pill-ochre', posisi: 'Finance & Tax Staff', outlet: 'Kantor Pusat Semarang', pendidikan: 'S1 Akuntansi', pengalaman: '3 Tahun Pajak & POS', status: 'Diterima', rating: 5, catatanReviewer: 'Rekonsiliasi accurate dan e-Faktur sangat cepat dan teliti.', duplicate: false, color: '#fffbeb', textColor: '#b45309' },
        { id: 5, tanggal: '26/10/2026', waktu: '16:40', nama: 'Rian Firmansyah', nik: '3374051904970005', rek: 'BNI 7788990011', hp: '0856-7890-1234', email: 'rian@kov.id', divisi: 'IT', divPill: 'pill-lavender', posisi: 'IT Support & Network', outlet: 'KOV Factory Rinjani', pendidikan: 'S1 Teknik Informatika', pengalaman: '4 Tahun Mikrotik & CCTV', status: 'Belum Diproses', rating: 4, catatanReviewer: 'Keahlian Mikrotik routing & CCTV outlet sangat solid.', duplicate: false, color: '#eff6ff', textColor: '#1d4ed8' }
      ],
      memos: [
        { id: 1001, role: 'all', tanggal: '24/10/2026', waktu: '10:00', kategori: 'Interview', judul: 'Interview Barista — Budi Santoso', selesai: false },
        { id: 1002, role: 'admin', tanggal: '24/10/2026', waktu: '14:00', kategori: 'Interview', judul: 'Verifikasi NIK & Referensi Siti Rahma', selesai: false },
        { id: 1003, role: 'reviewer', tanggal: '24/10/2026', waktu: '15:30', kategori: 'Uji Praktik', judul: 'Kalibrasi Espresso & Latte Art Budi', selesai: false },
        { id: 1004, role: 'manager', tanggal: '25/10/2026', waktu: '11:00', kategori: 'Approval', judul: 'Approval BA Grinder Nuova Simonelli', selesai: false },
        { id: 1005, role: 'all', tanggal: '26/10/2026', waktu: '09:30', kategori: 'Onboarding', judul: 'Tanda tangan PKWT karyawan baru', selesai: false }
      ],
      baList: [
        { id: 101, no_ba: 'BA/OPS/2026/001', tanggal: '25/10/2026', outlet: 'Outlet Pekalongan', dept: 'Bar & Service', pic: 'Hendra Saputra', barang: 'Mesin Grinder Espresso Nuova Simonelli', estimasi: 12500000, status: 'Menunggu Approval' },
        { id: 102, no_ba: 'BA/OPS/2026/002', tanggal: '24/10/2026', outlet: 'Kantor Pusat Semarang', dept: 'Operasional', pic: 'Budi Santoso', barang: 'Freezer Stainless 4 Pintu', estimasi: 24000000, status: 'Disetujui' }
      ],
      poList: [
        { id: 301, no_po: 'PO/KOV/2026/045', tanggal: '25/10/2026', vendor: 'PT Kopi Perkasa Jaya', perihal: 'Pengadaan Biji Kopi Arabika House Blend', unit: 'Kitchen & Bar All Outlet', netto: 35000000, status: 'Approved' },
        { id: 302, no_po: 'PO/KOV/2026/046', tanggal: '26/10/2026', vendor: 'PT Agres Info Teknologi', perihal: 'Pengadaan Laptop & Access Point WiFi', unit: 'IT Support & Outlet', netto: 17925000, status: 'Pending' }
      ],
      stList: [
        { id: 201, no_surat: 'ST/OPS/2026/088', tanggal: '25/10/2026', pembuat: 'Arief Budiman (KA Outlet)', tujuan: 'WHIMS Solo Surakarta', jadwal: '26/10/2026 - 28/10/2026', status: 'Disetujui', biaya: 1750000 }
      ],
      itList: [
        { id: 401, no_trx: 'IT-202610-001', tanggal: '25/10/2026', outlet: 'Kantor Pusat Semarang', vendor: 'PT Agres Info Teknologi', item: 'Laptop ASUS ExpertBook + Access Point Ruijie', kategori: 'Hardware & Komputer', total: 17925000, status: 'Lunas' },
        { id: 402, no_trx: 'IT-202610-002', tanggal: '26/10/2026', outlet: 'KOV Heritage Kota Lama', vendor: 'CV Mitra CCTV Semarang', item: 'Kamera IP Hikvision 4MP + NVR 8CH', kategori: 'CCTV & Keamanan', total: 6450000, status: 'Pending' }
      ],
      companies: [
        { id: 1, outlet: 'KOV Koffie Sula / Holding', pt: 'PT Puteri Seruput Indonesia', alamat: 'Jl. Sultan Agung No.135, Semarang', tipe: 'HOLDING', kuotaStaff: '12 / 12 (100%)' },
        { id: 2, outlet: 'KOV Heritage Kota Lama', pt: 'PT Samasta Kopi Indonesia', alamat: 'Kawasan Kota Lama, Semarang', tipe: 'OUTLET', kuotaStaff: '14 / 16 (87.5%)' },
        { id: 3, outlet: 'KOV Motion Soeta', pt: 'CV Lintas Aroma Bumi', alamat: 'Jl. Soekarno Hatta, Semarang', tipe: 'OUTLET', kuotaStaff: '8 / 10 (80%)' },
        { id: 4, outlet: 'KOV Factory Rinjani', pt: 'CV Fajar Anugrah Ciptana', alamat: 'Jl. Rinjani, Semarang', tipe: 'OUTLET', kuotaStaff: '10 / 10 (100%)' }
      ],
      users: [
        { id: 1, username: 'superadmin', nama: 'Bambang HR', role: 'Super Admin', divisi: 'Semua Divisi', pill: 'pill-rose' },
        { id: 2, username: 'ops_lead', nama: 'Doni Operasional', role: 'Manajer Operasional', divisi: 'Operasional & Holding', pill: 'pill-emerald' },
        { id: 3, username: 'it_staf', nama: 'Rudi IT Infrastructure', role: 'Staff IT', divisi: 'IT Systems', pill: 'pill-lavender' },
        { id: 4, username: 'chef_andi', nama: 'Chef Andi', role: 'Reviewer Divisi', divisi: 'Kitchen & Barista', pill: 'pill-peach' }
      ]
    };

    function setLaserLoading(active) {
      const bar = document.getElementById('topLaserBar');
      if (bar) bar.classList.toggle('is-loading', active);
    }

    function showToast({ type = 'success', title = '', msg = '', duration = 2600 }) {
      const container = document.getElementById('toastContainer');
      const el = document.createElement('div');
      const borderColor = type === 'error' ? '#e11d48' : '#166534';
      el.className = 'kov-toast-card';
      el.style.borderLeft = \`4px solid \${borderColor}\`;
      el.innerHTML = \`
        <div class="flex-1 min-w-0">
          <div class="font-display text-xs font-bold">\${title}</div>
          <div class="text-[11px] mt-0.5 leading-snug" style="color: var(--ink-secondary);">\${msg}</div>
        </div>
      \`;
      container.appendChild(el);
      if (duration > 0) setTimeout(() => { if (el.parentNode) el.remove(); }, duration);
      return el;
    }

    function showSubmitModalAnimation(title, subtitle) {
      const root = document.getElementById('submitOverlayRoot');
      root.innerHTML = \`
        <div class="kov-submit-overlay" id="activeSubmitOverlay">
          <div class="kov-submit-modal">
            <div class="w-12 h-12 mx-auto mb-3.5 rounded-full flex items-center justify-center" style="background: var(--status-emerald-bg); border: 1px solid var(--status-emerald-border);">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="var(--kov-pine)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h3 class="font-display text-base font-bold">\${title}</h3>
            <p class="text-xs mt-1.5 leading-relaxed" style="color: var(--ink-secondary);">\${subtitle}</p>
          </div>
        </div>
      \`;
      setTimeout(() => {
        const ov = document.getElementById('activeSubmitOverlay');
        if (ov) ov.remove();
      }, 1400);
    }

    function triggerValidationError(inputEl, containerEl, message) {
      setLaserLoading(false);
      if (containerEl) {
        containerEl.classList.remove('kov-shake');
        void containerEl.offsetWidth;
        containerEl.classList.add('kov-shake');
      }
      if (inputEl) {
        inputEl.classList.add('kov-input-error');
        inputEl.focus();
      }
      const errBanner = document.getElementById('memoInlineError');
      const errText = document.getElementById('memoInlineErrorText');
      if (errBanner && errText) {
        errText.textContent = message;
        errBanner.classList.remove('hidden');
        errBanner.classList.add('flex');
      }
      showToast({ type: 'error', title: 'Belum Lengkap', msg: message });
    }

    function formatRp(num) {
      return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
    }

    function isoToDisplay(iso) {
      if (!iso) return '24/10/2026';
      const [y, m, d] = iso.split('-');
      return \`\${d}/\${m}/\${y}\`;
    }

    function maskSensitive(val, visibleLeading = 6, visibleTrailing = 2) {
      if (!val) return '-';
      if (val.length <= visibleLeading + visibleTrailing) return val;
      const lead = val.slice(0, visibleLeading);
      const trail = val.slice(-visibleTrailing);
      return \`\${lead}\${'*'.repeat(val.length - visibleLeading - visibleTrailing)}\${trail}\`;
    }

    function renderNavigationForRole() {
      const nav = document.getElementById('sidebarNav');
      const role = state.activeRole;
      const roleBadge = document.getElementById('activeRoleBadge');

      const roleNames = {
        admin: 'Super Admin HR',
        reviewer: 'Reviewer Divisi',
        manager: 'Manajer Operasional'
      };
      if (roleBadge) roleBadge.textContent = roleNames[role];

      let groups = [];
      if (role === 'admin') {
        groups = [
          {
            title: 'Rekrutmen & HR',
            items: [
              { mod: 'hr', icon: ICONS.candidates, label: 'Direktori Kandidat' },
              { mod: 'reviewer', icon: ICONS.reviewer, label: 'Evaluasi Divisi' },
              { mod: 'public_form', icon: ICONS.form, label: 'Formulir Publik' }
            ]
          },
          {
            title: 'Operasional & IT',
            items: [
              { mod: 'operasional', icon: ICONS.ba, label: 'Berita Acara (BA)' },
              { mod: 'po', icon: ICONS.po, label: 'Purchase Order' },
              { mod: 'surat_tugas', icon: ICONS.st, label: 'Surat Tugas & LPJ' },
              { mod: 'it', icon: ICONS.it, label: 'Rekap Belanja IT' }
            ]
          },
          {
            title: 'Master Sistem',
            items: [
              { mod: 'companies', icon: ICONS.outlet, label: 'Master Outlet' },
              { mod: 'users', icon: ICONS.users, label: 'Kelola Akun RBAC' }
            ]
          }
        ];
      } else if (role === 'reviewer') {
        groups = [
          {
            title: 'Panel Reviewer',
            items: [
              { mod: 'hr', icon: ICONS.reviewer, label: 'Antrean Uji Skill' },
              { mod: 'public_form', icon: ICONS.form, label: 'Formulir Publik' }
            ]
          }
        ];
        if (!['hr', 'public_form'].includes(state.activeModule)) state.activeModule = 'hr';
      } else if (role === 'manager') {
        groups = [
          {
            title: 'Otorisasi Manajer',
            items: [
              { mod: 'operasional', icon: ICONS.ba, label: 'Approval Berita Acara' },
              { mod: 'po', icon: ICONS.po, label: 'Monitoring PO' },
              { mod: 'surat_tugas', icon: ICONS.st, label: 'Surat Tugas Dinas' },
              { mod: 'companies', icon: ICONS.outlet, label: 'Kuota Staf Outlet' },
              { mod: 'hr', icon: ICONS.candidates, label: 'Ringkasan Pelamar' }
            ]
          }
        ];
        if (!['operasional', 'po', 'surat_tugas', 'companies', 'hr'].includes(state.activeModule)) {
          state.activeModule = 'operasional';
        }
      }

      nav.innerHTML = groups.map(g => \`
        <div class="nav-group-heading hide-on-collapse">\${g.title}</div>
        \${g.items.map(item => \`
          <button type="button" class="nav-btn \${state.activeModule === item.mod ? 'active' : ''}" data-module="\${item.mod}" title="\${item.label}">
            \${item.icon}
            <span class="hide-on-collapse">\${item.label}</span>
          </button>
        \`).join('')}
      \`).join('');
    }

    // Symmetrical 3-Card Summary Cluster
    function renderMetricTilesForRole() {
      const container = document.getElementById('roleMetricTilesContainer');
      const role = state.activeRole;

      if (role === 'admin') {
        container.innerHTML = \`
          <div class="tonal-pill-card">
            <div>
              <div class="text-[10px] font-bold uppercase tracking-wider" style="color: var(--ink-muted);">Total Pelamar</div>
              <div class="font-display font-mono-num text-xl font-bold leading-tight mt-1" style="color: var(--ink-primary);">\${state.candidates.length} Kandidat</div>
            </div>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style="background: var(--status-emerald-bg); color: var(--status-emerald-ink); border: 1px solid var(--status-emerald-border);">
              \${ICONS.candidates}
            </div>
          </div>
          <div class="tonal-pill-card">
            <div>
              <div class="text-[10px] font-bold uppercase tracking-wider" style="color: var(--ink-muted);">Perlu Evaluasi</div>
              <div class="font-display font-mono-num text-xl font-bold leading-tight mt-1" style="color: var(--ink-primary);">\${state.candidates.filter(c => c.status === 'Belum Diproses').length} Berkas</div>
            </div>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style="background: var(--status-amber-bg); color: var(--status-amber-ink); border: 1px solid var(--status-amber-border);">
              \${ICONS.reviewer}
            </div>
          </div>
          <div class="tonal-pill-card">
            <div>
              <div class="text-[10px] font-bold uppercase tracking-wider" style="color: var(--ink-muted);">Lulus Seleksi</div>
              <div class="font-display font-mono-num text-xl font-bold leading-tight mt-1" style="color: var(--ink-primary);">\${state.candidates.filter(c => c.status === 'Diterima').length} Siap PKWT</div>
            </div>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style="background: var(--status-blue-bg); color: var(--status-blue-ink); border: 1px solid var(--status-blue-border);">
              \${ICONS.form}
            </div>
          </div>
        \`;
      } else if (role === 'reviewer') {
        const divCands = state.candidates.filter(c => ['Barista', 'Kitchen'].includes(c.divisi));
        container.innerHTML = \`
          <div class="tonal-pill-card">
            <div>
              <div class="text-[10px] font-bold uppercase tracking-wider" style="color: var(--ink-muted);">Antrean Divisi</div>
              <div class="font-display font-mono-num text-xl font-bold leading-tight mt-1" style="color: var(--ink-primary);">\${divCands.length} Kandidat</div>
            </div>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style="background: var(--status-amber-bg); color: var(--status-amber-ink); border: 1px solid var(--status-amber-border);">
              \${ICONS.reviewer}
            </div>
          </div>
          <div class="tonal-pill-card">
            <div>
              <div class="text-[10px] font-bold uppercase tracking-wider" style="color: var(--ink-muted);">Rata-Rata Skor</div>
              <div class="font-display font-mono-num text-xl font-bold leading-tight mt-1" style="color: var(--ink-primary);">4.5 / 5.0</div>
            </div>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style="background: var(--status-emerald-bg); color: var(--status-emerald-ink); border: 1px solid var(--status-emerald-border);">
              \${ICONS.candidates}
            </div>
          </div>
          <div class="tonal-pill-card">
            <div>
              <div class="text-[10px] font-bold uppercase tracking-wider" style="color: var(--ink-muted);">Proteksi Data</div>
              <div class="font-display font-mono-num text-base font-bold leading-tight mt-1" style="color: var(--ink-primary);">NIK Masked</div>
            </div>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style="background: var(--status-slate-bg); color: var(--status-slate-ink); border: 1px solid var(--status-slate-border);">
              \${ICONS.users}
            </div>
          </div>
        \`;
      } else if (role === 'manager') {
        container.innerHTML = \`
          <div class="tonal-pill-card">
            <div>
              <div class="text-[10px] font-bold uppercase tracking-wider" style="color: var(--ink-muted);">Approval BA</div>
              <div class="font-display font-mono-num text-xl font-bold leading-tight mt-1" style="color: var(--ink-primary);">\${state.baList.filter(b => b.status === 'Menunggu Approval').length} Dokumen</div>
            </div>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style="background: var(--status-rose-bg); color: var(--status-rose-ink); border: 1px solid var(--status-rose-border);">
              \${ICONS.ba}
            </div>
          </div>
          <div class="tonal-pill-card">
            <div>
              <div class="text-[10px] font-bold uppercase tracking-wider" style="color: var(--ink-muted);">Nilai Pengadaan</div>
              <div class="font-display font-mono-num text-xl font-bold leading-tight mt-1" style="color: var(--ink-primary);">Rp 52.9M</div>
            </div>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style="background: var(--status-blue-bg); color: var(--status-blue-ink); border: 1px solid var(--status-blue-border);">
              \${ICONS.po}
            </div>
          </div>
          <div class="tonal-pill-card">
            <div>
              <div class="text-[10px] font-bold uppercase tracking-wider" style="color: var(--ink-muted);">Kuota Staf</div>
              <div class="font-display font-mono-num text-xl font-bold leading-tight mt-1" style="color: var(--ink-primary);">92% Terisi</div>
            </div>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style="background: var(--status-emerald-bg); color: var(--status-emerald-ink); border: 1px solid var(--status-emerald-border);">
              \${ICONS.outlet}
            </div>
          </div>
        \`;
      }
    }

    function renderMainModule() {
      const container = document.getElementById('moduleContainer');
      const role = state.activeRole;
      const mod = state.activeModule;

      container.classList.remove('animate-fade');
      void container.offsetWidth;
      container.classList.add('animate-fade');

      if (mod === 'hr' || mod === 'reviewer') {
        let dataset = state.candidates;
        if (role === 'reviewer' || mod === 'reviewer') {
          dataset = dataset.filter(c => ['Barista', 'Kitchen'].includes(c.divisi));
        }

        const filtered = dataset.filter(c => {
          const matchSearch = !state.search || \`\${c.nama} \${c.nik} \${c.posisi} \${c.divisi} \${c.outlet}\`.toLowerCase().includes(state.search);
          const matchDiv = state.hrDivisi === 'all' || c.divisi.toLowerCase() === state.hrDivisi;
          const matchStatus = state.hrStatus === 'all' ? true : (state.hrStatus === 'duplicate' ? c.duplicate : c.status === state.hrStatus);
          const matchDate = !state.selectedDate || c.tanggal === state.selectedDate;
          return matchSearch && matchDiv && matchStatus && matchDate;
        });

        document.getElementById('pageTitleHeading').textContent = (role === 'reviewer' || mod === 'reviewer')
          ? 'Antrean Evaluasi Divisi'
          : 'Direktori Kandidat Pelamar';
        document.getElementById('headerCountPill').textContent = \`\${filtered.length} Data\`;

        const isMaskedRole = role === 'reviewer';

        container.innerHTML = \`
          <div class="kov-paper-card">
            <div class="px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3" style="border-color: var(--border-hairline); background: var(--bg-subtle);">
              <div class="flex items-center gap-1.5 flex-wrap">
                \${['all', 'Belum Diproses', 'Dipertimbangkan', 'Diterima'].map(st => \`
                  <button type="button" class="kov-tab-pill \${state.hrStatus === st ? 'active' : ''}" data-status-pill="\${st}">
                    <span>\${st === 'all' ? 'Semua' : st}</span>
                  </button>
                \`).join('')}
              </div>

              <div class="flex items-center gap-2">
                \${state.selectedDate ? \`
                  <button type="button" class="status-pill pill-ochre cursor-pointer" id="btnClearDateChip">
                    <span>\${state.selectedDate} &times;</span>
                  </button>
                \` : ''}

                <select id="divisiSelectClean" class="h-9 px-3 rounded-lg text-xs font-semibold kov-input cursor-pointer !w-auto">
                  <option value="all">Semua Divisi (\${dataset.length})</option>
                  \${!isMaskedRole ? \`
                    <option value="operasional" \${state.hrDivisi === 'operasional' ? 'selected' : ''}>Operasional</option>
                    <option value="fat" \${state.hrDivisi === 'fat' ? 'selected' : ''}>Finance (FAT)</option>
                    <option value="it" \${state.hrDivisi === 'it' ? 'selected' : ''}>IT Systems</option>
                  \` : ''}
                  <option value="barista" \${state.hrDivisi === 'barista' ? 'selected' : ''}>Barista</option>
                  <option value="kitchen" \${state.hrDivisi === 'kitchen' ? 'selected' : ''}>Kitchen</option>
                </select>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="kov-table">
                <thead>
                  <tr>
                    <th style="width: 28%;">Kandidat &amp; Pendidikan</th>
                    <th style="width: 26%;">Posisi &amp; Penempatan</th>
                    <th style="width: 24%;">\${isMaskedRole ? 'NIK (Masked) & Skor' : 'NIK KTP & Rekening'}</th>
                    <th style="width: 22%; text-align: right;">Status &amp; Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  \${filtered.map(c => {
                    const stClass = c.status === 'Diterima' ? 'pill-emerald' : (c.status === 'Belum Diproses' ? 'pill-lavender' : 'pill-ochre');
                    const displayNik = isMaskedRole ? maskSensitive(c.nik, 6, 2) : c.nik;
                    const displayRek = isMaskedRole ? \`★ \${c.rating}.0 / 5.0\` : \`\${c.rek} • \${c.hp}\`;

                    return \`
                      <tr>
                        <td>
                          <div class="flex items-center gap-3">
                            <div class="w-9 h-9 rounded-full font-display font-bold text-xs flex items-center justify-center flex-shrink-0" style="background:\${c.color};color:\${c.textColor}; border: 1px solid var(--border-hairline);">
                              \${c.nama.charAt(0)}
                            </div>
                            <div>
                              <div class="font-display font-bold text-xs sm:text-sm" style="color: var(--ink-primary);">\${c.nama}</div>
                              <div class="text-[11px] font-medium" style="color: var(--ink-muted);">\${c.pendidikan} &bull; \${c.tanggal}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div class="flex items-center gap-1.5">
                            <span class="font-semibold text-xs" style="color: var(--ink-primary);">\${c.posisi}</span>
                            <span class="status-pill \${c.divPill} !text-[10px] !py-0.5 !px-2">\${c.divisi}</span>
                          </div>
                          <div class="text-[11px] mt-0.5 font-medium" style="color: var(--ink-muted);">\${c.outlet}</div>
                        </td>
                        <td>
                          <div class="font-mono-num text-xs font-semibold" style="color: var(--ink-primary);">\${displayNik}</div>
                          <div class="font-mono-num text-[11px]" style="color: var(--ink-muted);">\${displayRek}</div>
                        </td>
                        <td class="text-right">
                          <div class="inline-flex items-center justify-end gap-1.5">
                            <span class="status-pill \${stClass}">\${c.status}</span>
                            <button type="button" class="btn-kov-outline !h-8 !px-3 !text-xs font-medium" data-open-detail="\${c.id}">
                              \${isMaskedRole ? 'Nilai' : 'Detail'}
                            </button>
                            <button type="button" class="btn-kov-outline !h-8 !px-2.5 !text-xs font-medium" data-review-candidate="\${c.nama}" title="Jadwalkan di Kalender">
                              + Memo
                            </button>
                          </div>
                        </td>
                      </tr>
                    \`;
                  }).join('') || \`<tr><td colspan="4" class="text-center py-12 text-xs" style="color: var(--ink-muted);">Tidak ada data pelamar yang cocok.</td></tr>\`}
                </tbody>
              </table>
            </div>
          </div>
        \`;

        const sel = document.getElementById('divisiSelectClean');
        if (sel) {
          sel.addEventListener('change', (e) => {
            state.hrDivisi = e.target.value;
            renderMainModule();
          });
        }
        const clearDate = document.getElementById('btnClearDateChip');
        if (clearDate) {
          clearDate.addEventListener('click', () => {
            state.selectedDate = null;
            renderCalendar();
            renderMemoList();
            renderMainModule();
          });
        }
      } else if (mod === 'operasional') {
        document.getElementById('pageTitleHeading').textContent = 'Berita Acara Pengajuan Barang (BA)';
        document.getElementById('headerCountPill').textContent = \`\${state.baList.length} Dokumen\`;

        container.innerHTML = \`
          <div class="kov-paper-card">
            <div class="overflow-x-auto">
              <table class="kov-table">
                <thead>
                  <tr>
                    <th>No. BA &amp; Tanggal</th>
                    <th>Outlet &amp; PIC</th>
                    <th>Barang &amp; Estimasi</th>
                    <th class="text-right">Status &amp; Otorisasi</th>
                  </tr>
                </thead>
                <tbody>
                  \${state.baList.map(r => \`
                    <tr>
                      <td><div class="font-mono-num font-bold">\${r.no_ba}</div><div class="font-mono-num text-[11px]" style="color: var(--ink-muted);">\${r.tanggal}</div></td>
                      <td><div class="font-bold">\${r.outlet}</div><div class="text-[11px]" style="color: var(--ink-muted);">\${r.pic} (\${r.dept})</div></td>
                      <td><div class="font-medium">\${r.barang}</div><div class="font-mono-num text-xs font-bold" style="color: var(--kov-pine);">\${formatRp(r.estimasi)}</div></td>
                      <td class="text-right">
                        <div class="inline-flex items-center gap-1.5">
                          <span class="status-pill \${r.status === 'Disetujui' ? 'pill-emerald' : 'pill-ochre'}">\${r.status}</span>
                          \${r.status === 'Menunggu Approval' ? \`
                            <button type="button" class="btn-kov-primary !h-8 !px-3 !text-xs" data-approve-ba="\${r.id}">Setujui</button>
                            <button type="button" class="btn-kov-outline !h-8 !px-3 !text-xs" data-reject-ba="\${r.id}">Tolak</button>
                          \` : ''}
                        </div>
                      </td>
                    </tr>
                  \`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        \`;
      } else if (mod === 'po') {
        document.getElementById('pageTitleHeading').textContent = 'Purchase Order (PO) Pengadaan';
        document.getElementById('headerCountPill').textContent = \`\${state.poList.length} PO\`;

        container.innerHTML = \`
          <div class="kov-paper-card">
            <div class="overflow-x-auto">
              <table class="kov-table">
                <thead>
                  <tr>
                    <th>No. PO &amp; Tanggal</th>
                    <th>Vendor Resmi</th>
                    <th>Perihal &amp; Unit</th>
                    <th class="text-right">Total Netto &amp; Status</th>
                  </tr>
                </thead>
                <tbody>
                  \${state.poList.map(r => \`
                    <tr>
                      <td><div class="font-mono-num font-bold">\${r.no_po}</div><div class="font-mono-num text-[11px]" style="color: var(--ink-muted);">\${r.tanggal}</div></td>
                      <td class="font-bold">\${r.vendor}</td>
                      <td><div>\${r.perihal}</div><div class="text-[11px]" style="color: var(--ink-muted);">\${r.unit}</div></td>
                      <td class="text-right">
                        <div class="font-mono-num font-bold" style="color: var(--kov-pine);">\${formatRp(r.netto)}</div>
                        <span class="status-pill \${r.status === 'Approved' ? 'pill-emerald' : 'pill-ochre'} mt-1">\${r.status}</span>
                      </td>
                    </tr>
                  \`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        \`;
      } else if (mod === 'surat_tugas') {
        document.getElementById('pageTitleHeading').textContent = 'Surat Tugas & LPJ Dinas';
        document.getElementById('headerCountPill').textContent = \`\${state.stList.length} Surat\`;

        container.innerHTML = \`
          <div class="kov-paper-card">
            <div class="overflow-x-auto">
              <table class="kov-table">
                <thead>
                  <tr>
                    <th>No. Surat</th>
                    <th>Pelaksana Tugas</th>
                    <th>Tujuan &amp; Jadwal</th>
                    <th class="text-right">Realisasi LPJ</th>
                  </tr>
                </thead>
                <tbody>
                  \${state.stList.map(r => \`
                    <tr>
                      <td><div class="font-mono-num font-bold">\${r.no_surat}</div><div class="font-mono-num text-[11px]" style="color: var(--ink-muted);">\${r.tanggal}</div></td>
                      <td class="font-bold">\${r.pembuat}</td>
                      <td><div>\${r.tujuan}</div><div class="font-mono-num text-[11px]" style="color: var(--ink-muted);">\${r.jadwal}</div></td>
                      <td class="text-right">
                        <div class="font-mono-num font-bold" style="color: var(--kov-pine);">\${formatRp(r.biaya)}</div>
                        <span class="status-pill pill-emerald mt-1">\${r.status}</span>
                      </td>
                    </tr>
                  \`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        \`;
      } else if (mod === 'it') {
        document.getElementById('pageTitleHeading').textContent = 'Rekap Pembelanjaan IT Outlet';
        document.getElementById('headerCountPill').textContent = \`\${state.itList.length} Transaksi\`;

        container.innerHTML = \`
          <div class="kov-paper-card">
            <div class="overflow-x-auto">
              <table class="kov-table">
                <thead>
                  <tr>
                    <th>No. Transaksi</th>
                    <th>Outlet &amp; Vendor</th>
                    <th>Perangkat &amp; Kategori</th>
                    <th class="text-right">Total Biaya</th>
                  </tr>
                </thead>
                <tbody>
                  \${state.itList.map(r => \`
                    <tr>
                      <td><div class="font-mono-num font-bold">\${r.no_trx}</div><div class="font-mono-num text-[11px]" style="color: var(--ink-muted);">\${r.tanggal}</div></td>
                      <td><div class="font-bold">\${r.outlet}</div><div class="text-[11px]" style="color: var(--ink-muted);">\${r.vendor}</div></td>
                      <td><div>\${r.item}</div><div class="text-[11px]" style="color: var(--ink-muted);">\${r.kategori}</div></td>
                      <td class="text-right">
                        <div class="font-mono-num font-bold" style="color: var(--kov-pine);">\${formatRp(r.total)}</div>
                        <span class="status-pill \${r.status === 'Lunas' ? 'pill-emerald' : 'pill-ochre'} mt-1">\${r.status}</span>
                      </td>
                    </tr>
                  \`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        \`;
      } else if (mod === 'companies') {
        document.getElementById('pageTitleHeading').textContent = 'Master Outlet & Kuota Headcount';
        document.getElementById('headerCountPill').textContent = \`\${state.companies.length} Entitas\`;

        container.innerHTML = \`
          <div class="kov-paper-card">
            <div class="overflow-x-auto">
              <table class="kov-table">
                <thead>
                  <tr>
                    <th>Nama Outlet</th>
                    <th>Badan Hukum (PT/CV)</th>
                    <th>Alamat Lengkap</th>
                    <th class="text-right">Tipe &amp; Kuota Staf</th>
                  </tr>
                </thead>
                <tbody>
                  \${state.companies.map(r => \`
                    <tr>
                      <td class="font-bold">\${r.outlet}</td>
                      <td>\${r.pt}</td>
                      <td class="text-xs" style="color: var(--ink-muted);">\${r.alamat}</td>
                      <td class="text-right">
                        <span class="status-pill \${r.tipe === 'HOLDING' ? 'pill-ochre' : 'pill-emerald'}">\${r.tipe}</span>
                        <div class="font-mono-num font-bold text-[11px] mt-1" style="color: var(--kov-pine);">\${r.kuotaStaff}</div>
                      </td>
                    </tr>
                  \`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        \`;
      } else if (mod === 'users') {
        document.getElementById('pageTitleHeading').textContent = 'Kelola Akun & Matriks RBAC';
        document.getElementById('headerCountPill').textContent = \`\${state.users.length} Akun\`;

        container.innerHTML = \`
          <div class="kov-paper-card">
            <div class="overflow-x-auto">
              <table class="kov-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Nama Pengguna</th>
                    <th>Peran Sistem</th>
                    <th class="text-right">Cakupan Akses</th>
                  </tr>
                </thead>
                <tbody>
                  \${state.users.map(r => \`
                    <tr>
                      <td class="font-mono-num font-bold">@\${r.username}</td>
                      <td class="font-bold">\${r.nama}</td>
                      <td><span class="status-pill \${r.pill}">\${r.role}</span></td>
                      <td class="text-right text-xs font-semibold">\${r.divisi}</td>
                    </tr>
                  \`).join('')}
                </tbody>
              </table>
            </div>
          </div>
        \`;
      } else if (mod === 'public_form') {
        // High-Craft Symmetrical Form Architecture
        document.getElementById('pageTitleHeading').textContent = 'Formulir Biodata Calon Karyawan';
        document.getElementById('headerCountPill').textContent = 'Form Publik';

        container.innerHTML = \`
          <div class="kov-paper-card p-8 max-w-4xl mx-auto">
            <div class="border-b pb-5 mb-6" style="border-color: var(--border-hairline);">
              <h2 class="font-display text-lg font-bold" style="color: var(--ink-primary);">Data Diri &amp; Riwayat Pendaftaran</h2>
              <p class="text-xs mt-1 leading-relaxed" style="color: var(--ink-muted);">
                Pastikan seluruh kolom dengan tanda bintang (*) terisi dengan data riil dan valid sesuai dokumen KTP asli.
              </p>
            </div>

            <form id="publicCandidateForm" class="space-y-6">
              <!-- Section 1: Identitas Pribadi -->
              <div>
                <div class="text-xs font-bold uppercase tracking-wider mb-3.5 flex items-center gap-2" style="color: var(--kov-pine);">
                  <span class="w-2 h-2 rounded-full" style="background: var(--kov-pine);"></span>
                  1. Informasi Identitas Pribadi
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label class="block text-xs font-semibold mb-1.5" style="color: var(--ink-primary);">Nama Lengkap Sesuai KTP <span class="text-rose-500">*</span></label>
                    <input type="text" id="formNama" value="Budi Santoso" required class="kov-input" placeholder="Masukkan nama lengkap">
                  </div>
                  <div>
                    <label class="block text-xs font-semibold mb-1.5" style="color: var(--ink-primary);">Nomor Induk Kependudukan (16 Digit) <span class="text-rose-500">*</span></label>
                    <input type="text" id="formNik" value="3374012410980001" maxlength="16" required class="kov-input font-mono-num" placeholder="3374xxxxxxxxxxxx">
                  </div>
                  <div>
                    <label class="block text-xs font-semibold mb-1.5" style="color: var(--ink-primary);">Nomor WhatsApp Aktif <span class="text-rose-500">*</span></label>
                    <input type="tel" id="formHp" value="081234567890" required class="kov-input font-mono-num" placeholder="08xxxxxxxxxx">
                  </div>
                  <div>
                    <label class="block text-xs font-semibold mb-1.5" style="color: var(--ink-primary);">Alamat Email <span class="text-rose-500">*</span></label>
                    <input type="email" id="formEmail" value="budi.santoso@gmail.com" required class="kov-input" placeholder="nama@domain.com">
                  </div>
                </div>
              </div>

              <!-- Section 2: Posisi & Penempatan -->
              <div class="pt-4 border-t" style="border-color: var(--border-hairline);">
                <div class="text-xs font-bold uppercase tracking-wider mb-3.5 flex items-center gap-2" style="color: var(--kov-pine);">
                  <span class="w-2 h-2 rounded-full" style="background: var(--kov-pine);"></span>
                  2. Pilihan Divisi &amp; Outlet Penempatan
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label class="block text-xs font-semibold mb-1.5" style="color: var(--ink-primary);">Divisi Tujuan <span class="text-rose-500">*</span></label>
                    <select id="formDivisi" class="kov-input cursor-pointer">
                      <option value="Barista">Barista &amp; Roastery</option>
                      <option value="Kitchen">Kitchen &amp; Pastry</option>
                      <option value="Operasional">Operasional Outlet</option>
                      <option value="FAT">Finance, Accounting &amp; Tax</option>
                      <option value="IT">IT &amp; Network Support</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold mb-1.5" style="color: var(--ink-primary);">Pilihan Outlet KOV <span class="text-rose-500">*</span></label>
                    <select id="formOutlet" class="kov-input cursor-pointer">
                      <option value="KOV Koffie Sula">KOV Koffie Sula (Holding)</option>
                      <option value="KOV Heritage Kota Lama">KOV Heritage Kota Lama</option>
                      <option value="KOV Motion Soeta">KOV Motion Soeta</option>
                      <option value="KOV Factory Rinjani">KOV Factory Rinjani</option>
                      <option value="Outlet Pekalongan">Outlet Pekalongan</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold mb-1.5" style="color: var(--ink-primary);">Pendidikan Terakhir <span class="text-rose-500">*</span></label>
                    <input type="text" id="formPendidikan" value="D3 Perhotelan" required class="kov-input" placeholder="Contoh: S1 Manajemen, SMK Tata Boga">
                  </div>
                  <div>
                    <label class="block text-xs font-semibold mb-1.5" style="color: var(--ink-primary);">Pengalaman Kerja Relevan</label>
                    <input type="text" id="formPengalaman" value="4 Tahun Barista &amp; Roastery" class="kov-input" placeholder="Contoh: 2 Tahun Barista F&B">
                  </div>
                </div>
              </div>

              <!-- Section 3: Payroll & Verifikasi Dokumen -->
              <div class="pt-4 border-t" style="border-color: var(--border-hairline);">
                <div class="text-xs font-bold uppercase tracking-wider mb-3.5 flex items-center gap-2" style="color: var(--kov-pine);">
                  <span class="w-2 h-2 rounded-full" style="background: var(--kov-pine);"></span>
                  3. Rekening Payroll &amp; Berkas Lampiran
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label class="block text-xs font-semibold mb-1.5" style="color: var(--ink-primary);">Nomor Rekening Payroll <span class="text-rose-500">*</span></label>
                    <input type="text" id="formRek" value="BCA 1234567890" required class="kov-input font-mono-num" placeholder="BCA / Mandiri / BNI / BRI">
                  </div>
                  <div>
                    <label class="block text-xs font-semibold mb-1.5" style="color: var(--ink-primary);">Lampiran Berkas (PDF / ZIP)</label>
                    <input type="file" class="kov-input !py-1.5 !h-10 text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer">
                  </div>
                </div>
              </div>

              <!-- Form Action Footer -->
              <div class="pt-6 border-t flex flex-wrap items-center justify-between gap-3" style="border-color: var(--border-hairline);">
                <span class="text-xs" style="color: var(--ink-muted);">
                  Dengan mengklik kirim, data akan diverifikasi secara otomatis oleh sistem HRD KOV.
                </span>
                <div class="flex items-center gap-2.5">
                  <button type="reset" class="btn-kov-outline !h-10 px-4 text-xs font-medium">
                    Reset Formulir
                  </button>
                  <button type="submit" class="btn-kov-primary !h-10 px-5 text-xs font-semibold">
                    <svg class="kov-icon !w-4 !h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M22 2L11 13"/>
                      <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
                    </svg>
                    <span>Kirim Berkas Pendaftaran</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        \`;

        const pubForm = document.getElementById('publicCandidateForm');
        if (pubForm) {
          pubForm.addEventListener('submit', (e) => {
            e.preventDefault();
            setLaserLoading(true);
            setTimeout(() => {
              setLaserLoading(false);
              showSubmitModalAnimation('Pendaftaran Berhasil', 'Berkas Anda telah terdaftar di sistem HRD KOV.');
            }, 300);
          });
        }
      }
    }

    function openCandidateDetail(id) {
      const c = state.candidates.find(x => x.id === id);
      if (!c) return;
      const isMasked = state.activeRole === 'reviewer';
      const modal = document.getElementById('candidateDetailModal');
      const body = document.getElementById('candidateDetailBody');

      const displayNik = isMasked ? maskSensitive(c.nik, 6, 2) : c.nik;
      const displayRek = isMasked ? maskSensitive(c.rek, 4, 3) : c.rek;

      body.innerHTML = \`
        <div class="flex items-center justify-between pb-4 mb-4 border-b" style="border-color: var(--border-hairline);">
          <div>
            <h3 class="font-display text-base font-bold">\${c.nama}</h3>
            <p class="text-xs mt-0.5" style="color: var(--ink-muted);">\${c.posisi} &bull; \${c.outlet}</p>
          </div>
          <button type="button" id="btnCloseDetailModal" class="w-8 h-8 rounded-lg border text-sm flex items-center justify-center cursor-pointer kov-soft-icon-btn" style="border-color: var(--border-hairline);">&times;</button>
        </div>

        <div class="space-y-3 text-xs">
          <div class="flex justify-between py-1.5 border-b" style="border-color: var(--border-subtle);">
            <span style="color: var(--ink-muted);">NIK KTP</span>
            <span class="font-mono-num font-semibold" style="color: var(--ink-primary);">\${displayNik}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b" style="border-color: var(--border-subtle);">
            <span style="color: var(--ink-muted);">Rekening Payroll</span>
            <span class="font-mono-num font-semibold" style="color: var(--ink-primary);">\${displayRek}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b" style="border-color: var(--border-subtle);">
            <span style="color: var(--ink-muted);">Pengalaman</span>
            <span class="font-semibold" style="color: var(--ink-primary);">\${c.pengalaman}</span>
          </div>

          \${isMasked ? \`
            <div class="p-4 rounded-xl mt-3 space-y-2.5" style="background: var(--status-amber-bg); border: 1px solid var(--status-amber-border);">
              <div class="flex items-center justify-between">
                <span class="font-bold text-xs" style="color: var(--status-amber-ink);">Penilaian Praktik:</span>
                <div class="flex items-center gap-1 text-sm cursor-pointer" style="color: var(--status-amber-ink);" id="modalStarRating">
                  <span data-star="1">★</span><span data-star="2">★</span><span data-star="3">★</span><span data-star="4">★</span><span data-star="5">★</span>
                </div>
              </div>
              <textarea id="modalReviewerNote" rows="2" class="w-full p-2.5 rounded-lg text-xs kov-input" style="border-color: var(--status-amber-border);">\${c.catatanReviewer}</textarea>
            </div>
          \` : \`
            <div class="p-4 rounded-xl mt-3" style="background: var(--status-emerald-bg); border: 1px solid var(--status-emerald-border);">
              <div class="text-[10px] font-bold uppercase tracking-wider" style="color: var(--status-emerald-ink);">Catatan Reviewer Divisi</div>
              <div class="font-medium text-xs mt-1 leading-relaxed" style="color: var(--status-emerald-ink);">"\${c.catatanReviewer}"</div>
            </div>
          \`}
        </div>

        <div class="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t" style="border-color: var(--border-hairline);">
          \${isMasked ? \`
            <button type="button" class="btn-kov-outline !h-9 text-xs" data-save-review="\${c.id}">Simpan Catatan</button>
            <button type="button" class="btn-kov-primary !h-9 text-xs" data-recommend-cand="\${c.id}">Rekomendasikan Lulus</button>
          \` : \`
            <button type="button" class="btn-kov-outline !h-9 text-xs" data-quick-verdict="\${c.id}" data-verdict="Dipertimbangkan">Pertimbangkan</button>
            <button type="button" class="btn-kov-primary !h-9 text-xs" data-quick-verdict="\${c.id}" data-verdict="Diterima">Terima Kandidat</button>
          \`}
        </div>
      \`;
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function renderMemoList() {
      const box = document.getElementById('hrMemoListBox');
      const heading = document.getElementById('memoListHeading');
      const badge = document.getElementById('pendingTaskBadge');
      const role = state.activeRole;

      const roleMemos = state.memos.filter(m => m.role === 'all' || m.role === role);
      const openCount = roleMemos.filter(m => !m.selesai).length;
      badge.textContent = \`\${openCount} Notif\`;

      const filtered = state.selectedDate ? roleMemos.filter(m => m.tanggal === state.selectedDate) : roleMemos;
      heading.textContent = state.selectedDate ? \`Agenda \${state.selectedDate}\` : \`Daftar Agenda (\${filtered.length})\`;

      if (filtered.length === 0) {
        box.innerHTML = \`<div class="text-xs py-4 text-center" style="color: var(--ink-muted);">Tidak ada agenda di tanggal ini.</div>\`;
        return;
      }

      box.innerHTML = filtered.map(m => \`
        <div class="p-3 rounded-lg border flex items-start justify-between gap-2.5 \${m.selesai ? 'opacity-60' : ''}" style="background: var(--bg-surface); border-color: var(--border-hairline);">
          <label class="flex items-start gap-2.5 cursor-pointer flex-1 min-w-0">
            <input type="checkbox" class="mt-0.5 cursor-pointer rounded" style="accent-color: var(--kov-pine);" data-toggle-memo="\${m.id}" \${m.selesai ? 'checked' : ''}>
            <div class="min-w-0 flex-1">
              <div class="text-xs font-bold leading-snug \${m.selesai ? 'line-through' : ''}" style="color: var(--ink-primary);">\${m.judul}</div>
              <div class="font-mono-num text-[10px] mt-0.5" style="color: var(--ink-muted);">\${m.tanggal} &bull; \${m.waktu} &bull; \${m.kategori}</div>
            </div>
          </label>
          <button type="button" class="text-xs px-1.5 py-0.5 kov-soft-icon-btn rounded" style="color: var(--ink-muted);" data-delete-memo="\${m.id}">&times;</button>
        </div>
      \`).join('');
    }

    function renderCalendar() {
      const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
      document.getElementById('calTitle').textContent = \`\${months[state.calMonth]} \${state.calYear}\`;
      const grid = document.getElementById('calendarGrid');
      grid.innerHTML = '';

      for (let d = 1; d <= 31; d++) {
        const dateStr = \`\${String(d).padStart(2, '0')}/10/2026\`;
        const isoStr = \`2026-10-\${String(d).padStart(2, '0')}\`;
        const isActive = state.selectedDate === dateStr;
        const hasAgenda = state.memos.some(m => (m.role === 'all' || m.role === state.activeRole) && m.tanggal === dateStr);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = \`cal-day-btn \${isActive ? 'active' : ''}\`;
        btn.innerHTML = \`
          <span>\${d}</span>
          \${hasAgenda ? \`<span class="cal-dot" style="background: \${isActive ? '#ffffff' : 'var(--kov-pine)'};"></span>\` : ''}
        \`;
        btn.addEventListener('click', () => {
          state.selectedDate = dateStr;
          document.getElementById('memoDateInput').value = isoStr;
          document.getElementById('composerSelectedDateBadge').textContent = dateStr;
          document.getElementById('memoTitleInput').focus();
          renderCalendar();
          renderMemoList();
          renderMainModule();
          showToast({ title: \`Tanggal \${dateStr}\`, msg: 'Silakan isi agenda pada formulir di bawah kalender.' });
        });
        grid.appendChild(btn);
      }
    }

    function handleRoleSwitch(newRole) {
      setLaserLoading(true);
      state.activeRole = newRole;
      renderNavigationForRole();
      renderMetricTilesForRole();
      renderMainModule();
      renderCalendar();
      renderMemoList();

      const roleLabels = {
        admin: 'Super Admin HR (Akses Penuh)',
        reviewer: 'Reviewer Divisi (Mode Evaluasi & Sensor NIK)',
        manager: 'Manajer Operasional (Mode Approval & Kuota)'
      };

      setTimeout(() => {
        setLaserLoading(false);
        showToast({
          type: 'success',
          title: 'Peran Sistem Diubah',
          msg: \`Aktif sebagai: \${roleLabels[newRole]}\`
        });
      }, 150);
    }

    document.getElementById('roleSelector').addEventListener('change', (e) => {
      handleRoleSwitch(e.target.value);
    });

    document.getElementById('sidebarNav').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-module]');
      if (!btn) return;
      state.activeModule = btn.getAttribute('data-module');
      renderNavigationForRole();
      renderMainModule();
    });

    document.getElementById('btnCollapseSidebar').addEventListener('click', () => {
      const sb = document.getElementById('kovSidebar');
      sb.classList.toggle('collapsed');
    });

    document.getElementById('btnToggleRightCalendar').addEventListener('click', () => {
      document.getElementById('bentoWorkspaceGrid').classList.toggle('calendar-collapsed');
    });

    document.getElementById('btnToggleTheme').addEventListener('click', () => {
      const html = document.documentElement;
      const isDark = html.getAttribute('data-theme') === 'dark';
      if (isDark) {
        html.removeAttribute('data-theme');
        document.getElementById('themeLabel').textContent = 'Mode Gelap';
        showToast({ title: 'Tema Terang Aktif', msg: 'Palet KOV Framed-Sheet diaktifkan.' });
      } else {
        html.setAttribute('data-theme', 'dark');
        document.getElementById('themeLabel').textContent = 'Mode Terang';
        showToast({ title: 'Tema Gelap Aktif', msg: 'Palet Executive Slate Gelap diaktifkan.' });
      }
    });

    document.getElementById('globalSearchInput').addEventListener('input', (e) => {
      state.search = e.target.value.trim().toLowerCase();
      renderMainModule();
    });

    document.getElementById('hrMemoForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const titleInput = document.getElementById('memoTitleInput');
      const dateInput = document.getElementById('memoDateInput');
      const timeInput = document.getElementById('memoTimeInput');
      const catSelect = document.getElementById('memoCategorySelect');
      const composerCard = document.getElementById('memoComposerCard');

      const judul = titleInput.value.trim();
      if (!judul) {
        triggerValidationError(titleInput, composerCard, 'Isi memo wajib ditulis dulu!');
        return;
      }

      titleInput.classList.remove('kov-input-error');
      document.getElementById('memoInlineError').classList.add('hidden');
      setLaserLoading(true);

      setTimeout(() => {
        setLaserLoading(false);
        const dispDate = isoToDisplay(dateInput.value);
        state.memos.unshift({
          id: Date.now(),
          role: state.activeRole,
          tanggal: dispDate,
          waktu: timeInput.value || '10:00',
          kategori: catSelect.value,
          judul,
          selesai: false
        });
        state.selectedDate = dispDate;
        titleInput.value = '';
        renderCalendar();
        renderMemoList();
        showSubmitModalAnimation('Memo Tersimpan', \`Agenda pada \${dispDate} berhasil ditambahkan.\`);
      }, 200);
    });

    document.getElementById('btnPrevMonth').addEventListener('click', () => {
      state.calMonth = (state.calMonth + 11) % 12;
      renderCalendar();
    });
    document.getElementById('btnNextMonth').addEventListener('click', () => {
      state.calMonth = (state.calMonth + 1) % 12;
      renderCalendar();
    });
    document.getElementById('btnResetCalDate').addEventListener('click', () => {
      state.selectedDate = null;
      renderCalendar();
      renderMemoList();
      renderMainModule();
    });

    document.getElementById('btnNotifBell').addEventListener('click', () => {
      const roleMemos = state.memos.filter(m => (m.role === 'all' || m.role === state.activeRole) && !m.selesai);
      showToast({
        title: \`\${roleMemos.length} Agenda Aktif\`,
        msg: roleMemos.length ? \`Terdekat: "\${roleMemos[0].judul}" (\${roleMemos[0].tanggal})\` : 'Semua agenda selesai.'
      });
    });

    document.getElementById('btnTopbarPrimary').addEventListener('click', () => {
      showSubmitModalAnimation('Link Formulir Disalin', \`https://internal.kovgroups.com/?ref=\${state.shareToken}\`);
    });

    document.addEventListener('click', (e) => {
      const detailBtn = e.target.closest('[data-open-detail]');
      if (detailBtn) {
        openCandidateDetail(Number(detailBtn.getAttribute('data-open-detail')));
        return;
      }

      if (e.target.closest('#btnCloseDetailModal') || e.target.id === 'candidateDetailModal') {
        const modal = document.getElementById('candidateDetailModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        return;
      }

      const appBaBtn = e.target.closest('[data-approve-ba]');
      if (appBaBtn) {
        const id = Number(appBaBtn.getAttribute('data-approve-ba'));
        const item = state.baList.find(b => b.id === id);
        if (item) {
          item.status = 'Disetujui';
          renderMainModule();
          renderMetricTilesForRole();
          showSubmitModalAnimation('Berita Acara Disetujui', \`\${item.no_ba} telah disetujui.\`);
        }
        return;
      }

      const rejBaBtn = e.target.closest('[data-reject-ba]');
      if (rejBaBtn) {
        const id = Number(rejBaBtn.getAttribute('data-reject-ba'));
        const item = state.baList.find(b => b.id === id);
        if (item) {
          item.status = 'Ditolak';
          renderMainModule();
          renderMetricTilesForRole();
          showToast({ type: 'error', title: 'Berita Acara Ditolak', msg: \`\${item.no_ba} ditolak.\` });
        }
        return;
      }

      const star = e.target.closest('[data-star]');
      if (star) {
        const rating = Number(star.getAttribute('data-star'));
        const stars = document.querySelectorAll('#modalStarRating [data-star]');
        stars.forEach((s, idx) => { s.textContent = idx < rating ? '★' : '☆'; });
        return;
      }

      const saveRev = e.target.closest('[data-save-review]');
      if (saveRev) {
        const id = Number(saveRev.getAttribute('data-save-review'));
        const cand = state.candidates.find(c => c.id === id);
        const note = document.getElementById('modalReviewerNote').value;
        if (cand) {
          cand.catatanReviewer = note;
          document.getElementById('candidateDetailModal').classList.add('hidden');
          renderMainModule();
          showToast({ title: 'Catatan Tersimpan', msg: \`Evaluasi untuk \${cand.nama} telah diperbarui.\` });
        }
        return;
      }

      const recCand = e.target.closest('[data-recommend-cand]');
      if (recCand) {
        const id = Number(recCand.getAttribute('data-recommend-cand'));
        const cand = state.candidates.find(c => c.id === id);
        if (cand) {
          cand.status = 'Dipertimbangkan';
          document.getElementById('candidateDetailModal').classList.add('hidden');
          renderMainModule();
          showSubmitModalAnimation('Rekomendasi Terkirim', \`\${cand.nama} direkomendasikan lulus uji praktik.\`);
        }
        return;
      }

      const verdictBtn = e.target.closest('[data-quick-verdict]');
      if (verdictBtn) {
        const cid = Number(verdictBtn.getAttribute('data-quick-verdict'));
        const newVerdict = verdictBtn.getAttribute('data-verdict');
        const cand = state.candidates.find(x => x.id === cid);
        if (cand) {
          cand.status = newVerdict;
          document.getElementById('candidateDetailModal').classList.add('hidden');
          renderMainModule();
          renderMetricTilesForRole();
          showSubmitModalAnimation(\`Status: \${newVerdict}\`, \`\${cand.nama} diperbarui menjadi \${newVerdict}.\`);
        }
        return;
      }

      const stBtn = e.target.closest('[data-status-pill]');
      if (stBtn) {
        state.hrStatus = stBtn.getAttribute('data-status-pill');
        renderMainModule();
        return;
      }

      const revCand = e.target.closest('[data-review-candidate]');
      if (revCand) {
        const name = revCand.getAttribute('data-review-candidate');
        document.getElementById('bentoWorkspaceGrid').classList.remove('calendar-collapsed');
        const input = document.getElementById('memoTitleInput');
        if (input) {
          input.value = \`Interview — \${name}\`;
          input.focus();
        }
        showToast({ title: \`Jadwalkan \${name}\`, msg: 'Klik Simpan ke Kalender di panel kanan.' });
        return;
      }

      const delMemo = e.target.closest('[data-delete-memo]');
      if (delMemo) {
        const id = Number(delMemo.getAttribute('data-delete-memo'));
        state.memos = state.memos.filter(m => m.id !== id);
        renderCalendar();
        renderMemoList();
        return;
      }

      const toggleMemo = e.target.closest('[data-toggle-memo]');
      if (toggleMemo) {
        const id = Number(toggleMemo.getAttribute('data-toggle-memo'));
        const item = state.memos.find(m => m.id === id);
        if (item) {
          item.selesai = toggleMemo.checked;
          renderMemoList();
        }
        return;
      }
    });

    // Initialize
    renderNavigationForRole();
    renderMetricTilesForRole();
    renderMainModule();
    renderCalendar();
    renderMemoList();
  </script>
</body>
</html>
`;

const destPath = 'C:\\\\Users\\\\ACER\\\\Downloads\\\\kov_koffie_natural_pastel_hand_crafted_system_layout.html';
fs.writeFileSync(destPath, htmlContent, 'utf8');
console.log('Successfully written to:', destPath, 'Length:', htmlContent.length);

// Also save copy to recruitment-biodata-app/public/kov_layout.html
const publicPath = 'C:\\\\Users\\\\ACER\\\\recruitment-biodata-app\\\\public\\\\kov_layout.html';
fs.writeFileSync(publicPath, htmlContent, 'utf8');
console.log('Successfully saved to:', publicPath);
