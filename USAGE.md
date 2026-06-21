# Usage

Use `bigdeal-supplier-finder` when an agent needs an evidence-bound supplier
discovery report contract for a product or sourcing brief.

The skill produces source maps, supplier candidates with evidence links, search
result signals, gaps, and next-search suggestions. It does not verify supplier
trustworthiness or recommend purchases.

## Deterministic First Run

From the repository root:

```bash
npm test
npm run check
npm run fixture
```

Expected fixture scope:

- `evidence_scope` is `deterministic-fixture`;
- `live_reports` is empty;
- fixture output does not prove real search breadth, supplier discovery quality,
  or live smoke readiness.

This proves local contract behavior only. It does not prove live supplier
discovery quality, provider readiness, browser/session readiness, account state,
credential safety, registry acceptance, or production readiness.

## Minimal Agent Prompt

After installing the skill directory into a runtime that can load `SKILL.md`
skills, use a prompt like:

```text
Use bigdeal-supplier-finder to prepare an evidence-bound supplier discovery
report for:
<product and sourcing brief>

Runtime capability is no-search unless explicitly stated otherwise. Produce
queries, source map expectations, gaps, and next-search suggestions. Do not log
in, use credentials, bypass captcha, use paid APIs, scrape at scale, verify
supplier trust, recommend purchases, or perform live/external-write actions.
```

Supported local use channels are the generic `SKILL.md` directory copy and a
Codex-style local copy into `${CODEX_HOME:-$HOME/.codex}/skills/`. The bundled
`agents/openai.yaml` file is advisory metadata only and does not prove OpenAI
marketplace acceptance, runtime acceptance, registry acceptance, or production
readiness.

The package has no CLI or import API. Do not invoke it as an npm command or
import it from JavaScript unless a future release adds a real `bin`, `main`, or
`exports` surface.

## Live Or Provider Work

Live search, provider access, browser/session use, paid APIs, credentialed
sources, or production workflows are outside the default package. They need a
separate design, authorization, evidence split, and review gate.
