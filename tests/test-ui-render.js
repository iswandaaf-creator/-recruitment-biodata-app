const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ejs = require('ejs');

console.log('=== Kuki QA Suite: Empirical Verification of Minimalist UI Updates ===\n');

const ROOT_DIR = path.resolve(__dirname, '..');

// 1. Verify CSS Overrides in kov-portal.css
console.log('[Test 1] Verifying kov-portal.css pastel overrides...');
const cssPath = path.join(ROOT_DIR, 'public', 'assets', 'css', 'kov-portal.css');
assert(fs.existsSync(cssPath), 'kov-portal.css must exist');
const cssContent = fs.readFileSync(cssPath, 'utf8');
assert(cssContent.includes('/* === KOV MINIMALIST PASTEL v4.0 OVERRIDES === */'), 'Marker must be present');
assert(cssContent.includes('--bg-linen: #f6f5f1 !important;'), 'Linen variable must be set');
assert(cssContent.includes('--bg-sidebar: #efeee8 !important;'), 'Sidebar background variable must be set');
console.log('✔ kov-portal.css overrides verified.');

// 2. Verify sidebar.ejs renders cleanly for various user roles
console.log('\n[Test 2] Rendering sidebar.ejs for different RBAC roles...');
const sidebarPath = path.join(ROOT_DIR, 'views', 'partials', 'sidebar.ejs');
assert(fs.existsSync(sidebarPath), 'sidebar.ejs must exist');
const sidebarSrc = fs.readFileSync(sidebarPath, 'utf8');

const testRoles = [
  { role: 'superadmin', nama: 'Super User' },
  { role: 'admin', nama: 'Admin User' },
  { role: 'hr', nama: 'HR Recruiter' },
  { role: 'user', reviewer_divisions: 'Barista, Kitchen', nama: 'Lead Reviewer' },
  { role: 'operasional', nama: 'Ops Manager' },
  { role: 'it', nama: 'IT Specialist' }
];

for (const user of testRoles) {
  const html = ejs.render(sidebarSrc, { user, active: 'hr' });
  assert(html.includes('appSidebar'), 'Must render aside id appSidebar');
  assert(html.includes(user.nama), `Must display user name: ${user.nama}`);
  assert(html.includes('Portal Internal'), 'Must display brand sub Portal Internal');
}
console.log('✔ sidebar.ejs renders cleanly across all 6 RBAC test roles.');

// 3. Verify admin.ejs contains + Form Biodata button and Salin Link Form
console.log('\n[Test 3] Verifying admin.ejs hero action buttons...');
const adminPath = path.join(ROOT_DIR, 'views', 'admin.ejs');
assert(fs.existsSync(adminPath), 'admin.ejs must exist');
const adminSrc = fs.readFileSync(adminPath, 'utf8');
assert(adminSrc.includes('+ Form Biodata'), 'admin.ejs must contain + Form Biodata');
assert(adminSrc.includes('Salin Link Form'), 'admin.ejs must contain Salin Link Form');
assert(adminSrc.includes('btnSalinLink'), 'admin.ejs must contain btnSalinLink id');
console.log('✔ admin.ejs action bar verified.');

// 4. Verify public forms color styling (#f6f5f1)
console.log('\n[Test 4] Verifying public HTML forms background color...');
for (const fn of ['index.html', 'pengajuan_barang.html', 'surat_tugas.html']) {
  const p = path.join(ROOT_DIR, 'public', fn);
  assert(fs.existsSync(p), `${fn} must exist`);
  const content = fs.readFileSync(p, 'utf8');
  assert(content.includes('background-color: #f6f5f1;'), `${fn} must contain #f6f5f1`);
  console.log(`✔ ${fn} background verified.`);
}

console.log('\n============================================================');
console.log('ALL KUKI EMPIRICAL QA CHECKS PASSED SUCCESSFULLY (100%)');
console.log('============================================================');
