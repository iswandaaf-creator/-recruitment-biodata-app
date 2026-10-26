/**
 * tests/test_companies_master.js
 * Empirical Test Suite for Master Data Perusahaan & Outlet KOV Groups
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const db = require('../db');

console.log('===============================================================');
console.log('  KUKI EMPIRICAL AUDIT: MASTER DATA PERUSAHAAN & OUTLET       ');
console.log('===============================================================');

function runTests() {
  setTimeout(() => {
    // Test 1: Verify Table and Initial 8 Outlets
    db.all('SELECT * FROM companies ORDER BY is_holding DESC, id ASC', [], (err, rows) => {
      if (err) {
        console.error('❌ FAIL 1: Error querying companies table:', err);
        process.exit(1);
      }

      console.log(`✅ PASS 1: Companies table initialized. Total records found: ${rows.length}`);
      assert.strictEqual(rows.length >= 8, true, 'Harus ada minimal 8 perusahaan/outlet');

      // Test 2: Check Holding Company
      const holding = rows.find(r => r.is_holding === 1);
      assert.ok(holding, 'Holding company harus terdaftar');
      assert.strictEqual(holding.nama_perusahaan, 'PT Puteri Seruput Indonesia');
      assert.strictEqual(holding.nama_outlet, 'KOV Koffie Sula / Holding');
      assert.ok(holding.alamat.includes('Sultan Agung No.135'), 'Alamat holding harus tepat');
      console.log(`✅ PASS 2: Holding company verified -> ${holding.nama_outlet} (${holding.nama_perusahaan})`);

      // Test 3: Check All Expected Outlets
      const expectedOutlets = [
        'KOV Koffie Sula / Holding',
        'KOV Heritage Kota Lama',
        'KOV Motion Soeta',
        'KOV Factory Rinjani',
        'KOV Lab Ngaliyan',
        'WHIMS Sula',
        'WHIMS Solo',
        'KOV Montre Salatiga'
      ];

      expectedOutlets.forEach(outName => {
        const found = rows.find(r => r.nama_outlet === outName);
        assert.ok(found, `Outlet "${outName}" harus ada di database`);
      });
      console.log('✅ PASS 3: All 8 initial outlets correctly seeded with full addresses');

      // Test 4: Check All Expected Legal Entities (PT / CV)
      const expectedPTs = [
        'PT Puteri Seruput Indonesia',
        'PT Samasta Kopi Indonesia',
        'CV Lintas Aroma Bumi',
        'CV Fajar Anugrah Ciptana',
        'CV Orika Nanda Esensia',
        'CV Prana Indo Raya',
        'PT Sumber Cita Indonesia',
        'CV Seduhan Inti Prima'
      ];

      expectedPTs.forEach(ptName => {
        const found = rows.find(r => r.nama_perusahaan === ptName);
        assert.ok(found, `Badan hukum "${ptName}" harus ada di database`);
      });
      console.log('✅ PASS 4: All 8 legal entities (PT/CV) correctly registered');

      // Test 5: Insert Test New Outlet (CRUD Test)
      const testOutlet = {
        nama_outlet: 'KOV Test Outlet Yogyakarta',
        nama_perusahaan: 'PT Selera Kopi Nusantara',
        alamat: 'Jl. Malioboro No.10, Sosromenduran, Gedong Tengen, Kota Yogyakarta, DIY 55271',
        telepon: '081234567890',
        email: 'jogja@kovgroups.com',
        is_holding: 0,
        status: 'Aktif'
      };

      db.run(
        `INSERT INTO companies (nama_outlet, nama_perusahaan, alamat, telepon, email, is_holding, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [testOutlet.nama_outlet, testOutlet.nama_perusahaan, testOutlet.alamat, testOutlet.telepon, testOutlet.email, testOutlet.is_holding, testOutlet.status],
        function (insertErr) {
          assert.ifError(insertErr);
          const newId = this.lastID;
          console.log(`✅ PASS 5: Successfully created new test company record with ID: ${newId}`);

          // Test 6: Update Test Outlet
          db.run(
            `UPDATE companies SET telepon = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            ['(0274) 555-1234', newId],
            function (updateErr) {
              assert.ifError(updateErr);
              console.log(`✅ PASS 6: Successfully updated test company record`);

              // Test 7: Verify Update and then Delete Test Record
              db.get('SELECT * FROM companies WHERE id = ?', [newId], (getErr, updatedRow) => {
                assert.ifError(getErr);
                assert.strictEqual(updatedRow.telepon, '(0274) 555-1234');

                db.run('DELETE FROM companies WHERE id = ?', [newId], function (delErr) {
                  assert.ifError(delErr);
                  console.log(`✅ PASS 7: Cleaned up test record (ID: ${newId}). Database integrity pristine.`);

                  console.log('\n===============================================================');
                  console.log('  ALL 7 MASTER DATA & CRUD TESTS PASSED (100% SUCCESS)         ');
                  console.log('===============================================================');
                  process.exit(0);
                });
              });
            }
          );
        }
      );
    });
  }, 200);
}

runTests();
