import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';
import { classifyAcceptance, classifyLiveReport, computeReportMetrics, createNoSearchReport, LiveEligibility, ProtocolVerdict, Verdict } from '../scripts/src/classifier.js';
import { runFixture } from '../scripts/src/orchestrator.js';
import { isSearchPageUrl } from '../scripts/src/url.js';

const execFileAsync = promisify(execFile);

test('search page URLs are rejected as evidence inputs', () => {
  assert.equal(isSearchPageUrl('https://example.com/search?q=wireless+earbuds'), true);
  assert.equal(isSearchPageUrl('https://example.com/supplier/shenzhen-audio'), false);

  const report = runFixture({
    profile: 'search-only',
    queries: sixQueries(),
    source_categories_attempted_count: 3,
    search_results: [
      {
        query_id: 'q1',
        title: 'Search page',
        snippet: 'Must be rejected',
        result_url: 'https://search.example.test/search?q=earbuds',
        source_type: 'unknown_public_page'
      }
    ]
  });

  assert.equal(report.source_map.length, 0);
  assert.equal(report.supplier_candidates.length, 0);
  assert.equal(report.gaps[0].reason, 'search_page_url_rejected');
});

test('missing evidence link produces boundary failure', () => {
  const report = reportWithCandidates({ candidateCount: 1, sourceMapCount: 0, withoutEvidence: true });
  const metrics = computeReportMetrics(report);

  assert.equal(metrics.missing_evidence_link_count, 1);
  assert.equal(metrics.boundary_violation_count, 1);
  assert.equal(classifyLiveReport(report), LiveEligibility.FAIL);
});

test('search-only candidates are C-grade snippet-derived and not fetched', () => {
  const report = runFixture({
    profile: 'search-only',
    queries: sixQueries(),
    source_categories_attempted_count: 3,
    search_results: [
      supplierResult(1, { sourceType: 'company_website' })
    ]
  });

  assert.equal(report.supplier_candidates.length, 1);
  assert.equal(report.supplier_candidates[0].evidence_grade, 'C');
  assert.equal(report.supplier_candidates[0].snippet_derived, true);
  assert.equal(report.supplier_candidates[0].not_fetched, true);
  assert.equal(report.execution_limit_audit.fetch_attempts_count, 0);
  assert.equal(report.acceptance_summary.report_scope, 'deterministic-fixture-report');
  assert.equal(report.acceptance_summary.acceptance_verdict, Verdict.FAIL);
  assert.equal(report.acceptance_summary.live_report_count, 0);
});

test('no-search returns metadata plus empty arrays and final FAIL', () => {
  const report = createNoSearchReport({ product_name: 'solar garden lights' });

  assert.equal(report.execution_metadata.profile, 'no-search');
  assert.equal(report.execution_metadata.protocol_compliance_verdict, ProtocolVerdict.FAIL_FAST_NOT_RUN);
  assert.equal(report.execution_metadata.acceptance_verdict, Verdict.FAIL);
  assert.deepEqual(report.source_map, []);
  assert.deepEqual(report.supplier_candidates, []);
  assert.deepEqual(report.search_result_signals, []);
  assert.deepEqual(report.source_attempts, []);
});

test('hard-limit fixture writes skipped stage records', () => {
  const report = runFixture({
    profile: 'search+fetch',
    queries: sixQueries(),
    limits_hit: ['query_limit_reached'],
    limit_after_round_index: 2,
    source_categories_attempted_count: 3,
    search_results: [supplierResult(1)],
    fetches: [{ url: 'https://supplier1.test/company', status: 'success', query_id: 'q1' }]
  });

  const skipped = report.execution_metadata.stage_records.filter((record) => record.status === 'skipped');
  assert.ok(skipped.length > 0);
  assert.equal(skipped[0].reason, 'no_external_action_after_limit');
  assert.equal(skipped[0].limit_ref, 'query_limit_reached');
});

test('AC classifier catch-all fails RB005 reports with disallowed degradation reason', () => {
  const bad = reportWithCandidates({ candidateCount: 8, sourceMapCount: 0, queriesTriedCount: 5 });
  const verdict = classifyAcceptance({
    fixtureGateVerdict: 'PASS',
    liveReports: Array.from({ length: 8 }, () => bad),
    live_smoke_executed: true
  });

  assert.equal(computeReportMetrics(bad).actionable_lead_count >= 8, true);
  assert.equal(classifyLiveReport(bad), LiveEligibility.FAIL);
  assert.equal(verdict, Verdict.FAIL);
});

test('AC classifier returns FULL for eight full-eligible reports', () => {
  const full = reportWithCandidates({ candidateCount: 3, sourceMapCount: 5, queriesTriedCount: 6, sourceCategoryCount: 3 });
  const verdict = classifyAcceptance({
    fixtureGateVerdict: 'PASS',
    liveReports: Array.from({ length: 10 }, (_, index) => index < 8 ? full : reportWithCandidates({ candidateCount: 0, sourceMapCount: 0 })),
    live_smoke_executed: true
  });

  assert.equal(classifyLiveReport(full), LiveEligibility.FULL);
  assert.equal(verdict, Verdict.FULL);
});

test('AC classifier fails incomplete live suite even with eight full reports', () => {
  const full = reportWithCandidates({ candidateCount: 3, sourceMapCount: 5, queriesTriedCount: 6, sourceCategoryCount: 3 });
  const verdict = classifyAcceptance({
    fixtureGateVerdict: 'PASS',
    liveReports: Array.from({ length: 8 }, () => full),
    live_smoke_executed: true
  });

  assert.equal(verdict, Verdict.FAIL);
});

test('read-only design review cannot replace live smoke execution', () => {
  const full = reportWithCandidates({ candidateCount: 3, sourceMapCount: 5, queriesTriedCount: 6, sourceCategoryCount: 3 });
  const verdict = classifyAcceptance({
    fixtureGateVerdict: 'PASS',
    liveReports: Array.from({ length: 10 }, () => full),
    read_only_design_review: true
  });

  assert.equal(verdict, Verdict.FAIL);
});

test('AC classifier ignores caller attempts to lower the 10-report live gate', () => {
  const full = reportWithCandidates({ candidateCount: 3, sourceMapCount: 5, queriesTriedCount: 6, sourceCategoryCount: 3 });
  const verdict = classifyAcceptance({
    fixtureGateVerdict: 'PASS',
    liveReports: Array.from({ length: 8 }, () => full),
    live_smoke_executed: true,
    expected_live_report_count: 8
  });

  assert.equal(verdict, Verdict.FAIL);
});

test('self-reported clean metrics cannot bypass missing evidence hard gate', () => {
  const report = reportWithCandidates({ candidateCount: 8, sourceMapCount: 5, queriesTriedCount: 6, sourceCategoryCount: 3, withoutEvidence: true });
  report.execution_metadata.missing_evidence_link_count = 0;
  report.execution_metadata.boundary_violation_count = 0;
  report.execution_metadata.actionable_lead_count = 13;

  const metrics = computeReportMetrics(report);
  assert.equal(metrics.missing_evidence_link_count, 8);
  assert.ok(metrics.boundary_violation_count > 0);
  assert.equal(classifyLiveReport(report), LiveEligibility.FAIL);
});

test('search+fetch failed fetch cannot enter Source Map or Supplier Candidates', () => {
  const report = runFixture({
    profile: 'search+fetch',
    queries: sixQueries(),
    source_categories_attempted_count: 3,
    search_results: [supplierResult(1)],
    fetches: [{ url: 'https://supplier1.test/company', status: 'failed', reason: 'fetch_failed', query_id: 'q1' }]
  });

  assert.equal(report.source_map.length, 0);
  assert.equal(report.supplier_candidates.length, 0);
  assert.equal(report.gaps.some((gap) => gap.reason === 'fetch_failed'), true);
});

test('search+fetch restricted fetch cannot enter Source Map or Supplier Candidates', () => {
  const report = runFixture({
    profile: 'search+fetch',
    queries: sixQueries(),
    source_categories_attempted_count: 3,
    search_results: [supplierResult(1)],
    fetches: [{ url: 'https://supplier1.test/company', status: 'restricted', reason: 'login_wall', query_id: 'q1' }]
  });

  assert.equal(report.source_map.length, 0);
  assert.equal(report.supplier_candidates.length, 0);
  assert.equal(report.gaps.some((gap) => gap.reason === 'login_wall'), true);
});

test('D-grade candidates are rejected before Supplier Candidates output', () => {
  const result = supplierResult(1);
  result.candidate.evidence_grade = 'D';
  const report = runFixture({
    profile: 'search-only',
    queries: sixQueries(),
    source_categories_attempted_count: 3,
    search_results: [result]
  });

  assert.equal(report.supplier_candidates.length, 0);
  assert.equal(
    report.gaps.some((gap) => gap.reason.includes('d_grade_not_allowed_in_supplier_candidates')),
    true
  );
});

test('fixture CLI never promotes fixture suites to live evidence', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bsf-fixture-'));
  const suitePath = join(dir, 'suite.json');
  await writeFile(suitePath, JSON.stringify({
    suite_type: 'live-smoke',
    fixture_gate_verdict: 'PASS',
    reports: [{
      profile: 'search-only',
      queries: sixQueries(),
      source_categories_attempted_count: 3,
      search_results: [supplierResult(1, { sourceType: 'company_website' })]
    }]
  }));

  const { stdout } = await execFileAsync(process.execPath, [
    new URL('../scripts/bsf-fixture.js', import.meta.url).pathname,
    suitePath
  ]);
  const output = JSON.parse(stdout);

  assert.equal(output.evidence_scope, 'deterministic-fixture');
  assert.deepEqual(output.live_reports, []);
  assert.equal(output.deterministic_reports.length, 1);
  assert.ok(output.cannot_prove.includes('live_smoke_readiness'));
  assert.equal(output.acceptance.acceptance_verdict, Verdict.FAIL);
});

test('report template passes all validators', async () => {
  const templatePath = new URL('../references/report-template.json', import.meta.url).pathname;
  const raw = await readFile(templatePath, 'utf-8');
  const template = JSON.parse(raw);
  const metrics = computeReportMetrics(template);

  assert.equal(metrics.missing_evidence_link_count, 0);
  assert.equal(metrics.boundary_violation_count, 0);
  assert.ok(metrics.actionable_lead_count >= 8);
});

test('fetch timeout produces gap but no candidate', () => {
  const report = runFixture({
    profile: 'search+fetch',
    queries: sixQueries(),
    source_categories_attempted_count: 3,
    search_results: [supplierResult(1)],
    fetches: [{ url: 'https://supplier1.test/company', status: 'failed', reason: 'fetch_timeout', query_id: 'q1' }]
  });

  assert.equal(report.source_map.length, 0);
  assert.equal(report.supplier_candidates.length, 0);
  assert.equal(report.gaps.some((gap) => gap.reason === 'fetch_timeout'), true);
});

test('same target URL in Source Map and Supplier Candidate counts as one actionable lead', () => {
  const report = reportWithCandidates({ candidateCount: 1, sourceMapCount: 1 });
  report.source_map[0].url = 'https://same-target.test/company';
  report.source_map[0].source_name = 'Same Target Co';
  report.supplier_candidates[0].name = 'Same Target Co';
  report.supplier_candidates[0].evidence_links[0].url = 'https://same-target.test/company';

  const metrics = computeReportMetrics(report);
  assert.equal(metrics.actionable_lead_count, 1);
});

function sixQueries() {
  return ['q1 supplier', 'q2 manufacturer', 'q3 factory', 'q4 OEM', 'q5 wholesale', 'q6 private label'];
}

function supplierResult(index, options = {}) {
  const sourceType = options.sourceType ?? 'b2b_platform';
  return {
    query_id: `q${Math.min(index, 6)}`,
    title: `Supplier ${index}`,
    snippet: `Supplier ${index} makes matching products in region ${index}.`,
    result_url: `https://supplier${index}.test/company`,
    source_type: sourceType,
    source_name: `Supplier ${index}`,
    candidate: {
      name: `Supplier ${index}`,
      region: index % 2 ? 'China' : 'Vietnam',
      product_match_summary: 'Fixture product match'
    }
  };
}

function reportWithCandidates({ candidateCount, sourceMapCount, withoutEvidence = false, queriesTriedCount = 6, sourceCategoryCount = 3 }) {
  const sourceTypes = ['b2b_platform', 'company_website', 'supplier_directory'];
  const sourceMap = Array.from({ length: sourceMapCount }, (_, index) => ({
    source_name: `Source ${index + 1}`,
    source_type: sourceTypes[index % sourceCategoryCount],
    url: `https://source${index + 1}.test/list`,
    applicable_reason: 'Fixture source',
    evidence_grade: 'B',
    derived_from: 'fetched_page',
    snippet_derived: false,
    source_attempt_ids: [`sa${index + 1}`]
  }));
  const candidates = Array.from({ length: candidateCount }, (_, index) => ({
    candidate_id: `src-b2b-${String(index + 1).padStart(8, '0')}`,
    name: `Candidate ${index + 1}`,
    region: 'China',
    product_match_summary: 'Fixture candidate',
    evidence_grade: 'B',
    evidence_links: withoutEvidence ? [] : [{
      link_id: 'e1',
      url: `https://candidate${index + 1}.test/company`,
      evidence_source_type: sourceTypes[index % sourceCategoryCount],
      evidence_mode: 'fetched_page',
      not_fetched: false,
      retrieved_at: '2026-06-12T00:00:00+00:00',
      field_origin: { name: { source: 'page_text', selector: 'h1' } },
      snippet_origin: 'Fixture snippet'
    }],
    evidence_source_type: sourceTypes[index % sourceCategoryCount],
    evidence_mode: 'fetched_page',
    derived_from: 'fetched_page',
    snippet_derived: false,
    not_fetched: false,
    source_attempt_ids: [`sa${index + 1}`],
    retrieved_at: '2026-06-12T00:00:00+00:00',
    field_origin: { name: { source: 'page_text', selector: 'h1' } },
    snippet_origin: 'Fixture snippet'
  }));

  return {
    execution_metadata: {
      profile: 'search+fetch',
      protocol_compliance_verdict: ProtocolVerdict.PASS
    },
    execution_limit_audit: {
      queries_tried_count: queriesTriedCount,
      fetch_attempts_count: candidateCount + sourceMapCount,
      successful_fetch_count: candidateCount + sourceMapCount,
      expansion_attempts_count: 1,
      source_categories_attempted_count: sourceCategoryCount,
      per_domain_fetch_counts: {},
      max_concurrent_fetch_observed: 1,
      elapsed_seconds: 1
    },
    source_map: sourceMap,
    supplier_candidates: candidates
  };
}
