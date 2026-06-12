import {
  createNoSearchReport,
  defaultRiskNotice,
  emptyLimitAudit,
  makeSkippedStage,
  ProtocolVerdict,
  computeReportMetrics,
  classifyLiveReport,
  reportPassesDegradedAllowedDeficit,
  reportPassesFull,
  reportPassesRb005
} from './classifier.js';
import { isSearchPageUrl } from './url.js';
import { validateSourceMapEntry, validateSupplierCandidate } from './schema.js';

export function runFixture(fixture) {
  if (fixture.profile === 'no-search') return createNoSearchReport(fixture.input);

  const startedAt = fixture.started_at ?? '2026-06-12T00:00:00+00:00';
  const finishedAt = fixture.finished_at ?? '2026-06-12T00:00:30+00:00';
  const searchResults = fixture.search_results ?? [];
  const fetches = fixture.fetches ?? [];
  const sourceMap = [];
  const candidates = [];
  const sourceAttempts = [];
  const signals = [];
  const gaps = [];
  const queriesTried = (fixture.queries ?? []).map((query, index) => ({
    query_id: `q${index + 1}`,
    query,
    language: fixture.language ?? 'English',
    source_type_or_engine: fixture.engine ?? 'fixture',
    result_count: searchResults.filter((result) => result.query_id === `q${index + 1}`).length,
    fetch_count: fetches.filter((fetch) => fetch.query_id === `q${index + 1}`).length,
    retrieved_at: startedAt
  }));

  for (const [index, result] of searchResults.entries()) {
    const signal = {
      query_id: result.query_id ?? 'q1',
      engine_or_entry: fixture.engine ?? 'fixture',
      title: result.title,
      snippet: result.snippet,
      result_url: result.result_url,
      rank: result.rank ?? index + 1,
      retrieved_at: startedAt,
      is_search_page_url: isSearchPageUrl(result.result_url),
      admissibility: result.result_url && !isSearchPageUrl(result.result_url) ? 'candidate_input' : 'query_fuel_only'
    };
    signals.push(signal);

    if (!signal.result_url || signal.is_search_page_url) {
      gaps.push({
        missing_info: 'admissible_target_url',
        failed_source_type: 'search_result',
        reason: 'search_page_url_rejected'
      });
      continue;
    }

    const attemptId = `sa${sourceAttempts.length + 1}`;
    const attemptStatus = fixture.profile === 'search+fetch' ? fetchStatusFor(signal.result_url, fetches) : 'skipped';
    const attemptReason = fixture.profile === 'search+fetch' ? fetchReasonFor(signal.result_url, fetches) : 'search_only_profile';
    const attempt = {
      attempt_id: attemptId,
      url_or_source: signal.result_url,
      source_type: result.source_type ?? 'unknown_public_page',
      attempt_type: fixture.profile === 'search+fetch' ? 'fetch' : 'search',
      status: attemptStatus,
      reason: attemptReason,
      query_id: signal.query_id,
      retrieved_at: startedAt
    };
    sourceAttempts.push(attempt);

    const evidenceAdmissible = fixture.profile === 'search-only' || attemptStatus === 'success';
    if (!evidenceAdmissible) {
      gaps.push({
        missing_info: 'admissible_public_evidence',
        failed_source_type: result.source_type ?? 'unknown_public_page',
        reason: attemptReason,
        source_attempt_id: attemptId
      });
      continue;
    }

    if (result.source_map !== false) {
      const entry = {
        source_name: result.source_name ?? domainName(signal.result_url),
        source_type: result.source_type ?? 'unknown_public_page',
        url: signal.result_url,
        applicable_reason: result.applicable_reason ?? 'fixture result target matched sourcing query',
        evidence_grade: result.source_evidence_grade ?? 'C',
        derived_from: fixture.profile === 'search+fetch' ? 'fetched_page' : 'search_result',
        snippet_derived: fixture.profile !== 'search+fetch',
        source_attempt_ids: [attemptId],
        retrieved_at: startedAt
      };
      const validation = validateSourceMapEntry(entry);
      if (validation.ok) {
        sourceMap.push(entry);
      } else {
        gaps.push({
          missing_info: 'valid_source_map_entry',
          failed_source_type: entry.source_type,
          reason: validation.errors.join(','),
          source_attempt_id: attemptId
        });
      }
    }

    if (result.candidate) {
      const candidate = result.candidate;
      const evidenceUrl = candidate.evidence_url ?? signal.result_url;
      const supplierCandidate = {
        candidate_id: candidate.candidate_id ?? `src-${sourceAbbrev(result.source_type)}-${String(index + 1).padStart(8, '0')}`,
        name: candidate.name,
        region: candidate.region,
        product_match_summary: candidate.product_match_summary,
        evidence_grade: candidate.evidence_grade ?? (fixture.profile === 'search+fetch' ? 'B' : 'C'),
        evidence_links: candidate.without_evidence ? [] : [{
          link_id: 'e1',
          url: evidenceUrl,
          evidence_source_type: result.source_type ?? 'unknown_public_page',
          evidence_mode: fixture.profile === 'search+fetch' ? 'fetched_page' : 'search_result_target',
          not_fetched: fixture.profile !== 'search+fetch',
          retrieved_at: startedAt,
          field_origin: {
            name: { source: fixture.profile === 'search+fetch' ? 'page_text' : 'search_result', selector: candidate.name },
            region: { source: fixture.profile === 'search+fetch' ? 'page_text' : 'search_result', selector: candidate.region }
          },
          snippet_origin: result.snippet
        }],
        missing_fields: [],
        evidence_source_type: result.source_type ?? 'unknown_public_page',
        evidence_mode: fixture.profile === 'search+fetch' ? 'fetched_page' : 'search_result_target',
        derived_from: fixture.profile === 'search+fetch' ? 'fetched_page' : 'search_result',
        snippet_derived: fixture.profile !== 'search+fetch',
        not_fetched: fixture.profile !== 'search+fetch',
        source_attempt_ids: [attemptId],
        retrieved_at: startedAt,
        field_origin: {
          name: { source: fixture.profile === 'search+fetch' ? 'page_text' : 'search_result', selector: candidate.name },
          region: { source: fixture.profile === 'search+fetch' ? 'page_text' : 'search_result', selector: candidate.region }
        },
        snippet_origin: result.snippet
      };
      const validation = validateSupplierCandidate(supplierCandidate);
      if (validation.ok) {
        candidates.push(supplierCandidate);
      } else {
        gaps.push({
          missing_info: 'valid_supplier_candidate',
          failed_source_type: supplierCandidate.evidence_source_type,
          reason: validation.errors.join(','),
          source_attempt_id: attemptId
        });
      }
    }
  }

  const limitAudit = buildLimitAudit(fixture, queriesTried, fetches);
  const stageRecords = buildStageRecords(fixture);
  const report = {
    execution_metadata: {
      profile: fixture.profile,
      runtime_capabilities: {
        search: true,
        fetch: fixture.profile === 'search+fetch',
        search_entries_count: fixture.search_entries_count ?? 1
      },
      started_at: startedAt,
      finished_at: finishedAt,
      elapsed_seconds: fixture.elapsed_seconds ?? 30,
      rounds_completed: stageRecords.map((record) => record.round),
      stage_records: stageRecords,
      stop_reason: fixture.stop_reason ?? 'completed_with_gaps',
      limits_hit: fixture.limits_hit ?? [],
      skipped_external_actions: fixture.skipped_external_actions ?? [],
      protocol_compliance_verdict: ProtocolVerdict.PASS
    },
    execution_limit_audit: limitAudit,
    acceptance_summary: {},
    input: fixture.input,
    source_map: sourceMap,
    supplier_candidates: candidates,
    search_result_signals: signals,
    source_attempts: sourceAttempts,
    queries_tried: queriesTried,
    query_suggestions: fixture.query_suggestions ?? [],
    gaps,
    next_steps: fixture.next_steps ?? [],
    risk_notice: defaultRiskNotice()
  };

  const metrics = computeReportMetrics(report);
  const protocolVerdict = metrics.missing_evidence_link_count > 0 || metrics.boundary_violation_count > 0
    ? ProtocolVerdict.FAIL
    : ProtocolVerdict.PASS;
  const liveReportEligibility = classifyLiveReport(report);
  report.execution_metadata.protocol_compliance_verdict = protocolVerdict;
  Object.assign(report.execution_metadata, {
    acceptance_verdict: 'FAIL',
    queries_tried_count: limitAudit.queries_tried_count,
    fetch_attempts_count: limitAudit.fetch_attempts_count,
    expansion_attempts_count: limitAudit.expansion_attempts_count,
    source_categories_attempted_count: limitAudit.source_categories_attempted_count,
    per_domain_fetch_counts: limitAudit.per_domain_fetch_counts,
    max_concurrent_fetch_observed: limitAudit.max_concurrent_fetch_observed,
    source_attempts_count: sourceAttempts.length,
    search_result_signals_count: signals.length,
    non_search_result_url_count: signals.filter((signal) => signal.result_url && !signal.is_search_page_url).length,
    url_backed_source_map_count: metrics.url_backed_source_map_count,
    supplier_candidate_count: metrics.supplier_candidate_count,
    actionable_lead_count: metrics.actionable_lead_count,
    source_category_count: metrics.source_category_count,
    missing_evidence_link_count: metrics.missing_evidence_link_count,
    boundary_violation_count: metrics.boundary_violation_count,
    live_report_eligibility: liveReportEligibility
  });
  report.acceptance_summary = {
    fixture_gate_verdict: 'PASS',
    report_scope: 'deterministic-fixture-report',
    live_report_count: 0,
    rb005_pass_count: reportPassesRb005(report) ? 1 : 0,
    evidence_bound_low_count: metrics.evidence_bound_low ? 1 : 0,
    full_eligible_count: reportPassesFull(report) ? 1 : 0,
    degraded_eligible_count: reportPassesDegradedAllowedDeficit(report) ? 1 : 0,
    low_eligible_count: liveReportEligibility === 'LOW_ELIGIBLE' ? 1 : 0,
    fail_count: liveReportEligibility === 'FAIL' ? 1 : 0,
    acceptance_verdict: 'FAIL',
    reasons: ['deterministic_fixture_not_live_smoke']
  };
  return report;
}

function buildLimitAudit(fixture, queriesTried, fetches) {
  const audit = { ...emptyLimitAudit() };
  audit.queries_tried_count = queriesTried.length;
  audit.fetch_attempts_count = fixture.profile === 'search+fetch' ? fetches.length : 0;
  audit.successful_fetch_count = fetches.filter((fetch) => fetch.status === 'success').length;
  audit.expansion_attempts_count = fixture.expansion_attempts_count ?? 0;
  audit.source_categories_attempted_count = fixture.source_categories_attempted_count ?? 0;
  audit.per_domain_fetch_counts = countFetchDomains(fetches);
  audit.max_concurrent_fetch_observed = fixture.max_concurrent_fetch_observed ?? Math.min(2, fetches.length);
  audit.elapsed_seconds = fixture.elapsed_seconds ?? 30;
  return audit;
}

function buildStageRecords(fixture) {
  const base = ['ROUND_1', 'ROUND_2', 'ROUND_3', 'ROUND_4', 'ROUND_5'];
  const limitRef = fixture.limits_hit?.[0];
  return base.map((round, index) => {
    if (limitRef && round !== 'ROUND_5' && index >= (fixture.limit_after_round_index ?? 3)) {
      return makeSkippedStage(round, limitRef);
    }
    return { round, stage: round, status: 'completed', reason: 'fixture_completed', external_action: round === 'ROUND_5' ? 'none' : 'fixture' };
  });
}

function fetchStatusFor(url, fetches) {
  return fetches.find((fetch) => fetch.url === url)?.status ?? 'skipped';
}

function fetchReasonFor(url, fetches) {
  return fetches.find((fetch) => fetch.url === url)?.reason ?? 'not_fetched';
}

function countFetchDomains(fetches) {
  const counts = {};
  for (const fetch of fetches) {
    try {
      const host = new URL(fetch.url).host;
      counts[host] = (counts[host] ?? 0) + 1;
    } catch {
      counts.unknown = (counts.unknown ?? 0) + 1;
    }
  }
  return counts;
}

function domainName(url) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function sourceAbbrev(sourceType = 'unknown_public_page') {
  return {
    b2b_platform: 'b2b',
    trade_show_directory: 'show',
    association_government: 'gov',
    company_website: 'web',
    supplier_directory: 'dir',
    media_community: 'med',
    unknown_public_page: 'unk'
  }[sourceType] ?? 'unk';
}
