# BigDeal Supplier Finder

[![CI](https://github.com/its-How/bigdeal-supplier-finder/actions/workflows/ci.yml/badge.svg)](https://github.com/its-How/bigdeal-supplier-finder/actions/workflows/ci.yml)

Runtime-agnostic agent skill for evidence-bound supplier discovery reports.

This repository is written for agents and automated consumers. It is not a marketing site, crawler, supplier database, or procurement recommendation service.

## Start Here

- [Install](INSTALL.md): copy the `bigdeal-supplier-finder/` skill directory or use the local npm package shape.
- [Use](USAGE.md): run the deterministic fixture and prompt an agent without live/provider actions.
- [Release checklist](RELEASE_CHECKLIST.md): verify package inventory and publication boundaries.
- [Contribute](CONTRIBUTING.md): preserve the evidence-bound report contract.
- [Security](SECURITY.md): keep credential, browser, provider, and live behavior out of the default package.
- [Support](SUPPORT.md): understand maintained scope and issue boundaries.

## Package

| Path | Purpose |
|---|---|
| `bigdeal-supplier-finder/SKILL.md` | Agent-readable workflow contract |
| `bigdeal-supplier-finder/agents/openai.yaml` | Advisory metadata only; not marketplace or runtime acceptance evidence |
| `bigdeal-supplier-finder/references/contract.md` | Report schema, evidence rules, and acceptance boundaries |
| `bigdeal-supplier-finder/scripts/` | Deterministic fixture runner and contract code |
| `bigdeal-supplier-finder/fixtures/` | Sample deterministic inputs and edge cases |
| `bigdeal-supplier-finder/tests/` | Local regression tests |

The npm package shape currently has no `bin`, `main`, or `exports` entry. If a
version is published to npm, it distributes the skill directory and validation
files only; it does not provide a command-line tool or JavaScript import API.
Treat npm registry state as proven only by an npm registry receipt.

## Supported Local Channels

- Generic `SKILL.md` directory: copy `bigdeal-supplier-finder/` into a runtime
  that can load skill directories.
- Codex-style local copy: copy `bigdeal-supplier-finder/` into
  `${CODEX_HOME:-$HOME/.codex}/skills/`.
- `agents/openai.yaml`: advisory metadata bundled with the skill directory only.
  It does not prove OpenAI marketplace acceptance, Codex runtime acceptance, or
  any named registry listing.

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

Local validation does not prove live supplier quality, provider readiness,
browser/session readiness, credential safety, registry acceptance, marketplace
acceptance, or production readiness.

License: MIT.
