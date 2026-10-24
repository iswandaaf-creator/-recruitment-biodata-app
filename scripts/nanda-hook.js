#!/usr/bin/env node

/**
 * Nanda Lifecycle Hook Handler for Antigravity
 * 
 * Auto-approves PreToolUse events on behalf of Project Manager Nanda.
 * Intercepts events for: run_command, write_file, replace_file_content, edit_file, and other tools.
 * 
 * Output Contract:
 * {"decision": "allow", "reason": "Auto-approved by Project Manager Nanda"}
 */

const fs = require('fs');
const path = require('path');

const APPROVAL_RESPONSE = {
  decision: "allow",
  reason: "Auto-approved by Project Manager Nanda"
};

function emitResponseAndExit(exitCode = 0) {
  process.stdout.write(JSON.stringify(APPROVAL_RESPONSE) + '\n');
  process.exit(exitCode);
}

function auditLog(payload) {
  try {
    const baseDir = __dirname;
    const logDir = path.join(baseDir, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logFile = path.join(logDir, 'nanda-hook.log');
    const logEntry = {
      timestamp: new Date().toISOString(),
      tool: payload && payload.toolCall && payload.toolCall.name ? payload.toolCall.name : 'all_tools',
      stepIdx: payload && payload.stepIdx !== undefined ? payload.stepIdx : null,
      conversationId: payload && payload.conversationId ? payload.conversationId : null,
      decision: APPROVAL_RESPONSE.decision,
      reason: APPROVAL_RESPONSE.reason
    };
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  } catch (err) {
    // Logging errors must never disrupt hook execution
  }
}

function main() {
  // If run in an interactive terminal (no redirected stdin stream)
  if (process.stdin.isTTY) {
    emitResponseAndExit(0);
    return;
  }

  let inputData = '';
  let handled = false;

  // Defensive timeout: if stdin remains open without data/EOF for > 2000ms
  const fallbackTimer = setTimeout(() => {
    if (!handled) {
      handled = true;
      emitResponseAndExit(0);
    }
  }, 2000);

  process.stdin.setEncoding('utf8');

  process.stdin.on('data', (chunk) => {
    inputData += chunk;
  });

  process.stdin.on('end', () => {
    if (handled) return;
    handled = true;
    clearTimeout(fallbackTimer);

    let payload = null;
    if (inputData && inputData.trim().length > 0) {
      try {
        payload = JSON.parse(inputData.trim());
      } catch (e) {
        // Continue even if unparseable
      }
    }

    if (payload) {
      auditLog(payload);
    }

    emitResponseAndExit(0);
  });

  process.stdin.on('error', () => {
    if (!handled) {
      handled = true;
      clearTimeout(fallbackTimer);
      emitResponseAndExit(0);
    }
  });
}

main();