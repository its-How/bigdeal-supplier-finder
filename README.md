# BigDeal Supplier Finder

Runtime-agnostic agent skill for evidence-bound supplier discovery reports.

This repository is written for agents and automated consumers. It is not a marketing site, crawler, supplier database, or procurement recommendation service.

## Start Here

- [Install](INSTALL.md): copy the `bigdeal-supplier-finder/` skill directory.
- [Use](USAGE.md): prompt an agent without live/provider actions.
- [Contribute](CONTRIBUTING.md): preserve the evidence-bound report contract.
- [Security](SECURITY.md): keep credential, browser, provider, and live behavior out of the default package.

## Package

| Path | Purpose |
|---|---|
| `bigdeal-supplier-finder/SKILL.md` | Agent-readable workflow contract |

## Supported Local Channels

- Generic `SKILL.md` directory: copy `bigdeal-supplier-finder/` into a runtime
  that can load skill directories.
- Codex-style local copy: copy `bigdeal-supplier-finder/` into
  `${CODEX_HOME:-$HOME/.codex}/skills/`.

## What It Does

BigDeal Supplier Finder helps an agent prepare a structured sourcing report:

- multi-source search planning;
- query expansion and keyword diversification;
- source map generation;
- supplier candidate extraction with evidence links;
- gaps and next-search suggestions;
- evidence strength labels only.

It does not verify supplier trustworthiness, recommend purchases, bypass access controls, use paid APIs, store databases, or prove live supplier discovery quality.

## Publication Scope

This repository is a locally validated skill package. Any GitHub push, registry publish, package release, or external write requires a separate explicit approval and a receipt.

Local validation does not prove live supplier quality, provider readiness,
browser/session readiness, credential safety, registry acceptance, marketplace
acceptance, or production readiness.

License: MIT.
