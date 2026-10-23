## 2026-10-23 - Added ARIA Labels to IT Admin Buttons
**Learning:** Found multiple icon-only and close buttons in the IT Admin dashboard lacking proper screen reader context, particularly `btn-close` and buttons hiding text on small screens (`d-none d-sm-inline`).
**Action:** Always ensure `aria-label` attributes are present on buttons that rely primarily on icons for meaning, especially in responsive designs where text labels might be hidden.
