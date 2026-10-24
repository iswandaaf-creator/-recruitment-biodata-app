# Project Guidelines & 5-Agent Skills Matrix (recruitment-biodata-app)

This project (KOV Recruitment and Management Portal) is maintained and evolved using the 5-agent engineering team powered by Antigravity, curated skills from `https://github.com/rmyndharis/antigravity-skills`, and the codebase intelligence engine `https://github.com/Egonex-AI/Understand-Anything`.

---

## 5-Agent Roster & Assigned Responsibilities

| Agent | Subagent Identifier | Focus Area | Core Skills Installed (Vault + Understand-Anything) |
| :--- | :--- | :--- | :--- |
| **Nanda** | `nanda-orchestrator` | Project Manager & Auto-Approval Coordinator | `understand`, `understand-onboard`, `understand-knowledge`, `antigravity-skills-manager`, `conductor-*`, `team-collaboration-*` |
| **Opus** | `opus-architect` | Senior Software Architect & Code Reviewer | `understand-explain`, `understand-diff`, `architecture-analyzer`, `backend-architect`, `c4-architecture-*`, `architect-review`, `api-design-*` |
| **Hermes** | `hermes-developer` | Local Developer & Core Implementer | `understand-chat`, `understand-domain`, `file-analyzer`, `backend-development-*`, `nodejs-backend-patterns`, `javascript-pro`, `debugging-*` |
| **Cila** | `cila-designer` | UI/UX Designer & Accessibility Auditor | `understand-figma`, `understand-dashboard`, `design-analyzer`, `ui-ux-designer`, `accessibility-audit`, `wcag-audit-*`, `tailwind-*`, `figma-ui` |
| **Kuki** | `kuki-tester` | QA Lead, Empirical Challenger & Security Auditor | `understand-diff` (blast radius), `graph-reviewer`, `test-automator`, `e2e-testing-*`, `tdd-workflows-*`, `security-auditor`, `sast-*` |

---

## Workspace Rules for Agents

- **Pre-Analysis Knowledge Graph**: Run `understand` when exploring unfamiliar or extensive architectural modifications.
- **Diff Blast Radius**: Before submitting or merging PRs, execute `understand-diff` to verify affected subsystems and ripple effects.
- **Syntax Verification**: Always run `node --check server.js` and `node --check db.js` after making modifications.
- **Database Safety**: Never drop tables or modify `db/database.sqlite` directly without triggering `scripts/backup-db.js`.
- **View Tag Integrity**: Always maintain 0 difference between opening and closing tags in EJS templates.
- **Security Guardrails**: Always enforce CSRF tokens on POST/PUT/DELETE forms, sanitize errors, and avoid leaking internal SQLite exceptions to client responses.
