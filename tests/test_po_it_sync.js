const assert = require('assert');
const path = require('path');
const fs = require('fs');
const db = require('../db');

console.log('--- STARTING EMPIRICAL TEST: PO TO REKAP IT INTEGRATION ---');

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function runEmpiricalTest() {
  try {
    // 1. Verify schema
    const poTable = await getQuery("SELECT name FROM sqlite_master WHERE type='table' AND name='purchase_orders'");
    assert(poTable, 'Table purchase_orders must exist in SQLite database');
    console.log('[PASS] Table purchase_orders verified.');

    const itTable = await getQuery("SELECT name FROM sqlite_master WHERE type='table' AND name='it_expenses'");
    assert(itTable, 'Table it_expenses must exist in SQLite database');
    console.log('[PASS] Table it_expenses verified.');

    // 2. Prepare test PO
    const testPoNo = 'PO/TEST/' + Date.now();
    const testItems = [
      {
        nama_kode: 'Laptop ASUS ExpertBook B1400',
        spesifikasi: 'Intel Core i5-1135G7, 8GB RAM, 512GB SSD NVMe',
        qty: 2,
        satuan: 'Unit',
        harga_satuan: 8500000,
        total_harga: 17000000
      },
      {
        nama_kode: 'Instalasi Access Point WiFi Ruijie Reyee',
        spesifikasi: 'Setting SSID VLAN Mesh Outlet Pekalongan',
        qty: 1,
        satuan: 'Titik',
        harga_satuan: 750000,
        total_harga: 750000
      },
      {
        nama_kode: 'Kertas Thermal & Ribbon Printer Kasir',
        spesifikasi: 'Ukuran 80mm roll',
        qty: 5,
        satuan: 'Roll',
        harga_satuan: 35000,
        total_harga: 175000
      }
    ];

    const totalBiaya = 17000000 + 750000 + 175000; // 17,925,000

    // Insert into purchase_orders using real column names
    const insertPoRes = await runQuery(`
      INSERT INTO purchase_orders (
        no_po, tanggal_po, status_po, vendor_nama, subtotal, total_netto,
        lokasi_kirim, unit_kerja, perihal, items_json, catatan_syarat
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      testPoNo,
      '2026-10-26',
      'Review / Pending Finance',
      'PT AGRES INFO TEKNOLOGI',
      totalBiaya,
      totalBiaya,
      'Jl. Hayam Wuruk No. 12 Pekalongan (Outlet Kopi)',
      'IT Support & Procurement',
      'Pengadaan Laptop & Perangkat Jaringan Outlet Pekalongan',
      JSON.stringify(testItems),
      'Syarat garansi 1 tahun resmi.'
    ]);

    const poId = insertPoRes.lastID;
    console.log(`[PASS] Test PO inserted with ID: ${poId}, No: ${testPoNo}`);

    // Read server.js and extract the helpers
    const serverPath = path.join(__dirname, '../server.js');
    const serverCode = fs.readFileSync(serverPath, 'utf8');
    
    const vm = require('vm');
    const sandbox = {
      db,
      console,
      require,
      module: {},
      exports: {}
    };
    vm.createContext(sandbox);

    const helperCode = `
      ${serverCode.match(/function mapITCategory[\s\S]*?^}/m)[0]}
      ${serverCode.match(/function detectOutlet[\s\S]*?^}/m)[0]}
      ${serverCode.match(/function syncPOToITExpenses[\s\S]*?^\}/m)[0]}
      module.exports = { mapITCategory, detectOutlet, syncPOToITExpenses };
    `;
    vm.runInContext(helperCode, sandbox);
    const { mapITCategory, detectOutlet, syncPOToITExpenses } = sandbox.module.exports;

    // Test mapITCategory assertions
    assert.strictEqual(mapITCategory('Printer Thermal Epson', ''), 'Hardware & Komputer');
    assert.strictEqual(mapITCategory('Jasa Servis Laptop Kantor', ''), 'Perawatan & Service');
    assert.strictEqual(mapITCategory('Kabel LAN Cat6 50m', ''), 'Jaringan & Network');
    assert.strictEqual(mapITCategory('Lisensi Microsoft 365 Business', ''), 'Software & Lisensi');
    assert.strictEqual(mapITCategory('Kertas HVS A4 80gr', ''), 'Operasional & Lainnya');
    console.log('[PASS] mapITCategory regex classifications verified across all 5 categories.');

    // Test detectOutlet assertions
    assert.strictEqual(detectOutlet('Outlet Pekalongan Jl. Sriwijaya', '', ''), 'Outlet Pekalongan');
    assert.strictEqual(detectOutlet('', 'Unit Rinjani', ''), 'Outlet Rinjani');
    assert.strictEqual(detectOutlet('', '', 'Pengadaan Router Solo'), 'Outlet Solo');
    assert.strictEqual(detectOutlet('', '', 'Pengadaan Umum Kantor'), 'Kantor Pusat Semarang');
    console.log('[PASS] detectOutlet multi-field heuristics verified.');

    // Fetch the inserted PO
    const fetchedPo = await getQuery("SELECT * FROM purchase_orders WHERE id = ?", [poId]);

    // Perform syncPOToITExpenses
    await new Promise((resolve, reject) => {
      syncPOToITExpenses(fetchedPo, poId, (err, expenseId) => {
        if (err) reject(err);
        else resolve(expenseId);
      });
    });

    // Check it_expenses
    const expense = await getQuery("SELECT * FROM it_expenses WHERE no_transaksi = ?", [testPoNo]);
    assert(expense, 'it_expenses must contain synced record with matching no_transaksi');
    assert.strictEqual(expense.unit_outlet, 'Outlet Pekalongan', 'unit_outlet must match detected Outlet Pekalongan');
    assert.strictEqual(expense.vendor_toko, 'PT AGRES INFO TEKNOLOGI');
    assert.strictEqual(Number(expense.total_biaya), totalBiaya);
    assert.strictEqual(expense.bukti_transaksi, `/admin/operasional/po/detail/${poId}`);
    assert.strictEqual(expense.status_bayar, 'Pending'); // 'Review / Pending Finance' -> Pending

    const parsedItems = JSON.parse(expense.items_json);
    assert.strictEqual(parsedItems.length, 3, 'Must have 3 synced items');
    assert.strictEqual(parsedItems[0].kategori, 'Hardware & Komputer');
    assert.strictEqual(parsedItems[1].kategori, 'Jaringan & Network');
    assert.strictEqual(parsedItems[2].kategori, 'Operasional & Lainnya');
    console.log('[PASS] syncPOToITExpenses insertion verified with correct categories, total, and proof link.');

    // Test Status Sync
    fetchedPo.status_po = 'Reguler / Approved';
    await new Promise((resolve, reject) => {
      syncPOToITExpenses(fetchedPo, poId, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const updatedExpense = await getQuery("SELECT * FROM it_expenses WHERE no_transaksi = ?", [testPoNo]);
    assert.strictEqual(updatedExpense.status_bayar, 'Lunas', 'Approved must map to Lunas in it_expenses');
    console.log('[PASS] Status sync (Approved -> Lunas) verified.');

    // Test Deletion Cleanup
    await runQuery("DELETE FROM purchase_orders WHERE id = ?", [poId]);
    await runQuery("DELETE FROM it_expenses WHERE no_transaksi = ?", [testPoNo]);

    const deletedExpense = await getQuery("SELECT * FROM it_expenses WHERE no_transaksi = ?", [testPoNo]);
    assert(!deletedExpense, 'it_expenses entry must be cleanly removed');
    console.log('[PASS] Deletion and cleanup verified.');

    console.log('\n======================================================');
    console.log(' ALL EMPIRICAL INTEGRATION CHECKS PASSED (100% GREEN) ');
    console.log('======================================================\n');
    process.exit(0);

  } catch (err) {
    console.error('TEST FAILED:', err);
    process.exit(1);
  }
}

runEmpiricalTest();
