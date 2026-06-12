"use strict";

import {
  countActionableLeads,
  countBoundaryViolations,
  countMissingEvidenceLinks,
  createHardLimitStageRecord,
  createNoSearchReport as createSchemaNoSearchReport,
} from "./schema.js";

export const Verdict = Object.freeze({
  FULL: "FULL",
  DEGRADED: "DEGRADED",
  LOW: "LOW",
  FAIL: "FAIL",
});

export const ProtocolVerdict = Object.freeze({
  PASS: "PASS",
  FAIL: "FAIL",
  FAIL_FAST_NOT_RUN: "FAIL_FAST_NOT_RUN",
});

export const LiveEligibility = Object.freeze({
  FULL: "FULL_ELIGIBLE",
  DEGRADED: "DEGRADED_ELIGIBLE",
  LOW: "LOW_ELIGIBLE",
  FAIL: "FAIL",
});

export const ACCEPTANCE_VERDICTS = Object.freeze(Object.values(Verdict));
export const PROTOCOL_VERDICTS = Object.freeze(Object.values(ProtocolVerdict));
export const REQUIRED_LIVE_REPORT_COUNT = 10;

function numberValue(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function boolValue(value) {
  return value === true;
}

function listValue(value) {
  return Array.isArray(value) ? value : [];
}

function readMetric(report, key, fallback = 0) {
  if (!report || typeof report !== "object") return fallback;
  if (report[key] !== undefined) return numberValue(report[key], fallback);
  if (report.execution_metadata?.[key] !== undefined) {
    return numberValue(report.execution_metadata[key], fallback);
  }
  if (report.execution_limit_audit?.[key] !== undefined) {
    return numberValue(report.execution_limit_audit[key], fallback);
  }
  if (report.acceptance_summary?.[key] !== undefined) {
    return numberValue(report.acceptance_summary[key], fallback);
  }
  if (report.metrics?.[key] !== undefined) {
    return numberValue(report.metrics[key], fallback);
  }
  return fallback;
}

function readBoolean(report, key, fallback = false) {
  if (!report || typeof report !== "object") return fallback;
  if (report[key] !== undefined) return boolValue(report[key]);
  if (report.execution_metadata?.[key] !== undefined) {
    return boolValue(report.execution_metadata[key]);
  }
  if (report.acceptance_summary?.[key] !== undefined) {
    return boolValue(report.acceptance_summary[key]);
  }
  if (report.metrics?.[key] !== undefined) {
    return boolValue(report.metrics[key]);
  }
  return fallback;
}

export function defaultRiskNotice() {
  return "bsf does not verify supplier authenticity, payment safety, real-time pricing, or compliance qualifications.";
}

export function emptyLimitAudit() {
  return {
    queries_tried_count: 0,
    fetch_attempts_count: 0,
    successful_fetch_count: 0,
    expansion_attempts_count: 0,
    source_categories_attempted_count: 0,
    per_domain_fetch_counts: {},
    max_concurrent_fetch_observed: 0,
    elapsed_seconds: 0,
  };
}

export function makeSkippedStage(round, limitRef, skippedExternalActions = []) {
  return createHardLimitStageRecord({
    round,
    stage: round,
    limitRef,
    skippedExternalActions,
  });
}

export function createNoSearchReport(input = {}) {
  const report = createSchemaNoSearchReport(input);
  return {
    ...report,
    input,
    risk_notice: defaultRiskNotice(),
  };
}

export function deriveReportMetrics(report) {
  const sourceMap = listValue(report?.source_map || report?.sourceMap);
  const supplierCandidates = listValue(
    report?.supplier_candidates || report?.supplierCandidates,
  );
  const boundaryAudit = countBoundaryViolations({
    source_map: sourceMap,
    supplier_candidates: supplierCandidates,
  });

  const computedActionableLeadCount = countActionableLeads({
    sourceMap,
    supplierCandidates,
  });

  const queriesTriedCount = readMetric(report, "queries_tried_count");
  const sourceCategoriesAttemptedCount = readMetric(
    report,
    "source_categories_attempted_count",
    readMetric(report, "source_category_count"),
  );
  const validSourceMap = sourceMap.filter((entry) => !boundaryAudit.errors.some((error) => error.section === "source_map" && sourceMap[error.index] === entry));
  const validSupplierCandidates = supplierCandidates.filter((candidate) => !boundaryAudit.errors.some((error) => error.section === "supplier_candidates" && supplierCandidates[error.index] === candidate));
  const urlBackedSourceMapCount = validSourceMap.length;
  const supplierCandidateCount = validSupplierCandidates.length;
  const actionableLeadCount = computedActionableLeadCount;
  const sourceCategoryCount = new Set([
    ...validSourceMap.map((entry) => entry.source_type).filter(Boolean),
    ...validSupplierCandidates.map((candidate) => candidate.evidence_source_type).filter(Boolean),
  ]).size;
  const missingEvidenceLinkCount = countMissingEvidenceLinks(supplierCandidates);
  const boundaryViolationCount = boundaryAudit.count;

  return {
    queries_tried_count: queriesTriedCount,
    source_categories_attempted_count: sourceCategoriesAttemptedCount,
    url_backed_source_map_count: urlBackedSourceMapCount,
    supplier_candidate_count: supplierCandidateCount,
    actionable_lead_count: actionableLeadCount,
    source_category_count: sourceCategoryCount,
    missing_evidence_link_count: missingEvidenceLinkCount,
    boundary_violation_count: boundaryViolationCount,
    evidence_bound_low: readBoolean(report, "evidence_bound_low"),
    boundary_errors: boundaryAudit.errors,
  };
}

export const computeReportMetrics = deriveReportMetrics;

export function reportPassesFull(report) {
  const metrics = deriveReportMetrics(report);
  return (
    metrics.queries_tried_count >= 6 &&
    metrics.source_categories_attempted_count >= 3 &&
    metrics.url_backed_source_map_count >= 5 &&
    metrics.supplier_candidate_count >= 3 &&
    metrics.actionable_lead_count >= 8 &&
    metrics.source_category_count >= 3 &&
    metrics.missing_evidence_link_count === 0 &&
    metrics.boundary_violation_count === 0
  );
}

export function reportPassesRb005(report) {
  return deriveReportMetrics(report).actionable_lead_count >= 8;
}

export function reportPassesDegradedAllowedDeficit(report) {
  const metrics = deriveReportMetrics(report);
  if (metrics.actionable_lead_count < 8) return false;
  if (metrics.queries_tried_count < 6) return false;
  if (metrics.source_categories_attempted_count < 3) return false;
  if (metrics.missing_evidence_link_count !== 0) return false;
  if (metrics.boundary_violation_count !== 0) return false;

  return (
    metrics.supplier_candidate_count < 3 ||
    metrics.source_category_count < 3 ||
    metrics.url_backed_source_map_count < 5
  );
}

export function classifyLiveReport(report) {
  const metrics = deriveReportMetrics(report);
  if (metrics.missing_evidence_link_count > 0 || metrics.boundary_violation_count > 0) {
    return LiveEligibility.FAIL;
  }
  if (reportPassesFull(report)) return LiveEligibility.FULL;
  if (reportPassesDegradedAllowedDeficit(report)) return LiveEligibility.DEGRADED;
  if (metrics.evidence_bound_low) return LiveEligibility.LOW;
  return LiveEligibility.FAIL;
}

function normalizeClassifierInput(input = {}) {
  const metadata = input.execution_metadata || input.metadata || {};
  const summary = input.acceptance_summary || {};
  const liveReports = listValue(input.live_reports || input.liveReports || input.reports);

  return {
    protocol_compliance_verdict:
      input.protocol_compliance_verdict ||
      metadata.protocol_compliance_verdict ||
      summary.protocol_compliance_verdict ||
      ProtocolVerdict.PASS,
    fixture_gate_verdict:
      input.fixture_gate_verdict ||
      input.fixtureGateVerdict ||
      input.deterministic_fixture_gate_verdict ||
      input.deterministic_fixture_gate ||
      summary.fixture_gate_verdict ||
      "FAIL",
    live_reports: liveReports,
    live_smoke_executed:
      input.live_smoke_executed === true || input.liveSmokeExecuted === true,
  };
}

function countReports(liveReports) {
  const fullEligibleCount = liveReports.filter(reportPassesFull).length;
  const rb005PassCount = liveReports.filter(reportPassesRb005).length;
  const degradedEligibleCount = liveReports.filter(reportPassesDegradedAllowedDeficit).length;
  const evidenceBoundLowCount = liveReports.filter((report) =>
    deriveReportMetrics(report).evidence_bound_low,
  ).length;
  const lowEligibleCount = liveReports.filter(
    (report) => classifyLiveReport(report) === LiveEligibility.LOW,
  ).length;
  const failCount = liveReports.filter(
    (report) => classifyLiveReport(report) === LiveEligibility.FAIL,
  ).length;

  return {
    live_report_count: liveReports.length,
    rb005_pass_count: rb005PassCount,
    evidence_bound_low_count: evidenceBoundLowCount,
    full_eligible_count: fullEligibleCount,
    degraded_eligible_count: degradedEligibleCount,
    low_eligible_count: lowEligibleCount,
    fail_count: failCount,
  };
}

function hardReportFailureExists(liveReports) {
  return liveReports.some((report) => {
    const metrics = deriveReportMetrics(report);
    return metrics.missing_evidence_link_count > 0 || metrics.boundary_violation_count > 0;
  });
}

function fail(reasons, counts = {}) {
  return {
    acceptance_verdict: Verdict.FAIL,
    verdict: Verdict.FAIL,
    reasons,
    counts,
  };
}

export function classifyAcceptanceDetails(input = {}) {
  const normalized = normalizeClassifierInput(input);
  const liveReports = normalized.live_reports;
  const counts = countReports(liveReports);
  const reasons = [];

  if (!PROTOCOL_VERDICTS.includes(normalized.protocol_compliance_verdict)) {
    return fail(["invalid_protocol_compliance_verdict"], counts);
  }

  if (normalized.protocol_compliance_verdict === ProtocolVerdict.FAIL_FAST_NOT_RUN) {
    return fail(["no_search_fail_fast_not_run"], counts);
  }

  if (normalized.protocol_compliance_verdict === ProtocolVerdict.FAIL) {
    return fail(["protocol_compliance_fail"], counts);
  }

  if (normalized.fixture_gate_verdict !== "PASS") {
    return fail(["deterministic_fixture_gate_not_pass"], counts);
  }

  if (!normalized.live_smoke_executed) {
    return fail(["live_smoke_suite_not_executed"], counts);
  }

  if (counts.live_report_count < REQUIRED_LIVE_REPORT_COUNT) {
    return fail(["live_report_count_below_required_10"], counts);
  }

  if (hardReportFailureExists(liveReports)) {
    return fail(["live_report_hard_boundary_failure"], counts);
  }

  if (counts.full_eligible_count >= 8) {
    return {
      acceptance_verdict: Verdict.FULL,
      verdict: Verdict.FULL,
      reasons,
      counts,
    };
  }

  if (counts.rb005_pass_count >= 8) {
    const rb005PassingNonFullReports = liveReports.filter(
      (report) => reportPassesRb005(report) && !reportPassesFull(report),
    );
    const degradedDeficitsOnly = rb005PassingNonFullReports.every((report) =>
      reportPassesDegradedAllowedDeficit(report),
    );

    if (degradedDeficitsOnly) {
      return {
        acceptance_verdict: Verdict.DEGRADED,
        verdict: Verdict.DEGRADED,
        reasons: [...reasons, "full_threshold_missed_by_allowed_degraded_deficits"],
        counts,
      };
    }
  }

  if (
    (counts.rb005_pass_count >= 6 && counts.rb005_pass_count <= 7) ||
    counts.evidence_bound_low_count >= 6
  ) {
    return {
      acceptance_verdict: Verdict.LOW,
      verdict: Verdict.LOW,
      reasons: [
        ...reasons,
        counts.evidence_bound_low_count >= 6
          ? "evidence_bound_low_reports_ge_6"
          : "rb005_pass_count_6_to_7",
      ],
      counts,
    };
  }

  if (counts.rb005_pass_count <= 5 && counts.evidence_bound_low_count < 6) {
    return fail(["rb005_pass_count_lte_5_without_evidence_bound_low"], counts);
  }

  return fail(["no_full_degraded_or_low_condition_matched"], counts);
}

export function classifyAcceptance(input = {}) {
  return classifyAcceptanceDetails(input).acceptance_verdict;
}

export function summarizeAcceptance(input = {}) {
  const details = classifyAcceptanceDetails(input);
  return {
    fixture_gate_verdict: input.fixtureGateVerdict || input.fixture_gate_verdict || "FAIL",
    ...details.counts,
    acceptance_verdict: details.acceptance_verdict,
    reasons: details.reasons,
  };
}

export function enforceNoSearchVerdicts(report) {
  const next = { ...(report || {}) };
  next.execution_metadata = {
    ...(next.execution_metadata || next.metadata || {}),
    stop_reason: "no_search_capability",
    protocol_compliance_verdict: ProtocolVerdict.FAIL_FAST_NOT_RUN,
    acceptance_verdict: Verdict.FAIL,
  };
  next.acceptance_summary = {
    ...(next.acceptance_summary || {}),
    acceptance_verdict: Verdict.FAIL,
  };
  return next;
}
