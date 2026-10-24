const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== Starting Test Suite: Nanda Lifecycle Hook & Auto-Approval ===');

const HOOK_SCRIPT = path.resolve('C:/Users/ACER/.gemini/config/nanda-hook.js');
const HOOKS_JSON = path.resolve('C:/Users/ACER/.gemini/config/hooks.json');

// 1. Verify files exist
console.log('\n[Test 1] Verifying required files exist...');
assert(fs.existsSync(HOOK_SCRIPT), `Hook script not found at ${HOOK_SCRIPT}`);
assert(fs.existsSync(HOOKS_JSON), `hooks.json not found at ${HOOKS_JSON}`);
console.log('✔ Files exist.');

// 2. Validate hooks.json structure
console.log('\n[Test 2] Validating hooks.json schema...');
const hooksRaw = fs.readFileSync(HOOKS_JSON, 'utf8');
const hooksData = JSON.parse(hooksRaw);
assert(hooksData['nanda-auto-approval'], 'Missing "nanda-auto-approval" key in hooks.json');
assert(hooksData['nanda-auto-approval'].enabled === true, 'Hook should be enabled');
assert(Array.isArray(hooksData['nanda-auto-approval'].PreToolUse), 'PreToolUse must be an array');
const preTool = hooksData['nanda-auto-approval'].PreToolUse[0];
assert(preTool.matcher, 'PreToolUse entry must have a matcher');
assert(Array.isArray(preTool.hooks) && preTool.hooks.length > 0, 'PreToolUse entry must have hooks array');
console.log('✔ hooks.json structure is valid according to Antigravity spec.');

// Helper to run hook with payload
function runHookWithPayload(payload, description) {
  process.stdout.write(`  Testing ${description}... `);
  const input = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const result = spawnSync('node', [HOOK_SCRIPT], {
    input,
    encoding: 'utf8',
    timeout: 5000
  });

  assert.strictEqual(result.status, 0, `Process failed with exit code ${result.status}: ${result.stderr}`);
  const out = result.stdout.trim();
  let parsed;
  try {
    parsed = JSON.parse(out);
  } catch (err) {
    assert.fail(`Stdout is not valid JSON: ${out}`);
  }

  assert.strictEqual(parsed.decision, 'allow', `Expected decision "allow", got "${parsed.decision}"`);
  assert.strictEqual(parsed.reason, 'Auto-approved by Project Manager Nanda', `Reason mismatch: "${parsed.reason}"`);
  console.log('PASS');
}

// 3. Test various PreToolUse payloads
console.log('\n[Test 3] Testing hook responses across PreToolUse tool events...');

runHookWithPayload({
  toolCall: { name: 'run_command', args: { CommandLine: 'npm test' } },
  stepIdx: 1,
  conversationId: 'conv-test-1'
}, 'run_command tool call');

runHookWithPayload({
  toolCall: { name: 'write_file', args: { TargetFile: 'test.txt', Content: 'hello' } },
  stepIdx: 2,
  conversationId: 'conv-test-2'
}, 'write_file tool call');

runHookWithPayload({
  toolCall: { name: 'replace_file_content', args: { TargetFile: 'test.txt' } },
  stepIdx: 3,
  conversationId: 'conv-test-3'
}, 'replace_file_content tool call');

runHookWithPayload({
  toolCall: { name: 'edit_file', args: { TargetFile: 'server.js' } },
  stepIdx: 4,
  conversationId: 'conv-test-4'
}, 'edit_file tool call');

runHookWithPayload({
  toolCall: { name: 'custom_admin_action', args: {} },
  stepIdx: 5,
  conversationId: 'conv-test-5'
}, 'custom/arbitrary tool call');

runHookWithPayload({}, 'empty payload object');

runHookWithPayload('MALFORMED_NON_JSON_STRING', 'malformed non-JSON payload');

// 4. Test direct execution without stdin (TTY fallback)
console.log('\n[Test 4] Testing direct execution without stdin...');
const directResult = spawnSync('node', [HOOK_SCRIPT], {
  encoding: 'utf8',
  timeout: 5000
});
assert.strictEqual(directResult.status, 0, `Direct run failed: ${directResult.stderr}`);
const directParsed = JSON.parse(directResult.stdout.trim());
assert.strictEqual(directParsed.decision, 'allow');
assert.strictEqual(directParsed.reason, 'Auto-approved by Project Manager Nanda');
console.log('✔ Direct execution passed.');

// 5. Verify audit log creation
console.log('\n[Test 5] Verifying audit log creation...');
const logPath = path.resolve('C:/Users/ACER/.gemini/config/logs/nanda-hook.log');
assert(fs.existsSync(logPath), `Audit log not found at ${logPath}`);
const logContent = fs.readFileSync(logPath, 'utf8');
assert(logContent.includes('Auto-approved by Project Manager Nanda'), 'Audit log missing expected entries');
console.log('✔ Audit log successfully populated.');

console.log('\n======================================================');
console.log('✔ All Nanda lifecycle hook test assertions passed cleanly!');
console.log('======================================================\n');
