const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'public', 'assets', 'css', 'kov-portal.css');
let css = fs.readFileSync(cssPath, 'utf8');

const marker = '/* ==========================================================================\n   12. DEFINITIVE KOV FRAMED-SHEET ANTI-SLOP DESIGN SYSTEM (V20)';
const markerCRLF = '/* ==========================================================================\r\n   12. DEFINITIVE KOV FRAMED-SHEET ANTI-SLOP DESIGN SYSTEM (V20)';

let idx = css.indexOf(marker);
if (idx === -1) {
  idx = css.indexOf(markerCRLF);
}

if (idx === -1) {
  console.error('Marker not found!');
  process.exit(1);
}

const cleanOverride = `/* ==========================================================================
   12. DEFINITIVE KOV FRAMED-SHEET ANTI-SLOP DESIGN SYSTEM (V20)
   - Architectural Standard: Flat surfaces, 1px solid #e2e8f0 hairlines
   - Typography: Plus Jakarta Sans with rational scale & tabular numerals
   - Palette: Pure Slate-50 (#f8fafc) Canvas, Crisp White Cards, KOV Forest Pine (#166534)
   - Zero-slop: NO rainbow pastel tiles, NO fake icons, NO wobbly radii, NO gradients
   ========================================================================== */

:root {
  --kov-font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  --kov-font-mono: 'JetBrains Mono', 'IBM Plex Mono', monospace !important;
  
  --kov-pine: #166534 !important;
  --kov-pine-hover: #14532d !important;
  --kov-pine-light: #f0fdf4 !important;
  
  --kov-canvas: #f8fafc !important;
  --cb-canvas: #f8fafc !important;
  --cb-surface-card: #ffffff !important;
  --cb-surface-input: #ffffff !important;
  --cb-border: #e2e8f0 !important;
  --cb-border-subtle: #f1f5f9 !important;
  --cb-border-focus: #166534 !important;

  --cb-text-primary: #0f172a !important;
  --cb-text-secondary: #334155 !important;
  --cb-text-muted: #64748b !important;
  --cb-text-subtle: #94a3b8 !important;

  --kov-slate-900: #0f172a !important;
  --kov-slate-800: #1e293b !important;
  --kov-slate-700: #334155 !important;
  --kov-slate-600: #475569 !important;
  --kov-slate-500: #64748b !important;
  --kov-slate-400: #94a3b8 !important;
  --kov-slate-200: #e2e8f0 !important;
  --kov-slate-100: #f1f5f9 !important;
  --kov-slate-50: #f8fafc !important;

  --dd-text-primary: #0f172a !important;
  --dd-text-secondary: #64748b !important;
  --dd-surface-card: #ffffff !important;
  --dd-border: #e2e8f0 !important;
  --dd-primary: #166534 !important;
  
  --bs-body-font-family: var(--kov-font-sans) !important;
  --bs-body-color: #334155 !important;
  --bs-body-bg: #f8fafc !important;
}

/* Base Body & Layout Framework */
body, .dd-layout-root, .kov-app-shell {
  font-family: var(--kov-font-sans) !important;
  background-color: #f8fafc !important;
  color: #334155 !important;
  -webkit-font-smoothing: antialiased !important;
}

.num, td.num, th.num, .kov-table-date, .kov-table-time, .bento-metric-value, .badge-tab-count {
  font-variant-numeric: tabular-nums !important;
}

/* Headings & Rational Scale */
h1, h2, h3, h4, h5, h6, .dd-hero-title, .kov-table-title, .kov-card-title {
  font-family: var(--kov-font-sans) !important;
  color: #0f172a !important;
  font-weight: 600 !important;
  letter-spacing: -0.02em !important;
}

.text-dark {
  color: #0f172a !important;
}

.text-muted {
  color: #64748b !important;
}

/* --- 1. Symmetrical App Shell & Sidebar Navigation --- */
.dd-layout-root {
  display: flex !important;
  min-height: 100vh !important;
  background-color: #f8fafc !important;
}

.dd-sidebar.kov-sidebar,
.kov-sidebar {
  width: 250px !important;
  min-width: 250px !important;
  background: #ffffff !important;
  border-right: 1px solid #e2e8f0 !important;
  box-shadow: none !important;
  display: flex !important;
  flex-direction: column !important;
  height: 100vh !important;
  position: sticky !important;
  top: 0 !important;
  z-index: 50 !important;
}

.dd-sidebar-brand,
.kov-sidebar-brand {
  height: 64px !important;
  padding: 0 18px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  border-bottom: 1px solid #e2e8f0 !important;
}

.dd-brand-logo {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  text-decoration: none !important;
}

.dd-brand-icon img {
  width: 34px !important;
  height: 34px !important;
  border-radius: 8px !important;
  border: 1px solid #e2e8f0 !important;
}

.dd-brand-text {
  display: flex !important;
  flex-direction: column !important;
}

.dd-brand-text span:first-child,
.kov-brand-title {
  font-size: 14.5px !important;
  font-weight: 700 !important;
  color: #0f172a !important;
  letter-spacing: -0.01em !important;
}

.dd-dot {
  color: #166534 !important;
  font-weight: 800 !important;
}

.kov-brand-subtitle {
  font-size: 9.5px !important;
  font-weight: 600 !important;
  color: #94a3b8 !important;
  letter-spacing: 0.06em !important;
  text-transform: uppercase !important;
}

.dd-sidebar-nav,
.kov-sidebar-nav {
  padding: 14px 12px !important;
  flex: 1 1 auto !important;
  overflow-y: auto !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 2px !important;
}

.dd-nav-group-title,
.kov-nav-group-title {
  font-size: 10.5px !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  color: #94a3b8 !important;
  padding: 12px 10px 4px !important;
}

.dd-sidebar .dd-nav-item,
.kov-sidebar .kov-nav-item {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  padding: 8px 10px !important;
  border-radius: 6px !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  color: #475569 !important;
  text-decoration: none !important;
  transition: all 0.15s ease !important;
  border: 1px solid transparent !important;
}

.dd-sidebar .dd-nav-item i,
.kov-sidebar .kov-nav-item i {
  font-size: 14px !important;
  width: 18px !important;
  text-align: center !important;
  color: #64748b !important;
}

.dd-sidebar .dd-nav-item:hover,
.kov-sidebar .kov-nav-item:hover {
  background: #f1f5f9 !important;
  color: #0f172a !important;
}

.dd-sidebar .dd-nav-item.active,
.kov-sidebar .kov-nav-item.active {
  background: #f0fdf4 !important;
  color: #166534 !important;
  border: 1px solid #dcfce7 !important;
  font-weight: 600 !important;
  box-shadow: none !important;
}

.dd-sidebar .dd-nav-item.active i,
.kov-sidebar .kov-nav-item.active i,
.dd-sidebar .dd-nav-item.active span,
.kov-sidebar .kov-nav-item.active span {
  color: #166534 !important;
}

.kov-sidebar-footer,
.dd-sidebar-footer {
  padding: 12px 14px !important;
  border-top: 1px solid #e2e8f0 !important;
  background: #ffffff !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 8px !important;
}

.kov-theme-toggle-sidebar {
  width: 100% !important;
  padding: 6px 10px !important;
  border-radius: 6px !important;
  border: 1px solid #e2e8f0 !important;
  background: #ffffff !important;
  color: #475569 !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
}

.kov-theme-toggle-sidebar:hover {
  background: #f1f5f9 !important;
  color: #0f172a !important;
}

.kov-user-badge-box {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  padding: 8px 10px !important;
  border-radius: 6px !important;
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
}

.kov-user-avatar {
  width: 28px !important;
  height: 28px !important;
  border-radius: 999px !important;
  background: #0f172a !important;
  color: #ffffff !important;
  font-size: 11.5px !important;
  font-weight: 700 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.kov-user-name {
  font-size: 12.5px !important;
  font-weight: 600 !important;
  color: #0f172a !important;
}

.kov-role-badge {
  font-size: 10px !important;
  font-weight: 600 !important;
  color: #166534 !important;
  background: #f0fdf4 !important;
  border: 1px solid #dcfce7 !important;
  padding: 1px 6px !important;
  border-radius: 4px !important;
  display: inline-block !important;
}

.kov-user-chevron {
  color: #94a3b8 !important;
  font-size: 11px !important;
}

.kov-logout-link {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  font-size: 12px !important;
  color: #64748b !important;
  text-decoration: none !important;
  padding: 4px 6px !important;
  transition: color 0.15s ease !important;
}

.kov-logout-link:hover {
  color: #ef4444 !important;
}

/* --- 2. Main Workspace Canvas & Topbar --- */
.dd-main-canvas.kov-main-content {
  flex: 1 1 0% !important;
  min-width: 0 !important;
  padding: 20px 28px 40px !important;
  background-color: #f8fafc !important;
  overflow-y: auto !important;
}

.dd-topbar {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 16px !important;
  margin-bottom: 18px !important;
}

.dd-search-container {
  position: relative !important;
  width: 100% !important;
  max-width: 520px !important;
}

.dd-search-icon {
  position: absolute !important;
  left: 12px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  color: #94a3b8 !important;
  font-size: 13px !important;
  pointer-events: none !important;
}

.dd-search-input {
  width: 100% !important;
  height: 38px !important;
  padding: 0 14px 0 36px !important;
  background: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
  border-radius: 6px !important;
  font-size: 13px !important;
  color: #0f172a !important;
  outline: none !important;
  transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
}

.dd-search-input:focus {
  border-color: #166534 !important;
  box-shadow: 0 0 0 3px rgba(22, 101, 52, 0.12) !important;
}

/* --- 3. Executive Command Header --- */
.dd-hero-banner {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
  padding: 16px 20px !important;
  margin-bottom: 16px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  flex-wrap: wrap !important;
  gap: 14px !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02) !important;
}

.dd-hero-title {
  font-size: 17px !important;
  font-weight: 600 !important;
  color: #0f172a !important;
  margin: 0 0 3px !important;
  line-height: 1.3 !important;
}

.dd-hero-subtitle {
  font-size: 12.5px !important;
  color: #64748b !important;
  margin: 0 !important;
  line-height: 1.4 !important;
}

.dd-hero-actions {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.btn-kov-outline {
  height: 34px !important;
  background: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
  color: #334155 !important;
  border-radius: 6px !important;
  font-size: 12.5px !important;
  font-weight: 500 !important;
  padding: 0 12px !important;
  display: inline-flex !important;
  align-items: center !important;
  text-decoration: none !important;
  transition: all 0.15s ease !important;
  cursor: pointer !important;
}

.btn-kov-outline:hover {
  background: #f8fafc !important;
  border-color: #94a3b8 !important;
  color: #0f172a !important;
}

.btn-dd-hero {
  height: 34px !important;
  background: #166534 !important;
  border: 1px solid #166534 !important;
  color: #ffffff !important;
  border-radius: 6px !important;
  font-size: 12.5px !important;
  font-weight: 600 !important;
  padding: 0 14px !important;
  display: inline-flex !important;
  align-items: center !important;
  text-decoration: none !important;
  transition: background-color 0.15s ease !important;
  cursor: pointer !important;
}

.btn-dd-hero:hover {
  background: #14532d !important;
  border-color: #14532d !important;
  color: #ffffff !important;
}

/* --- 4. Executive KPI Metric Strip (Anti-Slop: Type, Not Tiles - Crisp White Cards) --- */
.kov-kpi-row,
.kov-kpi-strip {
  display: grid !important;
  grid-template-columns: repeat(4, 1fr) !important;
  gap: 12px !important;
  margin-bottom: 16px !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.coinbase-kpi-card,
.kov-kpi-cell {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
  padding: 14px 18px !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02) !important;
  cursor: pointer !important;
  transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
  color: #0f172a !important;
}

.coinbase-kpi-card:hover,
.kov-kpi-cell:hover {
  border-color: #cbd5e1 !important;
}

.coinbase-kpi-card.active,
.kov-kpi-cell.active {
  border-color: #166534 !important;
  box-shadow: 0 0 0 1px #166534 !important;
}

.bento-metric-title,
.kov-kpi-cell-label {
  font-size: 11px !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  color: #64748b !important;
  margin-bottom: 4px !important;
  display: block !important;
}

.bento-metric-value,
.kov-kpi-cell-val {
  font-size: 24px !important;
  font-weight: 700 !important;
  color: #0f172a !important;
  line-height: 1.15 !important;
  font-variant-numeric: tabular-nums !important;
  display: block !important;
}

.bento-metric-sub,
.kov-kpi-cell-sub {
  font-size: 11.5px !important;
  color: #94a3b8 !important;
  margin-top: 4px !important;
  display: block !important;
}

/* Status indicator colors */
.kpi-total .bento-metric-value { color: #0f172a !important; }
.kpi-pending .bento-metric-value { color: #d97706 !important; }
.kpi-accepted .bento-metric-value { color: #166534 !important; }
.kpi-duplicate .bento-metric-value { color: #dc2626 !important; }

/* --- 5. Division Filter Tabs (Symmetrical 4x2 Responsive Grid) --- */
.dd-folders-grid {
  display: grid !important;
  grid-template-columns: repeat(4, 1fr) !important;
  gap: 6px !important;
  background: #f1f5f9 !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
  padding: 5px !important;
  margin-bottom: 16px !important;
}

.dd-folder-card {
  height: 36px !important;
  min-height: 36px !important;
  padding: 0 12px !important;
  border-radius: 6px !important;
  background: transparent !important;
  border: 1px solid transparent !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
  box-shadow: none !important;
}

.dd-folder-card:hover {
  background: rgba(255, 255, 255, 0.6) !important;
}

.dd-folder-card.active {
  background: #ffffff !important;
  border-color: #e2e8f0 !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05) !important;
}

.dd-folder-title {
  font-size: 12.5px !important;
  font-weight: 500 !important;
  color: #475569 !important;
  white-space: nowrap !important;
}

.dd-folder-card.active .dd-folder-title {
  color: #166534 !important;
  font-weight: 600 !important;
}

.badge-tab-count {
  font-size: 11px !important;
  font-weight: 600 !important;
  color: #94a3b8 !important;
  font-variant-numeric: tabular-nums !important;
  background: rgba(0, 0, 0, 0.04) !important;
  padding: 1px 6px !important;
  border-radius: 4px !important;
}

.dd-folder-card.active .badge-tab-count {
  color: #166534 !important;
  background: #f0fdf4 !important;
}

/* --- 6. Candidate Data Table Architecture --- */
.kov-table-card {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
  overflow: hidden !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02) !important;
}

.kov-table-header-box {
  padding: 14px 18px !important;
  border-bottom: 1px solid #e2e8f0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 12px !important;
  flex-wrap: wrap !important;
}

.kov-table-title-group {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
}

.kov-table-squircle {
  display: none !important;
}

.kov-table-title {
  font-size: 15px !important;
  font-weight: 600 !important;
  color: #0f172a !important;
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.kov-badge-count {
  font-size: 11.5px !important;
  font-weight: 500 !important;
  color: #64748b !important;
  background: #f1f5f9 !important;
  border: 1px solid #e2e8f0 !important;
  padding: 2px 7px !important;
  border-radius: 4px !important;
}

.kov-status-filter-bar {
  padding: 8px 18px !important;
  background: #fafafa !important;
  border-bottom: 1px solid #e2e8f0 !important;
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  flex-wrap: wrap !important;
}

.kov-filter-pill-botanical {
  font-size: 12px !important;
  font-weight: 500 !important;
  padding: 4px 10px !important;
  border-radius: 6px !important;
  border: 1px solid #e2e8f0 !important;
  background: #ffffff !important;
  color: #475569 !important;
  cursor: pointer !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  transition: all 0.15s ease !important;
}

.kov-filter-pill-botanical:hover {
  background: #f1f5f9 !important;
  color: #0f172a !important;
}

.kov-filter-pill-botanical.active {
  background: #166534 !important;
  border-color: #166534 !important;
  color: #ffffff !important;
  font-weight: 600 !important;
}

.kov-botanical-table-wrap {
  width: 100% !important;
  overflow-x: auto !important;
}

.kov-botanical-table {
  width: 100% !important;
  border-collapse: collapse !important;
  table-layout: auto !important;
}

.kov-botanical-table thead th {
  background: #fafafa !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.04em !important;
  color: #64748b !important;
  padding: 10px 14px !important;
  border-bottom: 1px solid #e2e8f0 !important;
  white-space: nowrap !important;
}

.kov-botanical-table tbody td {
  padding: 11px 14px !important;
  font-size: 13px !important;
  color: #334155 !important;
  border-bottom: 1px solid #f1f5f9 !important;
  vertical-align: middle !important;
}

.kov-botanical-table tbody tr:hover {
  background-color: #f8fafc !important;
}

.dd-file-badge {
  font-size: 10px !important;
  font-weight: 700 !important;
  padding: 2px 6px !important;
  border-radius: 4px !important;
  text-transform: uppercase !important;
  display: inline-block !important;
}

.dd-badge-pdf { background: #fee2e2 !important; color: #dc2626 !important; border: 1px solid #fecaca !important; }
.dd-badge-png { background: #e0e7ff !important; color: #4338ca !important; border: 1px solid #c7d2fe !important; }
.dd-badge-zip { background: #fef3c7 !important; color: #d97706 !important; border: 1px solid #fde68a !important; }

.kov-table-date {
  font-size: 12.5px !important;
  font-weight: 600 !important;
  color: #0f172a !important;
}

.kov-table-time {
  font-size: 11px !important;
  color: #94a3b8 !important;
}

.kov-avatar-monogram {
  width: 30px !important;
  height: 30px !important;
  border-radius: 999px !important;
  background: #f1f5f9 !important;
  border: 1px solid #e2e8f0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  color: #0f172a !important;
  flex-shrink: 0 !important;
}

.kov-candidate-name {
  font-size: 13px !important;
  font-weight: 600 !important;
  color: #0f172a !important;
  line-height: 1.3 !important;
}

.kov-candidate-sub {
  font-size: 11.5px !important;
  color: #64748b !important;
}

.kov-divisi-pill {
  font-size: 11.5px !important;
  font-weight: 500 !important;
  padding: 2px 8px !important;
  border-radius: 4px !important;
  background: #f1f5f9 !important;
  border: 1px solid #e2e8f0 !important;
  color: #334155 !important;
  display: inline-block !important;
}

/* Status Pills */
.status-pill-modern {
  font-size: 11.5px !important;
  font-weight: 500 !important;
  padding: 2px 8px !important;
  border-radius: 999px !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  white-space: nowrap !important;
}

.status-dot-pulse {
  width: 6px !important;
  height: 6px !important;
  border-radius: 999px !important;
}

.pill-success {
  background: #f0fdf4 !important;
  color: #166534 !important;
  border: 1px solid #bbf7d0 !important;
}
.pill-success .status-dot-pulse { background: #166534 !important; }

.pill-info {
  background: #eff6ff !important;
  color: #1d4ed8 !important;
  border: 1px solid #bfdbfe !important;
}
.pill-info .status-dot-pulse { background: #1d4ed8 !important; }

.pill-warning {
  background: #fffbeb !important;
  color: #b45309 !important;
  border: 1px solid #fde68a !important;
}
.pill-warning .status-dot-pulse { background: #b45309 !important; }

.pill-danger {
  background: #fff1f2 !important;
  color: #be123c !important;
  border: 1px solid #fecdd3 !important;
}
.pill-danger .status-dot-pulse { background: #be123c !important; }

.kov-action-review-btn {
  font-size: 12px !important;
  font-weight: 500 !important;
  color: #334155 !important;
  background: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
  border-radius: 6px !important;
  padding: 4px 10px !important;
  text-decoration: none !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  transition: all 0.15s ease !important;
}

.kov-action-review-btn:hover {
  background: #f1f5f9 !important;
  color: #0f172a !important;
  border-color: #94a3b8 !important;
}

.kov-action-icon-circle {
  width: 28px !important;
  height: 28px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 6px !important;
  border: 1px solid #e2e8f0 !important;
  color: #64748b !important;
  text-decoration: none !important;
  transition: all 0.15s ease !important;
}

.kov-action-icon-circle:hover {
  background: #f1f5f9 !important;
  color: #0f172a !important;
}

/* --- 7. Right Utility Panel --- */
.dd-right-panel {
  width: 300px !important;
  min-width: 300px !important;
  background: #ffffff !important;
  border-left: 1px solid #e2e8f0 !important;
  padding: 16px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 16px !important;
  overflow-y: auto !important;
}

.dd-profile-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding-bottom: 12px !important;
  border-bottom: 1px solid #e2e8f0 !important;
}

.dd-utility-actions {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
}

.dd-icon-btn {
  width: 32px !important;
  height: 32px !important;
  border-radius: 6px !important;
  border: 1px solid #e2e8f0 !important;
  background: #ffffff !important;
  color: #64748b !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
}

.dd-user-pill {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 4px 8px !important;
  border-radius: 6px !important;
  border: 1px solid #e2e8f0 !important;
  background: #ffffff !important;
  cursor: pointer !important;
}

.dd-user-avatar {
  width: 24px !important;
  height: 24px !important;
  border-radius: 999px !important;
  background: #166534 !important;
  color: #ffffff !important;
  font-size: 11px !important;
}

.dd-calendar-widget,
.dd-task-widget {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
  padding: 14px !important;
  box-shadow: none !important;
}

.dd-calendar-title,
.dd-section-title {
  font-size: 13.5px !important;
  font-weight: 600 !important;
  color: #0f172a !important;
  margin: 0 !important;
}

.dd-period-toggle {
  display: flex !important;
  background: #f1f5f9 !important;
  border-radius: 6px !important;
  padding: 2px !important;
  margin: 10px 0 !important;
}

.dd-period-btn {
  flex: 1 !important;
  padding: 3px 0 !important;
  font-size: 11.5px !important;
  font-weight: 500 !important;
  color: #64748b !important;
  border: none !important;
  background: transparent !important;
  border-radius: 4px !important;
  cursor: pointer !important;
}

.dd-period-btn.active {
  background: #ffffff !important;
  color: #0f172a !important;
  font-weight: 600 !important;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
}

.dd-month-nav {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  margin-bottom: 8px !important;
}

.dd-month-label {
  font-size: 12.5px !important;
  font-weight: 600 !important;
  color: #0f172a !important;
}

.dd-nav-arrow-btn {
  width: 24px !important;
  height: 24px !important;
  border-radius: 4px !important;
  border: 1px solid #e2e8f0 !important;
  background: #ffffff !important;
  color: #64748b !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  font-size: 10px !important;
}

.dd-calendar-grid {
  display: grid !important;
  grid-template-columns: repeat(7, 1fr) !important;
  gap: 2px !important;
  text-align: center !important;
}

.dd-cal-cell {
  height: 28px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 11.5px !important;
  color: #334155 !important;
  border-radius: 4px !important;
  cursor: pointer !important;
  position: relative !important;
}

.dd-cal-cell.today {
  background: #f0fdf4 !important;
  color: #166534 !important;
  font-weight: 700 !important;
}

.dd-cal-cell.selected {
  background: #166534 !important;
  color: #ffffff !important;
  font-weight: 700 !important;
}

/* --- 8. Candidate Application Forms (Clean Symmetrical Architecture) --- */
.card-modern-form {
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02) !important;
  margin-bottom: 20px !important;
}

.card-modern-form .card-header {
  background: transparent !important;
  border-bottom: 1px solid #f1f5f9 !important;
  padding: 14px 20px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  color: #0f172a !important;
}

.form-label {
  font-size: 12.5px !important;
  font-weight: 500 !important;
  color: #334155 !important;
  margin-bottom: 4px !important;
}

.form-control, .form-select {
  height: 38px !important;
  border-radius: 6px !important;
  border: 1px solid #cbd5e1 !important;
  padding: 6px 12px !important;
  font-size: 13.5px !important;
  color: #0f172a !important;
  background-color: #ffffff !important;
  transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
}

.form-control:focus, .form-select:focus {
  border-color: #166534 !important;
  box-shadow: 0 0 0 3px rgba(22, 101, 52, 0.12) !important;
}

.btn-submit-kov {
  height: 42px !important;
  background: #166534 !important;
  color: #ffffff !important;
  border: 1px solid #166534 !important;
  border-radius: 6px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  padding: 0 24px !important;
  transition: background-color 0.15s ease !important;
  box-shadow: none !important;
}

.btn-submit-kov:hover {
  background: #14532d !important;
  border-color: #14532d !important;
  color: #ffffff !important;
}

/* --- 9. Clean Dark Mode (Obsidian / Slate Palette) --- */
[data-theme="dark"] {
  --kov-canvas: #090d16 !important;
  --cb-canvas: #090d16 !important;
  --cb-surface-card: #111827 !important;
  --cb-border: #1f2937 !important;
  --cb-text-primary: #f8fafc !important;
  --cb-text-secondary: #cbd5e1 !important;
  --cb-text-muted: #94a3b8 !important;
  --bs-body-bg: #090d16 !important;
  --bs-body-color: #cbd5e1 !important;
}

[data-theme="dark"] body,
[data-theme="dark"] .dd-layout-root,
[data-theme="dark"] .dd-main-canvas {
  background-color: #090d16 !important;
  color: #cbd5e1 !important;
}

[data-theme="dark"] .dd-sidebar.kov-sidebar,
[data-theme="dark"] .dd-right-panel,
[data-theme="dark"] .dd-hero-banner,
[data-theme="dark"] .coinbase-kpi-card,
[data-theme="dark"] .kov-table-card,
[data-theme="dark"] .dd-calendar-widget,
[data-theme="dark"] .dd-task-widget,
[data-theme="dark"] .card-modern-form {
  background: #111827 !important;
  border-color: #1f2937 !important;
  color: #cbd5e1 !important;
}

[data-theme="dark"] h1, [data-theme="dark"] h2, [data-theme="dark"] h3,
[data-theme="dark"] .text-dark, [data-theme="dark"] .dd-hero-title,
[data-theme="dark"] .kov-table-title, [data-theme="dark"] .bento-metric-value,
[data-theme="dark"] .kov-candidate-name, [data-theme="dark"] .kov-brand-title {
  color: #f8fafc !important;
}

[data-theme="dark"] .dd-folders-grid,
[data-theme="dark"] .dd-period-toggle,
[data-theme="dark"] .kov-status-filter-bar,
[data-theme="dark"] .kov-botanical-table thead th {
  background: #1e293b !important;
  border-color: #1f2937 !important;
}

[data-theme="dark"] .dd-folder-card.active,
[data-theme="dark"] .dd-period-btn.active {
  background: #111827 !important;
  color: #34d399 !important;
  border-color: #1f2937 !important;
}

[data-theme="dark"] .form-control,
[data-theme="dark"] .form-select,
[data-theme="dark"] .dd-search-input {
  background: #0f172a !important;
  border-color: #334155 !important;
  color: #f8fafc !important;
}

[data-theme="dark"] .kov-botanical-table tbody td {
  border-bottom-color: #1f2937 !important;
  color: #cbd5e1 !important;
}

[data-theme="dark"] .kov-botanical-table tbody tr:hover {
  background: #1e293b !important;
}
`;

const updatedCss = css.slice(0, idx) + cleanOverride;
fs.writeFileSync(cssPath, updatedCss, 'utf8');
console.log('Successfully refined Anti-Slop CSS! Length:', updatedCss.length);
