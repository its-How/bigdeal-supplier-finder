# BigDeal Supplier Finder

Runtime-agnostic agent skill for evidence-bound supplier discovery reports.

This repository is written for agents and automated consumers. It is not a marketing site, crawler, supplier database, or procurement recommendation service.

## Start Here

- [Install](INSTALL.md): copy the `bigdeal-supplier-finder/` skill directory or use the local npm package shape.
- [Use](USAGE.md): run the deterministic fixture and prompt an agent without live/provider actions.
- [Contribute](CONTRIBUTING.md): preserve the evidence-bound report contract.
- [Security](SECURITY.md): keep credential, browser, provider, and live behavior out of the default package.

## Package

| Path | Purpose |
|---|---|
| `bigdeal-supplier-finder/SKILL.md` | Agent-readable workflow contract |
| `bigdeal-supplier-finder/references/contract.md` | Report schema, evidence rules, and acceptance boundaries |
| `bigdeal-supplier-finder/scripts/` | Deterministic fixture runner and contract code |
| `bigdeal-supplier-finder/fixtures/` | Sample deterministic inputs and edge cases |
| `bigdeal-supplier-finder/tests/` | Local regression tests |

## What It Does

BigDeal Supplier Finder helps an agent prepare a structured sourcing report:

- multi-source search planning;
- query expansion and keyword diversification;
- source map generation;
- supplier candidate extraction with evidence links;
- gaps and next-search suggestions;
- evidence strength labels only.

It does not verify supplier trustworthiness, recommend purchases, bypass access controls, use paid APIs, store databases, or prove live supplier discovery quality.

## Validation

Run from the repository root:

```bash
npm test
npm run check
npm run fixture
```

The fixture command must stay deterministic and must not claim live readiness.

## Publication Boundary

The current package is a locally validated open-source skill package when validation and review pass. Any GitHub push, registry publish, package release, or external write requires a separate explicit approval.

License: MIT.
