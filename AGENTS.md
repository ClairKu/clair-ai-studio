# Clair's workbench

## Default report publication

Standing user instruction confirmed on 2026-11-19: all completed reports and report updates should continue to be published to this existing workbench by default.

- Production: https://clairku.github.io/clair-ai-studio/
- Repository: ClairKu/clair-ai-studio; branch: main; published directory: docs.
- Routine report publication is already authorized. Do not ask again whether to publish.
- A completed report includes a working deployed report URL and its workbench catalog entry. A local file, Library link, commit, or submitted deployment alone does not establish successful publication.
- Preserve the existing audience and access gate. Never weaken encryption, passwords, or access controls to make a report accessible.

## Publication checks

- Read the current branch and affected files before changing them; preserve concurrent updates and all existing reports.
- Follow the current catalog conventions: report pages in public/reports and docs/reports, source catalog in src/app.js, protection registry in catalog/report-registry.json, explicit topic and work type mappings, and previews where required.
- Keep source and deployed catalog entries consistent. Preserve saved workspace customizations and avoid unrelated catalog migrations.
- Distinguish data snapshot, review, and publication dates. Unknown evidence stays unknown; an analytical risk screen is not a confirmed rule violation.
- Validate affected behavior and assets, publish without forcing the branch, and verify the deployment and report URLs before reporting success.

## Access recovery

- Check network reachability separately from authentication. A CLI authentication probe that cannot reach GitHub does not establish that the saved login has expired.
- A read-only connected GitHub application does not establish that the user's existing GitHub CLI login lacks write access. Use an available, authorized publishing channel and its normal access checks.
- Never print or commit authentication tokens, credentials, or authorization headers.
- If access truly requires user sign-in, preserve the finished report and prepared changes, identify the exact blocked action, and state that publication remains pending.
