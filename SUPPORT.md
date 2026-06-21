# Support

`bigdeal-supplier-finder` is maintained as a portable, runtime-agnostic skill
directory for evidence-bound supplier discovery reports.

## Supported Scope

Maintained:

- `bigdeal-supplier-finder/SKILL.md` trigger and workflow contract;
- report contract reference;
- deterministic fixtures and tests;
- source-map, supplier-candidate, evidence-link, and scope rules;
- local package metadata for distributing skill files and validation assets;
- documentation that preserves the no-live/default scope.

Not supported by this package:

- supplier trustworthiness, safety, compliance, payment, quality, or purchase
  recommendations;
- credential handling, login, cookies, browser profiles, sessions, captcha,
  paid APIs, recursive crawling, bulk scraping, enrichment, background
  monitoring, or provider configuration;
- production procurement workflows, live supplier verification, account state,
  or external writes;
- CLI or JavaScript import API use unless a future release adds a real `bin`,
  `main`, or `exports` surface.

## Version Policy

- Patch releases may fix fixtures, tests, docs, package metadata, or scope
  wording without changing the report contract.
- Minor releases may add deterministic contract fields, fixtures, or advisory
  metadata after validation.
- Major releases are reserved for incompatible report contract changes.

## Issue Policy

Use GitHub issues for deterministic package defects, unclear documentation,
fixture gaps, or report-contract improvements.

Do not include credentials, tokens, cookies, browser profiles, session material,
private account data, private customer/supplier data, paid provider details, or
live supplier materials in issues.

Requests for npm publish, marketplace/registry submission, live search,
provider/browser behavior, account integration, or procurement recommendation
features need a separate design and approval gate before implementation.
