# Security

Report security issues through GitHub Security Advisories when available, or by
opening a minimal public issue that avoids secrets and private account details.

Do not include credentials, tokens, cookies, browser profiles, session material,
private supplier/customer data, paid provider details, or account data in
reports.

## Security Scope

`bigdeal-supplier-finder` should not:

- log in, handle credentials, read sessions, solve captcha, or bypass access
  controls;
- use paid APIs, recursive crawling, bulk scraping, persistent supplier
  databases, contact enrichment, or background monitoring;
- perform browser/provider/live/external-write actions by default;
- label suppliers as trustworthy, safe, recommended, best, verified, compliant,
  or purchase-ready;
- claim that deterministic fixtures prove live supplier discovery quality.

Changes that add live/provider/browser behavior require a separate design and
review gate.
