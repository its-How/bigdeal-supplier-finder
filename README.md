# BigDeal Supplier Finder

Runtime-agnostic agent skill for evidence-bound supplier discovery reports.

## What It Does

BigDeal Supplier Finder helps an agent prepare a structured sourcing report:

- multi-source search planning
- query expansion and keyword diversification
- source map generation
- supplier candidate extraction with evidence links
- gaps and next-search suggestions
- evidence strength labels only

It does not verify supplier trustworthiness, recommend purchases, bypass access controls, use paid APIs, store databases, or prove live supplier discovery quality.

## Repo Contents

- `bigdeal-supplier-finder/SKILL.md` — agent-readable supplier discovery workflow contract
- `bigdeal-supplier-finder/sources.yaml` — source-family checklist for supplier discovery
- `bigdeal-supplier-finder/source-registries/` — supplier discovery source registries
- `bigdeal-supplier-finder/references/` — externalized report contract

## Installation

### Option 1: skills.sh

```bash
npx skills add its-how/bigdeal-supplier-finder
```

### Option 2: ClawHub

```bash
clawhub install bigdeal-supplier-finder
```

### Option 3: Manual copy

Copy the `bigdeal-supplier-finder/` directory into your agent runtime's skills path.

## Skill

See `bigdeal-supplier-finder/SKILL.md` for the full agent-readable workflow contract.

## License

MIT-0.
