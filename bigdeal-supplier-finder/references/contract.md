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

The ROUND_1–5 stages defined here correspond to SKILL.md Workflow sections:
ROUND_1 = Seed, ROUND_2 = Source Discovery, ROUND_3 = Candidate Extraction,
ROUND_4 = Expansion, ROUND_5 = Curated Report.

- Every Supplier Candidate must include at least one evidence link.
- Evidence grade labels evidence strength only; do not score trustworthiness or recommend purchase.

## Evidence Admissibility

Every Supplier Candidate must include at least one evidence link that:
(a) is a valid HTTP/HTTPS URL,
(b) is not a search engine results page or site-search page,
(c) is not a known paywall/login-wall/captcha page,
(d) points to a page that contains the supplier information claimed in the candidate fields.

Evidence links that fail these criteria must be removed; if no valid evidence link remains, the candidate must not enter Supplier Candidates.

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

Deduplicate actionable leads by canonical URL plus normalized supplier/source name. If the same target URL describes one specific supplier, classify it as a Supplier Candidate and do not duplicate it in Source Map.

A Source Map entry is a **discovery surface** — a URL-backed page that lists, indexes, or aggregates multiple potential suppliers (e.g., a B2B platform category page, a trade show exhibitor list, a government supplier directory). It is NOT a specific supplier. If the page describes a single supplier with contact/location/product details, it is a Supplier Candidate, not a Source Map entry.

A Supplier Candidate is a **specific supplier entity** with name, region, and product match. It must come from a Source Map entry or directly from a search result target URL. If the same URL serves as both a discovery surface AND describes a specific supplier, classify it as a Supplier Candidate and do NOT duplicate it in Source Map.

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
- `next_steps`
- `risk_notice`

## Minimum Fields

`SearchResultSignal`:

- `query_id`
- `engine_or_entry`
- `title`
- `snippet`
- optional `result_url`
- optional `rank`
- `retrieved_at`
- `is_search_page_url`
- `admissibility`

`SourceAttempt`:

- `attempt_id`
- `url_or_source`
- `source_type`
- `attempt_type`
- `status`
- `reason`
- optional `query_id`
- `retrieved_at`

`SourceMapEntry`:

- `source_name`
- `source_type`
- `url`
- `applicable_reason`
- `evidence_grade`
- `derived_from`
- `snippet_derived`
- `source_attempt_ids`
- optional `retrieved_at`

`SupplierCandidate`:

- `candidate_id`
- `name`
- `region`
- `product_match_summary`
- `evidence_grade`
- `evidence_links`
- `evidence_source_type`
- `evidence_mode`
- `derived_from`
- `snippet_derived`
- `not_fetched`
- `source_attempt_ids`
- `retrieved_at`
- `field_origin`
- `snippet_origin`

Every evidence link must include `link_id`, `url`, `evidence_source_type`,
`evidence_mode`, `not_fetched`, `retrieved_at`, `field_origin`, and
`snippet_origin`.

`QuerySuggestion`:

- `query_text`
- `language`
- `rationale`
- optional `source_type_or_engine`
- optional `derived_from_ref`

`Gap`:

- `missing_info` or `reason`
- optional `failed_source_type`
- optional `source_attempt_id`

## Evidence-Bound Low

For `search+fetch`, Evidence-Bound Low requires:

- at least 3 source categories attempted with failure reasons recorded;
- at least 10 fetches attempted and fewer than 3 successful fetches;
- at least 6 deduplicated queries;
- a completed five-round workflow or lawful hard-limit stop reason;
- complete Queries Tried, Gaps, access status, stop reason, and limits;
- no protocol violation.

For `search-only`, Evidence-Bound Low requires:

- at least 3 source categories attempted with failure reasons recorded;
- at least 6 deduplicated queries;
- non-search target URLs fewer than 5 or Supplier Candidates fewer than 3;
- all candidates C-grade, snippet-derived, and not fetched;
- complete Queries Tried, SearchResultSignal, SourceAttempt, Gaps, and stop reason;
- no protocol violation.

For `no-search`, do not mark Evidence-Bound Low. Use
`stop_reason=no_search_capability` and `acceptance_verdict=FAIL`.

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
- evidence scope violations.

Deterministic fixtures do not count as live reports.

## Result Breadth Metrics

For a strong live report:

- at least 6 deduplicated queries tried;
- at least 3 source categories attempted;
- at least 5 URL-backed Source Map entries;
- at least 3 Supplier Candidates;
- at least 8 deduplicated actionable leads.

These metrics are acceptance inputs, not supplier quality claims.
