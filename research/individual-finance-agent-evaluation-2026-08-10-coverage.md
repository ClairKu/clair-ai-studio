# Coverage checklist · Individual finance agent evaluation

- [x] Public repository identity, default branch, commit history, activity, license
- [x] Fresh dependency installation and npm audit
- [x] Production build
- [x] Unit tests
- [x] Official Playwright E2E invocation
- [x] README and package-script reproducibility
- [x] CI trigger and quality gates
- [x] Chat planner and cross-scene routing
- [x] Profile intake parsing and malformed values
- [x] Goal / plan parsing
- [x] Portfolio text intake and normalization boundary
- [x] Fund lookup and direct QA for equity-index, money-market, and bond products
- [x] Independent verification for 019305
- [x] Reports page
- [x] Scheduled jobs page and API surface
- [x] Model, database, datasource, and memory settings
- [x] Desktop 1440×900 browser QA
- [x] Mobile 390×844 browser QA
- [x] Authentication, API mutation, RLS, secret storage, path traversal
- [x] Evidence-status and publication-boundary audit

## Evidence status

- Confirmed: observed in source, command output, deterministic function run, or browser.
- Inferred: root-cause or hiring interpretation derived from confirmed evidence.
- Missing: full model/database E2E credentials and a working Docker bootstrap are not present in the public checkout/environment.
- Target: remediation tasks proposed for interview or production hardening.
