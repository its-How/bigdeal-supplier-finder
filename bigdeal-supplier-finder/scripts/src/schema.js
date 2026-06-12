"use strict";

const SOURCE_TYPES = Object.freeze([
  "b2b_platform",
  "trade_show_directory",
  "association_government",
  "company_website",
  "supplier_directory",
  "media_community",
  "unknown_public_page",
]);

const EVIDENCE_SOURCE_TYPES = Object.freeze([
  ...SOURCE_TYPES,
  "search_result_snippet",
]);

const SEARCH_RESULT_ADMISSIBILITY = Object.freeze([
  "candidate_input",
  "source_map_input",
  "query_fuel_only",
  "rejected",
]);

const SOURCE_ATTEMPT_TYPES = Object.freeze(["search", "fetch", "skip"]);
const SOURCE_ATTEMPT_STATUSES = Object.freeze([
  "success",
  "failed",
  "restricted",
  "skipped",
  "missing_fields",
  "rejected",
]);

const SOURCE_MAP_GRADES = Object.freeze(["A", "B", "C"]);
const SUPPLIER_GRADES = Object.freeze(["A", "B", "C", "D"]);
const DERIVED_FROM = Object.freeze(["fetched_page", "search_result"]);
const EVIDENCE_MODES = Object.freeze([
  "fetched_page",
  "search_result_target",
  "directory_page",
  "cross_source",
]);

const ROUNDS = Object.freeze([
  "ROUND_1",
  "ROUND_2",
  "ROUND_3",
  "ROUND_4",
  "ROUND_5",
]);

const SEARCH_PAGE_PATH_RE = /(^|\/)(search|results|query)(\/|$)/i;
const SEARCH_ENGINE_HOST_RE =
  /(^|\.)((google|bing|yahoo|duckduckgo|baidu|yandex)\.|search\.brave\.com$)/i;
const SEARCH_QUERY_PARAMS = Object.freeze([
  "q",
  "query",
  "search",
  "keyword",
  "keywords",
  "search_query",
]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidUrl(value) {
  if (!isNonEmptyString(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isSearchPageUrl(value) {
  if (!isValidUrl(value)) return false;
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  const path = url.pathname.toLowerCase();

  if (SEARCH_ENGINE_HOST_RE.test(host)) return true;
  if (SEARCH_PAGE_PATH_RE.test(path)) return true;
  return SEARCH_QUERY_PARAMS.some((param) => url.searchParams.has(param));
}

function canonicalUrl(value) {
  if (!isValidUrl(value)) return "";
  const url = new URL(value);
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }
  return url.toString();
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function requireFields(record, fields) {
  const errors = [];
  for (const field of fields) {
    const value = record[field];
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0)
    ) {
      errors.push(`missing_${field}`);
    }
  }
  return errors;
}

function assertEnum(errors, record, field, allowed) {
  if (!allowed.includes(record[field])) {
    errors.push(`invalid_${field}`);
  }
}

function validateSearchResultSignal(signal) {
  if (!isObject(signal)) return { ok: false, errors: ["not_object"] };

  const errors = requireFields(signal, [
    "query_id",
    "engine_or_entry",
    "title",
    "snippet",
    "retrieved_at",
    "is_search_page_url",
    "admissibility",
  ]);

  assertEnum(errors, signal, "admissibility", SEARCH_RESULT_ADMISSIBILITY);

  if ("result_url" in signal && signal.result_url !== undefined) {
    if (!isValidUrl(signal.result_url)) errors.push("invalid_result_url");
    if (signal.is_search_page_url !== isSearchPageUrl(signal.result_url)) {
      errors.push("is_search_page_url_mismatch");
    }
  }

  if (typeof signal.is_search_page_url !== "boolean") {
    errors.push("invalid_is_search_page_url");
  }

  return { ok: errors.length === 0, errors };
}

function classifySearchResultSignal(signal) {
  const resultUrl = signal && signal.result_url;
  if (!isValidUrl(resultUrl)) return "query_fuel_only";
  if (isSearchPageUrl(resultUrl)) return "query_fuel_only";
  return "candidate_input";
}

function validateSourceAttempt(attempt) {
  if (!isObject(attempt)) return { ok: false, errors: ["not_object"] };

  const errors = requireFields(attempt, [
    "attempt_id",
    "url_or_source",
    "source_type",
    "attempt_type",
    "status",
    "reason",
    "retrieved_at",
  ]);

  assertEnum(errors, attempt, "source_type", SOURCE_TYPES);
  assertEnum(errors, attempt, "attempt_type", SOURCE_ATTEMPT_TYPES);
  assertEnum(errors, attempt, "status", SOURCE_ATTEMPT_STATUSES);

  return { ok: errors.length === 0, errors };
}

function validateSourceMapEntry(entry) {
  if (!isObject(entry)) return { ok: false, errors: ["not_object"] };

  const errors = requireFields(entry, [
    "source_name",
    "source_type",
    "url",
    "applicable_reason",
    "evidence_grade",
    "derived_from",
    "snippet_derived",
    "source_attempt_ids",
  ]);

  assertEnum(errors, entry, "source_type", SOURCE_TYPES);
  assertEnum(errors, entry, "evidence_grade", SOURCE_MAP_GRADES);
  assertEnum(errors, entry, "derived_from", DERIVED_FROM);

  if (!isValidUrl(entry.url)) errors.push("invalid_url");
  if (isSearchPageUrl(entry.url)) errors.push("search_page_url_not_evidence");
  if (typeof entry.snippet_derived !== "boolean") {
    errors.push("invalid_snippet_derived");
  }
  if (entry.snippet_derived === true && entry.evidence_grade !== "C") {
    errors.push("snippet_derived_source_map_grade_must_be_c");
  }
  if (!Array.isArray(entry.source_attempt_ids)) {
    errors.push("invalid_source_attempt_ids");
  }

  return { ok: errors.length === 0, errors };
}

function validateEvidenceLink(link) {
  if (!isObject(link)) return { ok: false, errors: ["not_object"] };

  const errors = requireFields(link, [
    "link_id",
    "url",
    "evidence_source_type",
    "evidence_mode",
    "not_fetched",
    "retrieved_at",
    "field_origin",
    "snippet_origin",
  ]);

  assertEnum(errors, link, "evidence_source_type", EVIDENCE_SOURCE_TYPES);
  assertEnum(errors, link, "evidence_mode", EVIDENCE_MODES);

  if (!isValidUrl(link.url)) errors.push("invalid_url");
  if (isSearchPageUrl(link.url)) errors.push("search_page_url_not_evidence");
  if (typeof link.not_fetched !== "boolean") errors.push("invalid_not_fetched");
  if (!isObject(link.field_origin)) errors.push("invalid_field_origin");

  if (link.evidence_mode === "search_result_target" && link.not_fetched !== true) {
    errors.push("search_result_target_must_be_not_fetched");
  }

  return { ok: errors.length === 0, errors };
}

function validateSupplierCandidate(candidate) {
  if (!isObject(candidate)) return { ok: false, errors: ["not_object"] };

  const errors = requireFields(candidate, [
    "candidate_id",
    "name",
    "region",
    "product_match_summary",
    "evidence_grade",
    "evidence_links",
    "evidence_source_type",
    "evidence_mode",
    "derived_from",
    "snippet_derived",
    "not_fetched",
    "source_attempt_ids",
    "retrieved_at",
    "field_origin",
    "snippet_origin",
  ]);

  assertEnum(errors, candidate, "evidence_grade", SUPPLIER_GRADES);
  assertEnum(errors, candidate, "evidence_source_type", EVIDENCE_SOURCE_TYPES);
  assertEnum(errors, candidate, "evidence_mode", EVIDENCE_MODES);
  assertEnum(errors, candidate, "derived_from", DERIVED_FROM);

  if (candidate.evidence_grade === "D") {
    errors.push("d_grade_not_allowed_in_supplier_candidates");
  }
  if (typeof candidate.snippet_derived !== "boolean") {
    errors.push("invalid_snippet_derived");
  }
  if (typeof candidate.not_fetched !== "boolean") errors.push("invalid_not_fetched");
  if (!Array.isArray(candidate.source_attempt_ids)) {
    errors.push("invalid_source_attempt_ids");
  }
  if (!isObject(candidate.field_origin)) errors.push("invalid_field_origin");

  const evidenceLinks = Array.isArray(candidate.evidence_links)
    ? candidate.evidence_links
    : [];
  if (evidenceLinks.length === 0) errors.push("missing_evidence_links");

  for (const [index, link] of evidenceLinks.entries()) {
    const validation = validateEvidenceLink(link);
    for (const error of validation.errors) {
      errors.push(`evidence_links_${index}_${error}`);
    }
  }

  if (candidate.derived_from === "search_result") {
    if (candidate.snippet_derived !== true) errors.push("search_result_must_be_snippet_derived");
    if (candidate.not_fetched !== true) errors.push("search_result_must_be_not_fetched");
    if (candidate.evidence_grade !== "C") errors.push("search_result_candidate_grade_must_be_c");
  }

  if (candidate.evidence_mode === "search_result_target") {
    if (candidate.snippet_derived !== true) errors.push("search_result_target_must_be_snippet_derived");
    if (candidate.not_fetched !== true) errors.push("search_result_target_must_be_not_fetched");
    if (candidate.evidence_grade !== "C") errors.push("search_result_target_grade_must_be_c");
  }

  return { ok: errors.length === 0, errors };
}

function validateQuerySuggestion(suggestion) {
  if (!isObject(suggestion)) return { ok: false, errors: ["not_object"] };

  const errors = requireFields(suggestion, ["query_text", "language", "rationale"]);
  if (
    suggestion.derived_from_ref !== undefined &&
    (!isObject(suggestion.derived_from_ref) ||
      !["search_result_signal", "source_attempt"].includes(suggestion.derived_from_ref.type) ||
      !isNonEmptyString(suggestion.derived_from_ref.id))
  ) {
    errors.push("invalid_derived_from_ref");
  }

  return { ok: errors.length === 0, errors };
}

function createHardLimitStageRecord({ round, stage, limitRef, skippedExternalActions = [] }) {
  const stageName = stage || round;
  return {
    round,
    stage: stageName,
    status: "skipped",
    reason: "no_external_action_after_limit",
    limit_ref: limitRef,
    limits_hit: limitRef ? [limitRef] : [],
    skipped_external_actions: Array.isArray(skippedExternalActions)
      ? skippedExternalActions
      : [],
    external_actions_allowed: false,
  };
}

function createNoSearchExecutionMetadata({
  startedAt,
  finishedAt,
  runtimeCapabilities = { search: false, fetch: false, search_entries_count: 0 },
} = {}) {
  return {
    profile: "no-search",
    runtime_capabilities: runtimeCapabilities,
    started_at: startedAt || new Date().toISOString(),
    finished_at: finishedAt || new Date().toISOString(),
    elapsed_seconds: 0,
    rounds_completed: [],
    stage_records: [],
    stop_reason: "no_search_capability",
    limits_hit: [],
    skipped_external_actions: ["search", "fetch"],
    queries_tried_count: 0,
    fetch_attempts_count: 0,
    expansion_attempts_count: 0,
    source_categories_attempted_count: 0,
    per_domain_fetch_counts: {},
    max_concurrent_fetch_observed: 0,
    source_attempts_count: 0,
    search_result_signals_count: 0,
    non_search_result_url_count: 0,
    url_backed_source_map_count: 0,
    supplier_candidate_count: 0,
    actionable_lead_count: 0,
    source_category_count: 0,
    missing_evidence_link_count: 0,
    boundary_violation_count: 0,
    protocol_compliance_verdict: "FAIL_FAST_NOT_RUN",
    acceptance_verdict: "FAIL",
    live_report_eligibility: "FAIL",
  };
}

function createNoSearchReport(options = {}) {
  return {
    execution_metadata: createNoSearchExecutionMetadata(options),
    execution_limit_audit: {
      queries_tried_count: 0,
      fetch_attempts_count: 0,
      expansion_attempts_count: 0,
      source_categories_attempted_count: 0,
      per_domain_fetch_counts: {},
      max_concurrent_fetch_observed: 0,
      elapsed_seconds: 0,
    },
    acceptance_summary: {
      fixture_gate_verdict: "NOT_RUN",
      live_report_count: 0,
      rb005_pass_count: 0,
      evidence_bound_low_count: 0,
      full_eligible_count: 0,
      degraded_eligible_count: 0,
      low_eligible_count: 0,
      fail_count: 1,
      acceptance_verdict: "FAIL",
    },
    source_map: [],
    supplier_candidates: [],
    search_result_signals: [],
    source_attempts: [],
    queries_tried: [],
    query_suggestions: [],
    gaps: [{ reason: "no_search_capability" }],
    next_steps: [],
    risk_notice:
      "bsf does not verify supplier authenticity, payment safety, real-time pricing, or compliance qualifications.",
  };
}

function countBoundaryViolations(report) {
  const errors = [];

  for (const [index, entry] of (report.source_map || []).entries()) {
    const validation = validateSourceMapEntry(entry);
    if (!validation.ok) errors.push({ section: "source_map", index, errors: validation.errors });
  }

  for (const [index, candidate] of (report.supplier_candidates || []).entries()) {
    const validation = validateSupplierCandidate(candidate);
    if (!validation.ok) {
      errors.push({ section: "supplier_candidates", index, errors: validation.errors });
    }
  }

  return { count: errors.length, errors };
}

function countMissingEvidenceLinks(candidates = []) {
  return candidates.filter(
    (candidate) =>
      !Array.isArray(candidate.evidence_links) || candidate.evidence_links.length === 0,
  ).length;
}

function countActionableLeads({ sourceMap = [], supplierCandidates = [] } = {}) {
  const keys = new Set();

  for (const entry of sourceMap) {
    if (!validateSourceMapEntry(entry).ok) continue;
    keys.add(`${canonicalUrl(entry.url)}::${normalizeName(entry.source_name)}`);
  }

  for (const candidate of supplierCandidates) {
    if (!validateSupplierCandidate(candidate).ok) continue;
    const linkUrl = candidate.evidence_links[0] && candidate.evidence_links[0].url;
    keys.add(`${canonicalUrl(linkUrl)}::${normalizeName(candidate.name)}`);
  }

  return keys.size;
}

export {
  SOURCE_TYPES,
  EVIDENCE_SOURCE_TYPES,
  SEARCH_RESULT_ADMISSIBILITY,
  SOURCE_ATTEMPT_TYPES,
  SOURCE_ATTEMPT_STATUSES,
  SOURCE_MAP_GRADES,
  SUPPLIER_GRADES,
  DERIVED_FROM,
  EVIDENCE_MODES,
  ROUNDS,
  isSearchPageUrl,
  canonicalUrl,
  normalizeName,
  validateSearchResultSignal,
  classifySearchResultSignal,
  validateSourceAttempt,
  validateSourceMapEntry,
  validateEvidenceLink,
  validateSupplierCandidate,
  validateQuerySuggestion,
  createHardLimitStageRecord,
  createNoSearchExecutionMetadata,
  createNoSearchReport,
  countBoundaryViolations,
  countMissingEvidenceLinks,
  countActionableLeads,
};
