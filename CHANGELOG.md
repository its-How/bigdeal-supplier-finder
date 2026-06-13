# Changelog

## v0.1.6

- Uses a clean release line because remote `v0.1.5` tag already existed before
  this release-boundary hardening pass.
- Clarifies that the fixture runner does not validate live reports and that a
  separate live smoke suite is required for live acceptance statistics.
- Removes `verified` trust-language examples from the report template and
  replaces them with source-claimed or platform-listed wording.
- Adds npm publish-time guard (`prepublishOnly`) and a fuller local
  `release:check` script.
- Narrows npm keywords so package search metadata matches the skill-file
  distribution boundary.

## v0.1.5

- Clarifies stopping conditions in SKILL.md: round budget and hard limit are
  hard stops, while diminishing returns and coverage saturation cannot skip
  required ROUND_1-3 discovery.
- Clarifies Source Map vs Supplier Candidate boundary with concrete definitions
  and dedup rules in both SKILL.md and contract.md.
- Adds report template (`references/report-template.json`) with validation test
  covering all 11 required report sections.
- Specifies evidence link criteria precisely: valid URL, not search page, not
  paywall/login/captcha, points to claimed supplier info.
- Adds fetch failure handling guidance: record attempt, add gap, no candidate
  from failed fetch, hard limit handling.
- Adds collapsible container product coverage verification guidance.
- Reconciles ROUND_1–5 stages from contract.md into SKILL.md workflow
  (Pre-Flight → ROUND_1: Seed → ROUND_2: Source Discovery → ROUND_3: Candidate
  Extraction → ROUND_4: Expansion → ROUND_5: Curated Report).
- Clarifies live report validation: deterministic proves contract only; live
  needs separate suite with 10+ reports.
- Makes search tool capability assumptions explicit (web search + web fetch;
  no paid APIs, auth, CAPTCHA, JS rendering, or DB storage).
- Adds fetch-timeout fixture to deterministic edge cases.
- Adds deterministic package inventory guard to block missing skill files or
  accidental `bin`/`main`/`exports` package surface.

## v0.1.4

- Bumps package metadata to `0.1.4` for npm publication after login.
- Rewords npm publication boundaries so package contents do not claim
  unpublished status after registry publication. npm registry state must be
  proven by a registry receipt.
- Keeps the package as skill-file distribution plus local validation assets:
  no CLI, no JavaScript import API, no marketplace acceptance claim, no
  provider/browser/credential/live behavior, and no production readiness claim.

## v0.1.3

- Adds GitHub Actions CI for deterministic tests, syntax checks, fixture
  execution, and package dry-run.
- Adds GitHub issue templates for deterministic bugs and source-contract
  changes, with boundary checks against credentials, browser/session material,
  live supplier verification, paid provider access, and external writes.
- Adds README CI badge backed by the new workflow.
- Adds `RELEASE_CHECKLIST.md` and includes it in the package file list.
- Adds `SUPPORT.md` with maintained scope, version policy, issue policy, and
  explicit gates for npm publish, marketplace/registry submission, live search,
  provider/browser behavior, account integration, and procurement
  recommendation features.
- Bumps local package metadata to `0.1.3`. No npm publish has occurred.

## v0.1.2

- Local hardening version after the GitHub `v0.1.1` release already existed.
  This keeps the package metadata ahead of that released tag instead of
  rewriting `v0.1.1` contents after the fact.
- Clarifies that the npm package shape only distributes skill files and local
  validation assets. It provides no CLI, no `main` import API, and no `exports`
  API surface.
- Documents supported local channels: generic `SKILL.md` directory installs and
  Codex-style local copies. `agents/openai.yaml` remains advisory metadata only
  and does not prove OpenAI marketplace or runtime acceptance.
- Keeps publication and safety boundaries explicit: no npm publish has occurred,
  and local validation does not prove live supplier quality, provider readiness,
  browser/session readiness, credential safety, registry acceptance, or
  production readiness.

## v0.1.1

- GitHub release existed before this local hardening pass.
- This changelog entry records the observed release-line boundary only; it does
  not claim that the current npm package was published as `0.1.1`.
- Post-release local package/docs changes are tracked as `v0.1.2` to avoid
  drifting package metadata back onto an already-created GitHub release.

## v0.1.0

- Initial GitHub-first release of the standalone `bigdeal-supplier-finder` skill
  package.
- Includes the runtime-agnostic `SKILL.md` contract, deterministic fixture
  runner, tests, report contract reference, fixtures, and open-source audit
  notes.
- Scope is evidence-bound supplier discovery reporting only: no supplier trust
  verdict, purchase recommendation, credential/browser/provider/live behavior,
  paid API integration, or external write.
