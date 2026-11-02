const fs = require('fs');
const path = require('path');

const repoDir = path.join(__dirname, '..');

// 1. Process kov-portal.css
const cssPath = path.join(repoDir, 'public', 'assets', 'css', 'kov-portal.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Replace transition: all with explicit targeted transitions
css = css.replace(/transition:\s*all\s*([0-9.]+s)?\s*([a-z-]+)?/gi, (match, dur, ease) => {
  const d = dur || '0.15s';
  const e = ease || 'ease';
  return `transition: color ${d} ${e}, background-color ${d} ${e}, border-color ${d} ${e}, box-shadow ${d} ${e}, opacity ${d} ${e}`;
});

// Replace transitioning width/height/left/top
css = css.replace(/transition:\s*width\s*([0-9.]+s)?\s*([a-z-]+)?/gi, 'transition: opacity 0.15s ease, transform 0.15s ease');
css = css.replace(/transition:\s*height\s*([0-9.]+s)?\s*([a-z-]+)?/gi, 'transition: opacity 0.15s ease, transform 0.15s ease');
css = css.replace(/transition:\s*left\s*([0-9.]+s)?\s*([a-z-]+)?/gi, 'transition: transform 0.15s ease');

// Hallmark Line 1 Stamp
const stampHeader = `/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full
 * paper: #f8fafc · accent: #166534 · display: Plus Jakarta Sans · body: Plus Jakarta Sans
 * nav: kept · signature: kept · states: default, hover, focus, active, disabled
 * axes: paper/display/accent · posture: restrained · contrast: pass · v2.0.0 */
/* Hallmark · pre-emit critique: P_ H_ E_ S_ R_ V_ · weakest: R, refined table column balance, symmetrical grids, and untracked typography */
@import url("./tokens.css");
@import url("./base.css");
`;

if (!css.startsWith('/* Hallmark')) {
  css = stampHeader + '\n' + css;
}

// Ensure the Framed-Sheet Anti-Slop section at the bottom is pristine and Hallmark-compliant
const sectionMarker = '/* ==========================================================================\n   KOV FRAMED-SHEET ANTI-SLOP DESIGN SYSTEM (SINGLE SOURCE OF TRUTH)\n   ========================================================================== */';
const idx = css.indexOf(sectionMarker);

const hallmarkSheetCSS = `/* ==========================================================================
   KOV FRAMED-SHEET ANTI-SLOP DESIGN SYSTEM (SINGLE SOURCE OF TRUTH)
   Hallmark Design Methodology: Pure neutral canvas, crisp white cards,
   hairline rules (1px solid #e2e8f0), KOV Botanical Pine (#166534), tabular numerals,
   untracked sentence-case typography, zero decorative dots, zero pastel gradients.
   ========================================================================== */

/* --- 1. Canvas & Root Framing --- */
body, .dd-theme, .dd-layout-root, .dd-main-canvas {
  background-color: var(--color-paper, #f8fafc) !important;
  color: var(--color-ink-2, #334155) !important;
  font-family: var(--font-body, 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif) !important;
  overflow-x: clip !important;
}

/* --- 2. Topbar Clean Layout --- */
.dd-topbar {
  background: var(--color-paper-2, #ffffff) !important;
  border-bottom: 1px solid var(--color-rule, #e2e8f0) !important;
  padding: 10px 24px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 16px !important;
  box-shadow: none !important;
}

.dd-search-container {
  background: var(--color-paper, #f8fafc) !important;
  border: 1px solid var(--color-rule, #e2e8f0) !important;
  border-radius: var(--radius-control, 6px) !important;
  padding: 0 12px !important;
  height: 40px !important;
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  transition: border-color var(--dur-micro, 0.15s) ease, box-shadow var(--dur-micro, 0.15s) ease !important;
  box-shadow: none !important;
}

.dd-search-container:focus-within {
  border-color: var(--color-accent, #166534) !important;
  background: var(--color-paper-2, #ffffff) !important;
  box-shadow: 0 0 0 3px rgba(22, 101, 52, 0.1) !important;
}

.dd-search-input {
  border: none !important;
  background: transparent !important;
  outline: none !important;
  font-size: var(--text-base, 14px) !important;
  color: var(--color-ink, #0f172a) !important;
  width: 100% !important;
}

.dd-search-input::placeholder {
  color: var(--color-muted, #64748b) !important;
}

.dd-search-icon {
  color: var(--color-muted, #64748b) !important;
  font-size: 14px !important;
}

/* --- 3. Hero Command Banner --- */
.dd-hero-banner {
  background: var(--color-paper-2, #ffffff) !important;
  border: 1px solid var(--color-rule, #e2e8f0) !important;
  border-radius: var(--radius-card, 8px) !important;
  padding: 20px 24px !important;
  margin-bottom: 20px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  flex-wrap: wrap !important;
  gap: 16px !important;
  box-shadow: var(--shadow-card, 0 1px 3px 0 rgba(15, 23, 42, 0.04)) !important;
}

.dd-hero-title {
  font-size: var(--text-xl, 1.25rem) !important;
  font-weight: 700 !important;
  color: var(--color-ink, #0f172a) !important;
  letter-spacing: var(--tracking-tight, -0.015em) !important;
  margin: 0 0 4px 0 !important;
  line-height: 1.3 !important;
}

.dd-hero-subtitle {
  font-size: var(--text-sm, 0.8125rem) !important;
  color: var(--color-muted, #64748b) !important;
  margin: 0 !important;
  line-height: 1.45 !important;
}

/* Button System: Symmetrical 38px Controls */
.btn-dd-hero, .btn-kov-primary {
  height: 38px !important;
  background-color: var(--color-accent, #166534) !important;
  color: var(--color-accent-ink, #ffffff) !important;
  border: 1px solid var(--color-accent, #166534) !important;
  border-radius: var(--radius-control, 6px) !important;
  padding: 0 16px !important;
  font-size: var(--text-sm, 13px) !important;
  font-weight: 600 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  cursor: pointer !important;
  transition: background-color var(--dur-micro, 0.15s) ease, border-color var(--dur-micro, 0.15s) ease !important;
  box-shadow: none !important;
}

.btn-dd-hero:hover, .btn-kov-primary:hover {
  background-color: var(--color-accent-hover, #14532d) !important;
  border-color: var(--color-accent-hover, #14532d) !important;
  color: #ffffff !important;
}

.btn-kov-outline {
  height: 38px !important;
  background-color: var(--color-paper-2, #ffffff) !important;
  color: var(--color-ink-2, #334155) !important;
  border: 1px solid var(--color-rule, #e2e8f0) !important;
  border-radius: var(--radius-control, 6px) !important;
  padding: 0 14px !important;
  font-size: var(--text-sm, 13px) !important;
  font-weight: 600 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  cursor: pointer !important;
  transition: background-color var(--dur-micro, 0.15s) ease, border-color var(--dur-micro, 0.15s) ease !important;
  box-shadow: none !important;
}

.btn-kov-outline:hover {
  background-color: var(--color-paper, #f8fafc) !important;
  border-color: #cbd5e1 !important;
  color: var(--color-ink, #0f172a) !important;
}

/* --- 4. Symmetrical 4-Card KPI Strip --- */
.kov-kpi-row {
  display: grid !important;
  grid-template-columns: repeat(4, 1fr) !important;
  gap: 16px !important;
  margin-bottom: 20px !important;
}

@media (max-width: 991px) {
  .kov-kpi-row {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 575px) {
  .kov-kpi-row {
    grid-template-columns: 1fr !important;
  }
}

.coinbase-kpi-card {
  background: var(--color-paper-2, #ffffff) !important;
  border: 1px solid var(--color-rule, #e2e8f0) !important;
  border-radius: var(--radius-card, 8px) !important;
  padding: 16px 18px !important;
  box-shadow: var(--shadow-card, 0 1px 3px 0 rgba(15, 23, 42, 0.04)) !important;
  cursor: pointer !important;
  transition: border-color var(--dur-micro, 0.15s) ease, box-shadow var(--dur-micro, 0.15s) ease !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: space-between !important;
}

.coinbase-kpi-card:hover {
  border-color: #cbd5e1 !important;
  box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.06) !important;
}

.coinbase-kpi-card.active {
  border-color: var(--color-accent, #166534) !important;
  box-shadow: 0 0 0 2px rgba(22, 101, 52, 0.15) !important;
}

.bento-metric-title {
  font-size: var(--text-xs, 12px) !important;
  font-weight: 600 !important;
  color: var(--color-muted, #64748b) !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  margin-bottom: 6px !important;
}

.bento-metric-value {
  font-size: var(--text-2xl, 1.625rem) !important;
  font-weight: 700 !important;
  color: var(--color-ink, #0f172a) !important;
  line-height: 1.15 !important;
  font-variant-numeric: tabular-nums !important;
  margin-bottom: 4px !important;
}

.bento-metric-sub {
  font-size: 11px !important;
  color: var(--color-muted, #64748b) !important;
  margin-top: auto !important;
}

/* --- 5. Division Tabs: Symmetrical 4x2 Grid --- */
.dd-folders-grid {
  display: grid !important;
  grid-template-columns: repeat(4, 1fr) !important;
  grid-template-rows: auto auto !important;
  gap: 10px !important;
  margin-bottom: 20px !important;
}

@media (max-width: 991px) {
  .dd-folders-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

.dd-folder-card {
  height: 42px !important;
  min-height: 42px !important;
  background: var(--color-paper-2, #ffffff) !important;
  border: 1px solid var(--color-rule, #e2e8f0) !important;
  border-radius: var(--radius-control, 6px) !important;
  padding: 0 12px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  cursor: pointer !important;
  transition: background-color var(--dur-micro, 0.15s) ease, border-color var(--dur-micro, 0.15s) ease !important;
  box-shadow: none !important;
}

.dd-folder-card:hover {
  background-color: var(--color-paper, #f8fafc) !important;
  border-color: #cbd5e1 !important;
}

.dd-folder-card.active {
  background-color: var(--color-accent, #166534) !important;
  border-color: var(--color-accent, #166534) !important;
}

.dd-folder-card.active .dd-folder-title {
  color: #ffffff !important;
}

.dd-folder-card.active .badge-tab-count {
  background: rgba(255, 255, 255, 0.22) !important;
  color: #ffffff !important;
  border: none !important;
}

.dd-folder-title {
  font-size: var(--text-sm, 13px) !important;
  font-weight: 600 !important;
  color: var(--color-ink-2, #334155) !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.badge-tab-count {
  font-size: 11px !important;
  font-weight: 700 !important;
  padding: 2px 7px !important;
  border-radius: 4px !important;
  background: var(--color-paper, #f1f5f9) !important;
  color: var(--color-muted, #64748b) !important;
  font-variant-numeric: tabular-nums !important;
}

/* --- 6. Table & List Presentation --- */
.kov-table-card {
  background: var(--color-paper-2, #ffffff) !important;
  border: 1px solid var(--color-rule, #e2e8f0) !important;
  border-radius: var(--radius-card, 8px) !important;
  box-shadow: var(--shadow-card, 0 1px 3px 0 rgba(15, 23, 42, 0.04)) !important;
  overflow: hidden !important;
  margin-bottom: 24px !important;
}

.kov-table-header-box {
  padding: 16px 20px !important;
  border-bottom: 1px solid var(--color-rule, #e2e8f0) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  flex-wrap: wrap !important;
  gap: 12px !important;
}

.kov-table-title {
  font-size: var(--text-md, 15px) !important;
  font-weight: 700 !important;
  color: var(--color-ink, #0f172a) !important;
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.kov-badge-count {
  font-size: 11px !important;
  font-weight: 600 !important;
  padding: 2px 8px !important;
  border-radius: 4px !important;
  background: var(--color-paper, #f1f5f9) !important;
  color: var(--color-muted, #64748b) !important;
}

.kov-status-filter-bar {
  padding: 10px 20px !important;
  background: var(--color-paper, #f8fafc) !important;
  border-bottom: 1px solid var(--color-rule, #e2e8f0) !important;
  display: flex !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  gap: 8px !important;
}

.kov-filter-pill-botanical {
  height: 32px !important;
  padding: 0 12px !important;
  font-size: var(--text-xs, 12px) !important;
  font-weight: 500 !important;
  border-radius: var(--radius-control, 6px) !important;
  border: 1px solid var(--color-rule, #e2e8f0) !important;
  background: var(--color-paper-2, #ffffff) !important;
  color: var(--color-ink-2, #334155) !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  cursor: pointer !important;
  transition: background-color var(--dur-micro, 0.15s) ease, border-color var(--dur-micro, 0.15s) ease !important;
}

.kov-filter-pill-botanical:hover {
  background: var(--color-paper, #f1f5f9) !important;
  border-color: #cbd5e1 !important;
}

.kov-filter-pill-botanical.active {
  background: var(--color-accent, #166534) !important;
  color: #ffffff !important;
  border-color: var(--color-accent, #166534) !important;
}

.kov-botanical-table {
  width: 100% !important;
  border-collapse: collapse !important;
}

.kov-botanical-table thead th {
  background: var(--color-paper, #f8fafc) !important;
  font-size: var(--text-xs, 12px) !important;
  font-weight: 600 !important;
  color: var(--color-muted, #64748b) !important;
  padding: 10px 14px !important;
  border-bottom: 1px solid var(--color-rule, #e2e8f0) !important;
  text-align: left !important;
  text-transform: none !important;
  letter-spacing: normal !important;
}

.kov-botanical-table tbody td {
  padding: 12px 14px !important;
  border-bottom: 1px solid var(--color-rule-subtle, #f1f5f9) !important;
  vertical-align: middle !important;
  font-size: var(--text-sm, 13px) !important;
  color: var(--color-ink-2, #334155) !important;
}

.kov-botanical-table tbody tr:hover {
  background-color: var(--color-paper, #f8fafc) !important;
}

/* Symmetrical Action Buttons in Table */
.kov-action-review-btn {
  height: 30px !important;
  padding: 0 10px !important;
  font-size: 11.5px !important;
  font-weight: 600 !important;
  border-radius: var(--radius-control, 6px) !important;
  background: var(--color-accent, #166534) !important;
  color: #ffffff !important;
  border: 1px solid var(--color-accent, #166534) !important;
  display: inline-flex !important;
  align-items: center !important;
  text-decoration: none !important;
  transition: background-color var(--dur-micro, 0.15s) ease !important;
}

.kov-action-review-btn:hover {
  background: var(--color-accent-hover, #14532d) !important;
  color: #ffffff !important;
}

.kov-action-icon-circle {
  width: 30px !important;
  height: 30px !important;
  border-radius: var(--radius-control, 6px) !important;
  border: 1px solid var(--color-rule, #e2e8f0) !important;
  background: var(--color-paper-2, #ffffff) !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 12px !important;
  text-decoration: none !important;
  transition: background-color var(--dur-micro, 0.15s) ease !important;
}

.kov-action-icon-circle:hover {
  background: var(--color-paper, #f1f5f9) !important;
  border-color: #cbd5e1 !important;
}

/* --- 7. Status Pills (Semantic, Accessible, No Fake Blinking) --- */
.status-pill-modern {
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  font-size: 11.5px !important;
  font-weight: 600 !important;
  padding: 3px 8px !important;
  border-radius: 4px !important;
  line-height: 1.3 !important;
  white-space: nowrap !important;
}

.status-dot-pulse {
  display: none !important;
}

.pill-success {
  background: var(--color-success-bg, #f0fdf4) !important;
  color: var(--color-success, #166534) !important;
  border: 1px solid var(--color-success-border, #bbf7d0) !important;
}

.pill-warning {
  background: var(--color-warning-bg, #fef3c7) !important;
  color: var(--color-warning, #b45309) !important;
  border: 1px solid var(--color-warning-border, #fde68a) !important;
}

.pill-danger {
  background: var(--color-error-bg, #fef2f2) !important;
  color: var(--color-error, #b91c1c) !important;
  border: 1px solid var(--color-error-border, #fecaca) !important;
}

.pill-info {
  background: var(--color-info-bg, #eff6ff) !important;
  color: var(--color-info, #1d4ed8) !important;
  border: 1px solid var(--color-info-border, #bfdbfe) !important;
}

/* --- 8. Right Panel Calendar & Tasks --- */
.dd-calendar-widget, .dd-task-widget {
  background: var(--color-paper-2, #ffffff) !important;
  border: 1px solid var(--color-rule, #e2e8f0) !important;
  border-radius: var(--radius-card, 8px) !important;
  box-shadow: var(--shadow-card, 0 1px 3px 0 rgba(15, 23, 42, 0.04)) !important;
  padding: 16px !important;
  margin-bottom: 20px !important;
}

.dd-calendar-title, .dd-task-title {
  font-size: var(--text-sm, 13px) !important;
  font-weight: 700 !important;
  color: var(--color-ink, #0f172a) !important;
  text-transform: none !important;
  letter-spacing: normal !important;
}

.dd-cal-day {
  height: 30px !important;
  width: 30px !important;
  border-radius: 4px !important;
  font-size: 11.5px !important;
  font-weight: 500 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  transition: background-color var(--dur-micro, 0.15s) ease !important;
}

.dd-cal-day:hover {
  background-color: var(--color-paper, #f1f5f9) !important;
}

.dd-cal-day.has-event {
  background-color: var(--color-accent-subtle, #f0fdf4) !important;
  color: var(--color-accent, #166534) !important;
  font-weight: 700 !important;
}

.dd-cal-day.active {
  background-color: var(--color-accent, #166534) !important;
  color: #ffffff !important;
}

/* --- 9. Dark Mode System --- */
[data-theme="dark"] body,
[data-theme="dark"] .dd-layout-root,
[data-theme="dark"] .dd-main-canvas {
  background-color: #090d16 !important;
  color: #cbd5e1 !important;
}

[data-theme="dark"] .dd-topbar,
[data-theme="dark"] .dd-hero-banner,
[data-theme="dark"] .coinbase-kpi-card,
[data-theme="dark"] .dd-folder-card,
[data-theme="dark"] .kov-table-card,
[data-theme="dark"] .kov-status-filter-bar,
[data-theme="dark"] .dd-calendar-widget,
[data-theme="dark"] .dd-task-widget {
  background-color: #111827 !important;
  border-color: #1f2937 !important;
  color: #cbd5e1 !important;
}

[data-theme="dark"] .dd-search-container {
  background-color: #0f172a !important;
  border-color: #1f2937 !important;
}

[data-theme="dark"] .dd-hero-title,
[data-theme="dark"] .kov-table-title,
[data-theme="dark"] .bento-metric-value,
[data-theme="dark"] .kov-candidate-name {
  color: #f8fafc !important;
}

[data-theme="dark"] .kov-botanical-table thead th {
  background-color: #1e293b !important;
  border-color: #1f2937 !important;
  color: #94a3b8 !important;
}

[data-theme="dark"] .kov-botanical-table tbody td {
  border-bottom-color: #1f2937 !important;
  color: #cbd5e1 !important;
}

[data-theme="dark"] .kov-botanical-table tbody tr:hover {
  background-color: #1e293b !important;
}
`;

if (idx !== -1) {
  css = css.substring(0, idx) + hallmarkSheetCSS;
} else {
  css = css + '\n\n' + hallmarkSheetCSS;
}

fs.writeFileSync(cssPath, css, 'utf8');
console.log('✅ Successfully updated kov-portal.css with Hallmark Stamp, Token Imports, and Framed-Sheet Architecture.');

// 2. Refine views/admin.ejs
const adminViewPath = path.join(repoDir, 'views', 'admin.ejs');
let adminHtml = fs.readFileSync(adminViewPath, 'utf8');

// Replace pulse dot and redundant decorative badge in Topbar
adminHtml = adminHtml.replace(
  /<div class="d-none d-sm-inline-flex align-items-center gap-2 px-3 py-1\.5 rounded-pill bg-white border text-muted"[^>]*>[\s\S]*?<span class="kov-pulse-dot"><\/span>[\s\S]*?<\/div>/gi,
  '<div class="d-none d-sm-inline-flex align-items-center px-2.5 py-1 rounded bg-white border text-secondary" style="font-size: 0.8125rem; font-weight: 500;"><span>Portal Rekrutmen Terpusat</span></div>'
);

// Replace &mdash; in Hero Title
adminHtml = adminHtml.replace(
  /<h2 class="dd-hero-title">\s*Dashboard Rekrutmen HR &mdash; ([\s\S]*?)<\/h2>/gi,
  '<h2 class="dd-hero-title">Dashboard Rekrutmen HR: $1</h2>'
);

// Replace uppercase tracked KPI Metric titles
adminHtml = adminHtml.replace('<span class="bento-metric-title">TOTAL PELAMAR</span>', '<span class="bento-metric-title">Total pelamar</span>');
adminHtml = adminHtml.replace('<span class="bento-metric-title text-warning">PERLU DITINJAU</span>', '<span class="bento-metric-title text-warning">Perlu ditinjau</span>');
adminHtml = adminHtml.replace('<span class="bento-metric-title text-success">LULUS SELEKSI</span>', '<span class="bento-metric-title text-success">Lulus seleksi</span>');
adminHtml = adminHtml.replace('<span class="bento-metric-title text-danger">DATA GANDA</span>', '<span class="bento-metric-title text-danger">Data ganda</span>');

// Replace table headers with clean sentence-case untracked typography
adminHtml = adminHtml.replace('<th style="width: 48px; text-align: center;">TIPE</th>', '<th style="width: 48px; text-align: center;">Tipe</th>');
adminHtml = adminHtml.replace('TANGGAL <i class="fas fa-sort ms-1 opacity-50" id="sortIconDate"></i>', 'Tanggal <i class="fas fa-sort ms-1 opacity-50" id="sortIconDate"></i>');
adminHtml = adminHtml.replace('NAMA KANDIDAT <i class="fas fa-sort ms-1 opacity-50" id="sortIconName"></i>', 'Nama kandidat <i class="fas fa-sort ms-1 opacity-50" id="sortIconName"></i>');
adminHtml = adminHtml.replace('<th style="min-width: 110px;">POSISI</th>', '<th style="min-width: 110px;">Posisi</th>');
adminHtml = adminHtml.replace('<th style="min-width: 120px;">KONTAK</th>', '<th style="min-width: 120px;">Kontak</th>');
adminHtml = adminHtml.replace('STATUS <i class="fas fa-sort ms-1 opacity-50" id="sortIconStatus"></i>', 'Status <i class="fas fa-sort ms-1 opacity-50" id="sortIconStatus"></i>');
adminHtml = adminHtml.replace('<th style="width: 75px; text-align: center;">DATA</th>', '<th style="width: 75px; text-align: center;">Data</th>');
adminHtml = adminHtml.replace('<th class="text-center" style="width: 135px;">AKSI</th>', '<th class="text-center" style="width: 135px;">Aksi</th>');

fs.writeFileSync(adminViewPath, adminHtml, 'utf8');
console.log('✅ Successfully updated views/admin.ejs with Hallmark sentence-case typography and clean hero header.');

// 3. Refine views/partials/sidebar.ejs
const sidebarPath = path.join(repoDir, 'views', 'partials', 'sidebar.ejs');
let sidebarHtml = fs.readFileSync(sidebarPath, 'utf8');

sidebarHtml = sidebarHtml.replace('REKRUTMEN &amp; HR', 'Rekrutmen &amp; HR');
sidebarHtml = sidebarHtml.replace('OPERASIONAL', 'Operasional');
sidebarHtml = sidebarHtml.replace('INFRASTRUKTUR &amp; IT', 'Infrastruktur &amp; IT');
sidebarHtml = sidebarHtml.replace('SISTEM', 'Sistem');

fs.writeFileSync(sidebarPath, sidebarHtml, 'utf8');
console.log('✅ Successfully updated views/partials/sidebar.ejs with sentence-case navigation group titles.');
