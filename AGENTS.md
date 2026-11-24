# Clair's workbench

## Default website and application publication

Standing user instruction confirmed on 2026-11-19: all websites, interactive reports, dashboards and applications created or updated for Clair must be published through this existing workbench by default.

- Use https://clairku.github.io/clair-ai-studio/ as the canonical place to find and open every deliverable. Add each new website or application to the current catalog and the appropriate existing topic.
- Frequently used applications should also have a direct, visible home shortcut. Preserve existing categories, user customizations and access controls.
- Static deliverables should be hosted under this repository's published paths where suitable. Applications that need shared storage and account permissions may retain a suitable private backend; register the exact authenticated application URL in hostedApplications and open it as a top-level application from the workbench.
- Registering an application is not permission to expose its team records, weaken authentication, or replace shared cloud records with a browser-local demonstration. Keep publication, access verification and data persistence claims distinct.
- A standalone hosted URL or local file alone is not a complete handoff: provide the workbench entry and verify the deployed catalog. Routine publication and catalog registration are already authorized.

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


## Verified GitHub publication connection (2026-11-24)

- The owner approved installation of the official ChatGPT Codex Connector for the selected repository ClairKu/clair-ai-studio. Do not expand repository access without the owner's explicit approval.
- Prefer the connected GitHub write tools for workbench publication when the local executor cannot reach GitHub. The native GitHub CLI login and the connected app are separate authentication paths.
- Repository metadata such as permissions.push or permissions.admin describes the user's permissions, not the app installation's write access. On an integration-level 403, inspect the app installations and verify that this repository is included before changing credentials.
- Publish reviewed files against a fresh branch head using a base tree, commit, and non-forced reference update with an expected head. Preserve unrelated and concurrent work.
- Verify actual content writing, branch update, and deployed workbench/report URLs separately. An app installation or a successful read alone does not establish successful publication.
- Keep tokens and authorization codes out of code, reports, logs, and user replies. Never disable the existing report access gate to make verification pass.

## Confirmed recent-report catalog scope (2026-11-24)

- After reviewing the pending 23-report publication list, the owner explicitly confirmed publication of the catalog titles, short descriptions, text covers, and authenticated original-file links in this public repository, including preservation of existing catalog records.
- This approval concerns the recent-report entries collected under recent-reports-2026-11-24. Keep internal report bodies and financial, customer, authorization, and private-product details under their original account permissions.
- Public-source research can use repository-hosted report pages. Restricted originals open as top-level owner-authenticated destinations registered in hostedApplications.
- Do not request the same metadata-publication approval again for this confirmed batch. Preserve authentication and encryption; do not infer permission to publish internal report bodies.
