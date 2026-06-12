# BigDeal Supplier Finder Contract

This reference defines the report and acceptance contract used by the skill.

## Runtime Profiles

- `search+fetch`: public search and public target-page fetch are available.
- `search-only`: search result title/snippet/target URL are available; target pages are not fetched.
- `no-search`: no external search is available; return fail-fast metadata and empty evidence arrays.

## Protocol Requirements

- No login, captcha bypass, cookie/session handling, paid API, database storage, bulk scraping, or external write.
- Record five stages when running a full discovery workflow:
  - `ROUND_1`: Seed.
  - `ROUND_2`: Source Discovery.
  - `ROUND_3`: Candidate Extraction.
  - `ROUND_4`: Expansion.
  - `ROUND_5`: Curated Report.
- Every Supplier Candidate must include at least one evidence link.
- Evidence grade labels evidence strength only; do not score trustworthiness or recommend purchase.

## Evidence Admissibility

Count as actionable leads only:

- URL-backed `SourceMapEntry`;
- `SupplierCandidate` with minimum fields and at least one evidence link.

Do not count:

- `SearchResultSignal`;
- `SourceAttempt`;
- `QuerySuggestion`;
- search engine result pages or site-search pages;
- query-only snippets;
- AI answers without public URLs;
- failed, restricted, paywalled, captcha, or login-wall fetch attempts;
- D-grade raw signals.

Deduplicate actionable leads by canonical URL plus normalized supplier/source name. If the same target URL creates both a Source Map entry and Supplier Candidate, count one actionable lead.

## Required Report Sections

- `execution_metadata`
- `execution_limit_audit`
- `acceptance_summary`
- `source_map`
- `supplier_candidates`
- `search_result_signals`
- `source_attempts`
- `queries_tried`
- `query_suggestions`
- `gaps`
- `risk_notice`

## Acceptance Classifier

Final verdict is exactly one of:

- `FULL`
- `DEGRADED`
- `LOW`
- `FAIL`

Hard failures:

- protocol compliance failure;
- deterministic fixture gate not passing;
- live smoke suite not executed for live acceptance;
- fewer than 10 live reports for live acceptance;
- missing evidence links;
- evidence boundary violations.

Deterministic fixtures do not count as live reports.

## Result Breadth Metrics

For a strong live report:

- at least 6 deduplicated queries tried;
- at least 3 source categories attempted;
- at least 5 URL-backed Source Map entries;
- at least 3 Supplier Candidates;
- at least 8 deduplicated actionable leads.

These metrics are acceptance inputs, not supplier quality claims.
