# Usage

Use `bigdeal-supplier-finder` when an agent needs an evidence-bound supplier
discovery report contract for a product or sourcing brief.

The skill produces source maps, supplier candidates with evidence links, search
result signals, gaps, and next-search suggestions. It does not verify supplier
trustworthiness or recommend purchases.

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
Codex-style local copy into `${CODEX_HOME:-$HOME/.codex}/skills/`.

## Live Or Provider Work

Live search, provider access, browser/session use, paid APIs, credentialed
sources, or production workflows are outside the default package. They need a
separate design, authorization, evidence split, and review gate.
