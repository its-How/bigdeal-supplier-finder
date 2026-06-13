import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { classifyAcceptance, computeReportMetrics } from "../scripts/src/classifier.js";
import { isSearchPageUrl } from "../scripts/src/schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, "../fixtures/deterministic-edge-cases.json");
const fixtureDoc = JSON.parse(await readFile(fixturePath, "utf8"));
const fixtures = new Map(fixtureDoc.fixtures.map((fixture) => [fixture.id, fixture]));

const requiredFixtureIds = [
  "query-only-search-url-rejected",
  "missing-evidence-link-fail",
  "search-only-candidates-c-grade",
  "no-search-fail-fast-empty",
  "ac-classifier-catch-all-fail",
  "hard-limit-skipped-stage-records",
  "fetch-timeout-gap"
];

function fixture(id) {
  const value = fixtures.get(id);
  assert.ok(value, `missing fixture: ${id}`);
  return value;
}

function evidenceLinks(candidate) {
  return Array.isArray(candidate.evidence_links) ? candidate.evidence_links : [];
}

test("fixture pack contains every required deterministic edge case", () => {
  assert.equal(fixtureDoc.schema, "bsf-deterministic-fixtures-v0.1");
  for (const id of requiredFixtureIds) {
    assert.ok(fixtures.has(id), `fixture missing required case: ${id}`);
  }
});

test("fixture reported metrics match classifier-derived metrics", () => {
  const metricKeys = [
    "url_backed_source_map_count",
    "supplier_candidate_count",
    "actionable_lead_count",
    "missing_evidence_link_count",
    "boundary_violation_count",
    "source_category_count",
    "evidence_bound_low"
  ];

  for (const { id, report } of fixtureDoc.fixtures) {
    if (!report?.metrics) continue;
    const computed = computeReportMetrics(report);
    for (const key of metricKeys) {
      assert.equal(report.metrics[key], computed[key], `${id} ${key}`);
    }
  }
});

test("query-only and search page URLs do not enter Source Map or Supplier Candidates", () => {
  const { report } = fixture("query-only-search-url-rejected");

  assert.equal(report.source_map.length, 0);
  assert.equal(report.supplier_candidates.length, 0);
  assert.ok(report.search_result_signals.length > 0);

  for (const signal of report.search_result_signals) {
    assert.equal(signal.admissibility, "query_fuel_only");
    assert.equal(signal.is_search_page_url, true);
  }

  for (const source of report.source_map) {
    assert.equal(isSearchPageUrl(source.url), false, `Source Map contains search URL: ${source.url}`);
  }

  for (const candidate of report.supplier_candidates) {
    for (const link of evidenceLinks(candidate)) {
      assert.equal(isSearchPageUrl(link.url), false, `Candidate contains search URL: ${link.url}`);
    }
  }
});

test("missing evidence link is a protocol FAIL and final FAIL", () => {
  const { report } = fixture("missing-evidence-link-fail");
  const missingEvidenceCount = report.supplier_candidates.filter(
    (candidate) => evidenceLinks(candidate).length === 0
  ).length;
  const computedMetrics = {
    missing_evidence_link_count: report.supplier_candidates.filter(
      (candidate) => evidenceLinks(candidate).length === 0
    ).length,
    boundary_violation_count: report.supplier_candidates.filter(
      (candidate) => evidenceLinks(candidate).length === 0
    ).length
  };

  assert.equal(missingEvidenceCount, 1);
  assert.equal(report.metrics.missing_evidence_link_count, computedMetrics.missing_evidence_link_count);
  assert.equal(report.metrics.boundary_violation_count, computedMetrics.boundary_violation_count);
  assert.equal(report.metadata.protocol_compliance_verdict, "FAIL");
  assert.equal(report.metadata.acceptance_verdict, "FAIL");
});

test("search-only candidates are C-grade, snippet-derived, and not fetched", () => {
  const { report } = fixture("search-only-candidates-c-grade");

  assert.equal(report.metadata.runtime_profile, "search-only");
  assert.ok(report.supplier_candidates.length > 0);

  for (const candidate of report.supplier_candidates) {
    assert.equal(candidate.evidence_grade, "C");
    assert.equal(candidate.derived_from, "search_result");
    assert.equal(candidate.snippet_derived, true);
    assert.equal(candidate.not_fetched, true);
    assert.equal(candidate.evidence_mode, "search_result_target");
    assert.ok(evidenceLinks(candidate).length >= 1);

    for (const link of evidenceLinks(candidate)) {
      assert.equal(link.not_fetched, true);
      assert.equal(link.evidence_mode, "search_result_target");
      assert.equal(isSearchPageUrl(link.url), false, `Search-only evidence must be target URL: ${link.url}`);
    }
  }

  for (const source of report.source_map) {
    assert.equal(source.evidence_grade, "C");
    assert.equal(source.derived_from, "search_result");
    assert.equal(source.snippet_derived, true);
    assert.equal(isSearchPageUrl(source.url), false, `Source Map must be target URL: ${source.url}`);
  }
});

test("no-search returns metadata plus empty arrays and final FAIL", () => {
  const { report } = fixture("no-search-fail-fast-empty");

  assert.equal(report.metadata.runtime_profile, "no-search");
  assert.equal(report.metadata.stop_reason, "no_search_capability");
  assert.equal(report.metadata.protocol_compliance_verdict, "FAIL_FAST_NOT_RUN");
  assert.equal(report.metadata.acceptance_verdict, "FAIL");

  for (const key of [
    "queries_tried",
    "search_result_signals",
    "source_attempts",
    "source_map",
    "supplier_candidates",
    "query_suggestions"
  ]) {
    assert.deepEqual(report[key], [], `${key} must be empty for no-search`);
  }
  assert.ok(
    report.gaps.length === 0 ||
      report.gaps.some((gap) => gap.reason === "no_search_capability"),
    "no-search gaps must be empty or carry the explicit fail-fast reason"
  );
});

test("AC classifier catch-all returns FAIL when no verdict tier matches", () => {
  const { ac_input: input } = fixture("ac-classifier-catch-all-fail");
  assert.equal(classifyAcceptance(input), input.expected_verdict);
});

test("hard-limit stage records mark skipped external work after the limit", () => {
  const { report } = fixture("hard-limit-skipped-stage-records");
  const skippedStages = report.stage_records.filter((record) => record.status === "skipped");

  assert.equal(report.metadata.stop_reason, "fetch_limit_reached");
  assert.deepEqual(report.metadata.limits_hit, ["fetch_limit"]);
  assert.ok(report.metadata.skipped_external_actions.length > 0);
  assert.ok(skippedStages.length >= 2);

  for (const record of skippedStages) {
    assert.equal(record.reason, "no_external_action_after_limit");
    assert.equal(record.limit_ref, "fetch_limit");
    assert.equal(record.external_action, undefined);
  }

  const round5 = report.stage_records.find((record) => record.stage === "ROUND_5");
  assert.ok(round5, "ROUND_5 must still be recorded after a hard limit");
  assert.equal(round5.status, "completed");
  assert.equal(round5.external_action, "none");
});

test("fetch timeout produces gap but no candidate", () => {
  const { report } = fixture("fetch-timeout-gap");

  assert.equal(report.source_map.length, 0);
  assert.equal(report.supplier_candidates.length, 0);

  const gap = report.gaps.find((g) => g.reason === "fetch_timeout");
  assert.ok(gap, "gap with fetch_timeout reason must exist");
});
