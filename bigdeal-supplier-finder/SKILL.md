---
name: bigdeal-supplier-finder
description: Use when an agent needs to create an evidence-bound supplier discovery report for a product or sourcing brief, especially for global buyers, cross-border ecommerce, private label, OEM/ODM, manufacturer discovery, B2B platform search, trade show directory search, supplier directory research, query expansion, source map generation, or structured sourcing reports. Produces source maps, supplier candidates, evidence links, gaps, and next-search suggestions. Does not log in, bypass captcha, use paid APIs, scrape at scale, store databases, score supplier trustworthiness, recommend purchases, or perform live/external actions without explicit separate authorization.
---

# BigDeal Supplier Finder

Use this skill to help an agent discover where to search for suppliers and produce a structured, evidence-bound sourcing report. The skill is breadth-first: expand source surfaces, preserve raw signals, separate evidence from query fuel, and make uncertainty explicit.

This is a runtime-agnostic agent skill. It is not a crawler, not a supplier database, not a procurement recommendation engine, and not a trust or due-diligence score.

## Hard Boundary

Do:

- generate diverse search/query plans across B2B platforms, trade shows, associations, government or industry directories, company websites, supplier directories, and public media/community sources;
- record `SearchResultSignal`, `SourceAttempt`, `SourceMapEntry`, `SupplierCandidate`, `QuerySuggestion`, and `Gap` separately;
- include at least one evidence link for every Supplier Candidate;
- grade evidence strength only as A/B/C/D;
- mark low-evidence and missing-evidence cases instead of hiding them;
- run the deterministic validator scripts when editing report contracts or examples.

Do not:

- log in, handle cookies, read sessions, solve captcha, bypass access controls, use paid APIs, or access credentialed sources;
- run recursive crawling, bulk scraping, database storage, contact enrichment, or background monitoring;
- label suppliers as trustworthy, safe, recommended, best, verified, compliant, or purchase-ready;
- count search pages, query-only snippets, AI answers without public URLs, failed fetches, restricted pages, paywalls, login walls, captcha pages, or D-grade raw signals as actionable leads;
- claim that deterministic fixture tests prove live supplier discovery quality.

## Inputs

Ask for or infer:

- product name and product category;
- sourcing intent, such as OEM, ODM, wholesale, private label, component sourcing, or market exploration;
- target markets and preferred supplier regions;
- known exclusions or risky sources;
- available runtime capability: `search+fetch`, `search-only`, or `no-search`;
- whether live web/provider/browser/credential actions are explicitly authorized.

If live or credentialed actions are not explicitly authorized, operate in planning or deterministic fixture mode only.

## Workflow

1. Classify runtime capability:
   - `search+fetch`: public search and public page fetch are available.
   - `search-only`: search results/snippets are available but target pages are not fetched.
   - `no-search`: no external search is available; return fail-fast metadata and query suggestions only.
2. Build at least six deduplicated query combinations when search is available.
3. Try at least three source categories when search is available.
4. Treat search result pages and query-only snippets as query fuel only.
5. Build Source Map entries only from URL-backed target pages or admissible target URLs.
6. Build Supplier Candidates only when minimum fields and at least one evidence link exist.
7. Deduplicate actionable leads by canonical URL plus normalized supplier/source name.
8. Produce the final report sections listed in `references/contract.md`.
9. Run deterministic validation when creating or modifying examples.

## Evidence Rules

- A: at least two independent public source types cross-confirm the same candidate.
- B: one high-structure public source such as a B2B platform, trade show, association, or government directory.
- C: low-strength but auditable public target URL evidence, such as search-only target URL snippets with minimum fields.
- D: AI summary, no public evidence URL, search page URL, query-only signal, or missing minimum fields. D-grade signals must not enter Supplier Candidates.

Search-only candidates may enter as C-grade only when they are snippet-derived, not fetched, use a non-search-page target URL, and include explicit provenance.

## Report Contract

Load `references/contract.md` when writing or reviewing report fields, acceptance gates, runtime profiles, or evidence admissibility.

Every report must include:

- Execution Metadata
- Execution Limit Audit
- Acceptance Summary
- Source Map
- Supplier Candidates
- Search Result Signals
- Source Attempts
- Queries Tried
- Query Suggestions
- Gaps
- Risk Notice

## Deterministic Scripts

Use these scripts from the repository root:

```bash
npm test
npm run check
npm run fixture
```

The fixture CLI lives at:

```bash
node bigdeal-supplier-finder/scripts/bsf-fixture.js bigdeal-supplier-finder/fixtures/sample-suite.json
```

Expected fixture CLI boundary:

- `evidence_scope` is `deterministic-fixture`;
- `live_reports` is empty;
- `cannot_prove` includes real search breadth, supplier discovery quality, and live smoke readiness.

## Acceptance Boundaries

Deterministic fixtures prove only local contract behavior. They do not prove live search breadth, supplier discovery quality, provider readiness, browser/session readiness, account state, credential safety, external site compatibility, or production readiness.

Before any live/provider phase:

- split deterministic and live inputs explicitly;
- keep live reports separate from fixture reports;
- require 10 live reports for live acceptance statistics;
- rerun review for browser/provider/credential/live boundaries.
