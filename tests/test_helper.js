/**
 * tests/test_helper.js
 * Test utilities and assertions for the test suite.
 */

const assert = require('node:assert');

function runTest(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      console.log(`  ✅ PASS: ${name}`);
      return true;
    })
    .catch((err) => {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      return false;
    });
}

module.exports = {
  assert,
  runTest
};
