#!/usr/bin/env node
/**
 * scripts/sync-agent.js
 * Multi-Agent Synchronization Bridge for Google Labs Jules & GitHub branches.
 * Inspects branches, runs automated syntax checks, enforces sensitive file protection,
 * and executes or simulates safe merges.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.join(__dirname, '..');

const SENSITIVE_PATTERNS = [
  /^\.env(\..+)?$/,
  /^db\/.*\.sqlite(-wal|-shm)?$/,
  /^public\/uploads\/.+/
];

function runGit(cmd) {
  try {
    return execSync(`git ${cmd}`, { cwd: projectRoot, encoding: 'utf-8' }).trim();
  } catch (err) {
    if (err.stdout) return err.stdout.trim();
    throw err;
  }
}

function listBranches() {
  console.log('=== MULTI-AGENT JULES BRANCH SCANNER ===');
  runGit('fetch origin');
  const rawBranches = runGit('branch -r');
  const branches = rawBranches.split('\n')
    .map(b => b.trim())
    .filter(b => b.startsWith('origin/') && !b.includes('HEAD') && !b.includes('origin/main'))
    .map(b => b.replace('origin/', ''));

  console.log(`Found ${branches.length} active remote agent branch(es):\n`);
  branches.forEach((b, i) => {
    const commitMsg = runGit(`log -n 1 --format="%s (%an)" origin/${b}`);
    console.log(`  [${i + 1}] ${b}`);
    console.log(`      Latest: ${commitMsg}`);
  });
  return branches;
}

function inspectBranch(branch) {
  console.log(`=== INSPECTING AGENT BRANCH: ${branch} ===`);
  const fullRef = branch.startsWith('origin/') ? branch : `origin/${branch}`;

  // Log commits between main and branch
  const commits = runGit(`log origin/main..${fullRef} --oneline`);
  console.log('\nCommits introduced:');
  console.log(commits || '  (No unique commits)');

  // Files modified
  const files = runGit(`diff --name-status origin/main...${fullRef}`);
  console.log('\nModified files:');
  console.log(files || '  (No modified files)');

  // Risk Assessment
  let hasSensitiveTouch = false;
  let hasCoreLogicTouch = false;
  const fileLines = files ? files.split('\n') : [];

  for (const line of fileLines) {
    const [, filePath] = line.split(/\s+/);
    if (!filePath) continue;
    if (SENSITIVE_PATTERNS.some(p => p.test(filePath))) {
      hasSensitiveTouch = true;
    }
    if (filePath.endsWith('.js') || filePath.endsWith('.json')) {
      hasCoreLogicTouch = true;
    }
  }

  console.log('\nRisk Assessment:');
  if (hasSensitiveTouch) {
    console.log('  ⚠️  CRITICAL RISK: Touches sensitive paths (.env, database.sqlite, uploads)');
  } else if (hasCoreLogicTouch) {
    console.log('  🟡 MEDIUM RISK: Modifies application JavaScript or configuration');
  } else {
    console.log('  🟢 LOW RISK: Modifies non-critical assets (CSS/Docs/Templates)');
  }
}

function checkBranch(branch) {
  console.log(`=== RUNNING INTEGRITY CHECKS ON: ${branch} ===`);
  const fullRef = branch.startsWith('origin/') ? branch : `origin/${branch}`;

  const files = runGit(`diff --name-only origin/main...${fullRef}`).split('\n').filter(Boolean);

  // Check 1: Sensitive file check
  const sensitiveFiles = files.filter(f => SENSITIVE_PATTERNS.some(p => p.test(f)));
  if (sensitiveFiles.length > 0) {
    console.error('❌ Check Failed: Branch attempts to alter protected sensitive files:');
    sensitiveFiles.forEach(f => console.error(`    - ${f}`));
    return false;
  }
  console.log('✅ Check 1: Sensitive files protection check passed.');

  // Check 2: Syntax validation for modified .js files
  const jsFiles = files.filter(f => f.endsWith('.js'));
  for (const f of jsFiles) {
    try {
      const fileContent = runGit(`show ${fullRef}:${f}`);
      const tempPath = path.join(projectRoot, '.git', `temp_check_${path.basename(f)}`);
      fs.writeFileSync(tempPath, fileContent, 'utf-8');
      execSync(`node -c "${tempPath}"`);
      fs.unlinkSync(tempPath);
      console.log(`✅ Syntax Check Passed: ${f}`);
    } catch (err) {
      console.error(`❌ Syntax Check Failed for ${f}:`, err.message);
      return false;
    }
  }

  console.log('\n🎉 ALL AGENT INTEGRITY CHECKS PASSED!');
  return true;
}

function mergeBranch(branch, dryRun = false) {
  const fullRef = branch.startsWith('origin/') ? branch : `origin/${branch}`;
  console.log(`=== ${dryRun ? 'DRY-RUN' : 'EXECUTING'} MERGE: ${fullRef} -> main ===`);

  if (!checkBranch(branch)) {
    console.error('❌ Merge aborted: Pre-merge integrity checks failed.');
    process.exit(1);
  }

  if (dryRun) {
    try {
      runGit(`merge --no-commit --no-ff ${fullRef}`);
      runGit('merge --abort');
      console.log('✅ Dry-run merge succeeded without conflicts!');
    } catch (err) {
      console.error('❌ Dry-run merge failed with conflicts:', err.message);
      try { runGit('merge --abort'); } catch (_) {}
      process.exit(1);
    }
    return;
  }

  try {
    runGit(`merge ${fullRef} --no-edit -m "Merge agent branch ${branch} via sync-agent"`);
    console.log(`✅ Successfully merged ${branch} into main!`);
  } catch (err) {
    console.error('❌ Merge failed with conflicts:', err.message);
    process.exit(1);
  }
}

// CLI Command Parser
const [,, command, targetBranch, ...flags] = process.argv;

switch (command) {
  case 'list':
    listBranches();
    break;
  case 'inspect':
    if (!targetBranch) { console.error('Please specify branch name'); process.exit(1); }
    inspectBranch(targetBranch);
    break;
  case 'check':
    if (!targetBranch) { console.error('Please specify branch name'); process.exit(1); }
    if (!checkBranch(targetBranch)) process.exit(1);
    break;
  case 'merge':
    if (!targetBranch) { console.error('Please specify branch name'); process.exit(1); }
    const isDryRun = flags.includes('--dry-run');
    mergeBranch(targetBranch, isDryRun);
    break;
  default:
    console.log(`
Usage:
  node scripts/sync-agent.js list
  node scripts/sync-agent.js inspect <branch>
  node scripts/sync-agent.js check <branch>
  node scripts/sync-agent.js merge <branch> [--dry-run]
`);
}
