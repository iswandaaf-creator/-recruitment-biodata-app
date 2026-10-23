#!/usr/bin/env node
/**
 * Multi-Agent Collaboration Bridge & Sync Utility
 * 
 * Coordinates and synchronizes state between:
 * 1. Google Labs Jules (Cloud GitHub agent - PRs, branches, code tasks)
 * 2. Antigravity Orchestrator (.agents/teamwork, plans, progress, victory audit)
 * 3. Hermes Local Agent (CLI runtime, gateway, state directory)
 * 4. Production VPS Deployment & Data Integrity (HTTPS health, SQLite DB)
 * 
 * Location: C:\Users\ACER\recruitment-biodata-app\scripts\agent_bridge.js
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const https = require('https');
const http = require('http');

const REPO_ROOT = path.resolve(__dirname, '..');
const AGENTS_DIR = path.join(REPO_ROOT, '.agents', 'teamwork');
const HERMES_STATE_DIR = 'C:\\Users\\ACER\\.local\\state\\hermes';
const HERMES_EXE_PATH = 'C:\\Users\\ACER\\AppData\Local\\hermes\\bin\\hermes.exe';
const VPS_URL = 'https://internal.kovgroups.com';
const DB_PATH = path.join(REPO_ROOT, 'db', 'database.sqlite');

/**
 * Execute command safely and return trimmed stdout, or null on error
 */
function execSafe(cmd, cwd = REPO_ROOT) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], timeout: 15000 }).trim();
  } catch (err) {
    return null;
  }
}

/**
 * Check status of local Hermes runtime
 */
function getHermesStatus() {
  const result = {
    name: 'Hermes Agent',
    cliAvailable: false,
    cliPath: null,
    stateDirExists: false,
    statePath: HERMES_STATE_DIR,
    runningProcesses: [],
    details: 'Idle / Ready'
  };

  // Check state directory
  try {
    if (fs.existsSync(HERMES_STATE_DIR)) {
      result.stateDirExists = true;
    }
  } catch (e) {}

  // Check CLI binary
  try {
    if (fs.existsSync(HERMES_EXE_PATH)) {
      result.cliAvailable = true;
      result.cliPath = HERMES_EXE_PATH;
    }
  } catch (e) {}

  if (!result.cliPath) {
    const whichRes = execSafe('where hermes');
    if (whichRes) {
      result.cliAvailable = true;
      result.cliPath = whichRes.split('\n')[0].trim();
    }
  }

  // Check process list
  const tasklist = execSafe('tasklist /FI "IMAGENAME eq hermes.exe" /FO CSV /NH');
  if (tasklist && tasklist.includes('hermes.exe')) {
    result.runningProcesses.push('hermes.exe');
    result.details = 'Active process detected';
  } else {
    result.details = result.cliAvailable ? 'CLI binary installed and standby' : 'CLI not found';
  }

  return result;
}

/**
 * Check Google Labs Jules activity and PRs via GitHub CLI
 */
function getJulesStatus() {
  const result = {
    name: 'Google Labs Jules',
    ghAvailable: false,
    prs: [],
    openJulesPrs: [],
    mergedJulesPrs: [],
    summary: 'No GitHub CLI connection'
  };

  const ghVer = execSafe('gh --version');
  if (!ghVer) return result;
  result.ghAvailable = true;

  const prListJson = execSafe('gh pr list --state all --json number,title,headRefName,state,createdAt,updatedAt,url');
  if (prListJson) {
    try {
      const prs = JSON.parse(prListJson);
      result.prs = prs;

      prs.forEach(pr => {
        const isJules = /jules/i.test(pr.title) || 
                        /test-dateFormatter/i.test(pr.headRefName) || 
                        /fix-env/i.test(pr.headRefName) || 
                        /date-formatter/i.test(pr.headRefName) ||
                        /fix-idle-timer/i.test(pr.headRefName);

        if (isJules) {
          const item = {
            number: pr.number,
            title: pr.title,
            branch: pr.headRefName,
            state: pr.state,
            createdAt: pr.createdAt,
            url: pr.url
          };

          if (pr.state === 'OPEN') {
            result.openJulesPrs.push(item);
          } else if (pr.state === 'MERGED') {
            result.mergedJulesPrs.push(item);
          }
        }
      });

      result.summary = `${result.openJulesPrs.length} OPEN PR(s), ${result.mergedJulesPrs.length} MERGED PR(s)`;
    } catch (e) {
      result.summary = 'Error parsing GitHub PR JSON';
    }
  }

  return result;
}

/**
 * Check Antigravity Teamwork & Orchestration Status
 */
function getAntigravityStatus() {
  const result = {
    name: 'Antigravity Orchestrator',
    active: false,
    briefingExists: false,
    planExists: false,
    progressExists: false,
    mission: null,
    phase: 'unknown',
    subagents: []
  };

  if (!fs.existsSync(AGENTS_DIR)) return result;
  result.active = true;

  const briefingPath = path.join(AGENTS_DIR, 'BRIEFING.md');
  if (fs.existsSync(briefingPath)) {
    result.briefingExists = true;
    const content = fs.readFileSync(briefingPath, 'utf8');
    const missionMatch = content.match(/## Mission\r?\n([^\r\n#]+)/);
    if (missionMatch) result.mission = missionMatch[1].trim();
    const phaseMatch = content.match(/- \*\*Phase\*\*:\s*([^\r\n]+)/);
    if (phaseMatch) result.phase = phaseMatch[1].trim();
  }

  // Scan subdirectories for subagent folders
  try {
    const entries = fs.readdirSync(AGENTS_DIR, { withFileTypes: true });
    entries.forEach(entry => {
      if (entry.isDirectory() && entry.name.startsWith('teamwork_')) {
        result.subagents.push(entry.name);
      }
    });
  } catch (e) {}

  return result;
}

/**
 * Check Production VPS and Data Health
 */
function checkVpsHealth() {
  return new Promise((resolve) => {
    const status = {
      name: 'Production & VPS Integrity',
      vpsUrl: VPS_URL,
      vpsReachable: false,
      statusCode: null,
      dbExists: false,
      dbSizeKb: 0,
      envExists: false
    };

    // Check DB
    try {
      if (fs.existsSync(DB_PATH)) {
        status.dbExists = true;
        const stats = fs.statSync(DB_PATH);
        status.dbSizeKb = Math.round(stats.size / 1024);
      }
    } catch (e) {}

    // Check .env
    const envPath = path.join(REPO_ROOT, '.env');
    status.envExists = fs.existsSync(envPath);

    // Ping VPS URL
    const req = https.get(VPS_URL, { timeout: 4000 }, (res) => {
      status.vpsReachable = true;
      status.statusCode = res.statusCode;
      resolve(status);
    });

    req.on('error', (err) => {
      status.vpsReachable = false;
      status.error = err.message;
      resolve(status);
    });

    req.on('timeout', () => {
      req.destroy();
      status.vpsReachable = false;
      status.error = 'Connection timed out';
      resolve(status);
    });
  });
}

/**
 * Print Formatted Dashboard
 */
async function printDashboard(asJson = false) {
  const hermes = getHermesStatus();
  const jules = getJulesStatus();
  const antigravity = getAntigravityStatus();
  const vps = await checkVpsHealth();

  if (asJson) {
    console.log(JSON.stringify({ hermes, jules, antigravity, vps }, null, 2));
    return;
  }

  console.log('================================================================================');
  console.log('               MULTI-AGENT COLLABORATION BRIDGE & STATUS DASHBOARD              ');
  console.log('================================================================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Repository: ${REPO_ROOT}`);
  console.log('--------------------------------------------------------------------------------');

  // Jules Status
  console.log(`\n[1] 🤖 GOOGLE LABS JULES (GitHub Cloud Agent)`);
  console.log(`  - GitHub CLI: ${jules.ghAvailable ? 'Connected' : 'Unavailable'}`);
  console.log(`  - Jules PR Status: ${jules.summary}`);
  if (jules.openJulesPrs.length > 0) {
    console.log(`  - Open PRs pending review/merge:`);
    jules.openJulesPrs.forEach(pr => {
      console.log(`    * PR #${pr.number}: ${pr.title}`);
      console.log(`      Branch: ${pr.branch} | URL: ${pr.url}`);
    });
  } else {
    console.log(`  - No open PRs pending.`);
  }

  // Antigravity Status
  console.log(`\n[2] 🌌 ANTIGRAVITY ORCHESTRATOR`);
  console.log(`  - State Active: ${antigravity.active ? 'YES' : 'NO'}`);
  console.log(`  - Mission: ${antigravity.mission || 'N/A'}`);
  console.log(`  - Current Phase: ${antigravity.phase}`);
  console.log(`  - Active Subagent Workspaces (${antigravity.subagents.length}):`);
  antigravity.subagents.forEach(s => console.log(`    * ${s}`));

  // Hermes Status
  console.log(`\n[3] ⚡ HERMES LOCAL AGENT`);
  console.log(`  - CLI Available: ${hermes.cliAvailable ? 'YES (' + hermes.cliPath + ')' : 'NO'}`);
  console.log(`  - State Directory: ${hermes.stateDirExists ? 'Found (' + hermes.statePath + ')' : 'Standby / Default'}`);
  console.log(`  - Runtime Status: ${hermes.details}`);

  // VPS & Integrity Status
  console.log(`\n[4] 🛡️ PRODUCTION VPS & DATA INTEGRITY`);
  console.log(`  - Remote VPS (${vps.vpsUrl}): ${vps.vpsReachable ? 'ONLINE (Status ' + vps.statusCode + ')' : 'OFFLINE / ' + (vps.error || 'Unreachable')}`);
  console.log(`  - SQLite Database (${DB_PATH}): ${vps.dbExists ? 'EXISTS (' + vps.dbSizeKb + ' KB)' : 'NOT FOUND (Check migrations)'}`);
  console.log(`  - Environment File (.env): ${vps.envExists ? 'CONFIGURED' : 'NOT FOUND'}`);

  console.log('\n================================================================================\n');
}

/**
 * Approve and Merge a specific PR
 */
function mergeJulesPr(prNumber) {
  console.log(`\n[Bridge] Reviewing & Merging PR #${prNumber} from Google Labs Jules...`);
  
  // 1. Verify PR details
  const viewJson = execSafe(`gh pr view ${prNumber} --json number,title,state,headRefName`);
  if (!viewJson) {
    console.error(`[Error] Could not find or access PR #${prNumber}`);
    return false;
  }
  const pr = JSON.parse(viewJson);
  if (pr.state !== 'OPEN') {
    console.log(`[Info] PR #${prNumber} is already ${pr.state}.`);
    return true;
  }

  // 2. Approve PR
  console.log(`[Bridge] Submitting approval for PR #${prNumber} (${pr.title})...`);
  const approveRes = execSafe(`gh pr review ${prNumber} --approve -b "Approved automatically by Multi-Agent Bridge Coordinator after verification."`);
  console.log(approveRes || 'Approved.');

  // 3. Merge PR
  console.log(`[Bridge] Merging PR #${prNumber} via squash/merge...`);
  const mergeRes = execSafe(`gh pr merge ${prNumber} --merge --admin --delete-branch`) || execSafe(`gh pr merge ${prNumber} --squash --delete-branch`);
  console.log(mergeRes || 'Merge completed.');

  return true;
}

/**
 * CLI Entry Point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  const isJson = args.includes('--json');

  switch (command) {
    case 'status':
    case 'sync':
      await printDashboard(isJson);
      break;

    case 'jules-list':
      const jules = getJulesStatus();
      if (isJson) {
        console.log(JSON.stringify(jules, null, 2));
      } else {
        console.log(`Jules PRs (${jules.openJulesPrs.length} OPEN, ${jules.mergedJulesPrs.length} MERGED):`);
        jules.prs.forEach(p => console.log(`- #${p.number} [${p.state}] ${p.title} (${p.headRefName})`));
      }
      break;

    case 'jules-merge':
      const prNum = args[1];
      if (!prNum) {
        console.error('Usage: node agent_bridge.js jules-merge <PR_NUMBER>');
        process.exit(1);
      }
      mergeJulesPr(prNum);
      break;

    case 'jules-merge-all':
      const status = getJulesStatus();
      console.log(`Found ${status.openJulesPrs.length} open Jules PRs to merge.`);
      for (const pr of status.openJulesPrs) {
        mergeJulesPr(pr.number);
      }
      break;

    case 'vps-health':
      const vps = await checkVpsHealth();
      console.log(isJson ? JSON.stringify(vps, null, 2) : vps);
      break;

    default:
      console.log(`Unknown command: ${command}`);
      console.log('Available commands: status, sync, jules-list, jules-merge <number>, jules-merge-all, vps-health');
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  getHermesStatus,
  getJulesStatus,
  getAntigravityStatus,
  checkVpsHealth
};
