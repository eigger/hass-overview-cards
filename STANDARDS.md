# Standards reference

## Review scope

- Date: 2026-10-31.
- Reference: `eigger/hass-repo-standards` commit `ef7762d769a1df8a405412fb4467f87df69aaee6`, the same reference used by [hass-compact-cards](https://github.com/eigger/hass-compact-cards). This is a reference review, not adoption of a published standards release or the integration profile.
- Profile: Home Assistant dashboard card; no `custom_components` domain or Python runtime.
- Authority: the user's request in this chat to configure this repository the same way as `hass-compact-cards`, excluding the card implementation.
- Target: `eigger/hass-overview-cards`, branch `main`. Repository owner, default branch and support features are the ones recorded in the adoption checklist.

## Selected changes

| Rules | Application |
| --- | --- |
| DOC-01/02/06 | Provide `README.md` (English) and `README.ko.md` (Korean) with reciprocal links, a bilingual guide under `docs/`, and documented development commands and verification limits. Integration-specific managed templates and install categories are not used. |
| CI-01/03/08/11 | Card-specific Node workflows: validate with read access and publish in a separate write-enabled job at the same tag commit. Persisted checkout credentials are disabled, jobs have timeouts and concurrency, and shell inputs stay in environment variables. |
| CI-05/06, DEP-01 principle | External actions are pinned to verified full commits with version comments; `npm ci` and the lockfile are retained. Happy DOM is development-only; no runtime dependency is introduced. |
| CI-09 principle | Dependabot proposes npm and action updates weekly. Patch/minor PRs can squash auto-merge after required CI passes; major updates stay manual; no version increment is automated. |
| REL-01/02/03 | SemVer, a stable tag/package version equality check, a changelog and manual release checks. Tag-triggered publishing attaches `compact-overview-card.js`. |
| GOV-01 principle | The reviewed SHA, applicability and evidence are recorded here; this file is not a central integration checker configuration. |

## Not applicable and deferred

- Python manifests, config entries, Core directory layout, HA pytest fixtures, Ruff, Hassfest, imagespec/blesession contracts, the Python dependency updater and integration ZIP releases do not apply to this frontend bundle. HACS installs `compact-overview-card.js` using the plugin manifest.
- The central `check_integration.py`, `sync_badges.py` and integration reusable workflows require a domain/manifest. They are not run or installed here. No artificial manifest, `.hass-standards.json`, central AGENTS file or integration test scaffold is added.
- Analytics Usage requires an integration domain and is not an installation metric for these cards. Release/CI/support/install-link badges that need a published release are deferred. No HA minimum or license is invented.
- The central adoption table and standards repository are outside this task and were not changed. This review does not claim full standards adoption.
- Revisit when a license is selected, the first release is published, or live HA compatibility is verified. Maintainer: repository owner.

## Verification

The concrete commands, versions, results and outstanding checks are recorded in [ADOPTION_CHECKLIST.md](ADOPTION_CHECKLIST.md).

## Repository setup

The repository is published as [eigger/hass-overview-cards](https://github.com/eigger/hass-overview-cards) with `main` as its default branch. Settings mirror `hass-compact-cards`: squash auto-merge, branch deletion, read-only default workflow permissions and a strict required status check for the card's `test` job. Pull requests require no additional approving review, linear history is required, force pushes and branch deletion are disabled, and administrators retain their existing bypass capability. The funding account is `eigger`.

Only the generic Dependabot auto-merge/cleanup workflow is reused from standards `v1.1.4`, pinned to its verified commit `a90531d05613597632a4c10c11ce1dbc45e0bab6`: it accepts same-repository Dependabot PRs against the default branch, allows only patch/minor auto-merge, and checks metadata without executing PR code. This is standalone CI reuse, not central enrollment or automatic standards adoption.
