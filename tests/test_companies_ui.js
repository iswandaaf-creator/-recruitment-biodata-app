/**
 * tests/test_companies_ui.js
 * Empirical HTML Rendering & Route Integration Test for Master Companies
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const db = require('../db');

console.log('===============================================================');
console.log('  KUKI EMPIRICAL AUDIT: COMPANIES UI & HTML RENDERING         ');
console.log('===============================================================');

async function testUI() {
  const templatePath = path.join(__dirname, '..', 'views', 'companies.ejs');
  assert.ok(fs.existsSync(templatePath), 'Template views/companies.ejs harus ada');

  // Fetch companies from SQLite
  const companies = await new Promise((resolve, reject) => {
    db.all('SELECT * FROM companies ORDER BY is_holding DESC, id ASC', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  assert.strictEqual(companies.length, 8, 'Harus ada 8 entitas');

  // Mock user session
  const mockUser = {
    id: 1,
    username: 'admin',
    nama: 'Super Administrator',
    role: 'superadmin'
  };

  // Compile & Render EJS View
  const renderedHtml = await ejs.renderFile(templatePath, {
    companies,
    user: mockUser,
    active: 'companies',
    success: null,
    error: null
  });

  console.log(`✅ PASS 1: views/companies.ejs compiles and renders cleanly (${renderedHtml.length} bytes)`);

  // Assert essential elements in HTML
  assert.ok(renderedHtml.includes('Master Index Perusahaan &amp; Outlet KOV Groups'), 'Hero title harus ada');
  assert.ok(renderedHtml.includes('PT Puteri Seruput Indonesia'), 'Holding PT harus muncul di HTML');
  assert.ok(renderedHtml.includes('KOV Koffie Sula / Holding'), 'Holding outlet harus muncul di HTML');
  assert.ok(renderedHtml.includes('PT Samasta Kopi Indonesia'), 'PT Samasta harus muncul di HTML');
  assert.ok(renderedHtml.includes('CV Lintas Aroma Bumi'), 'CV Lintas Aroma Bumi harus muncul');
  assert.ok(renderedHtml.includes('CV Fajar Anugrah Ciptana'), 'CV Fajar Anugrah Ciptana harus muncul');
  assert.ok(renderedHtml.includes('CV Orika Nanda Esensia'), 'CV Orika Nanda Esensia harus muncul');
  assert.ok(renderedHtml.includes('CV Prana Indo Raya'), 'CV Prana Indo Raya harus muncul');
  assert.ok(renderedHtml.includes('PT Sumber Cita Indonesia'), 'PT Sumber Cita Indonesia harus muncul');
  assert.ok(renderedHtml.includes('CV Seduhan Inti Prima'), 'CV Seduhan Inti Prima harus muncul');
  console.log('✅ PASS 2: All 8 company names & outlets present in rendered DOM');

  assert.ok(renderedHtml.includes('modalCreateCompany'), 'Modal Tambah Perusahaan harus ada');
  assert.ok(renderedHtml.includes('modalEditCompany'), 'Modal Edit Perusahaan harus ada');
  assert.ok(renderedHtml.includes('modalUploadLogo'), 'Modal Quick Upload Logo harus ada');
  assert.ok(renderedHtml.includes('enctype="multipart/form-data"'), 'Form upload logo multipart harus ada');
  console.log('✅ PASS 3: All 3 Modals (Create, Edit, Quick Upload Logo) verified');

  assert.ok(renderedHtml.includes('logo- menyusul') || renderedHtml.includes('Logo Menyusul'), 'Badge status logo menyusul harus ada');
  console.log('✅ PASS 4: Badge indikator logo menyusul terverifikasi');

  console.log('\n===============================================================');
  console.log('  ALL COMPANIES UI TESTS PASSED (100% VERIFIED)                ');
  console.log('===============================================================');
  process.exit(0);
}

testUI().catch(err => {
  console.error('❌ UI Test Failure:', err);
  process.exit(1);
});
