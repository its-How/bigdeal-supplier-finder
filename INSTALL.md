# Install

`bigdeal-supplier-finder` is distributed as a portable skill directory plus a
local npm package shape for deterministic validation.

The core skill directory is:

```text
bigdeal-supplier-finder/
```

The npm package is not published by this repository's local validation. Package
metadata has no `bin`, `main`, or `exports` entry, so the npm shape is for
distributing skill files and local validation assets only. It is not a CLI and
not a JavaScript import API. Treat npm registry state as proven only by an npm
registry receipt.

## From GitHub

```bash
git clone https://github.com/its-How/bigdeal-supplier-finder.git
cd bigdeal-supplier-finder
node --version
npm --version
```

## Generic Agent Runtime

If your agent runtime supports `SKILL.md` directories, copy the skill directory
into that runtime's configured skill directory:

```bash
cp -R bigdeal-supplier-finder /path/to/your/skills/
```

Then restart or reload the runtime according to that runtime's own rules.

This is a generic `SKILL.md` directory channel only. Runtime-specific acceptance,
trigger behavior, marketplace listing, and registry acceptance are not proven by
the copy step.

## Codex-Style Local Skill Directory

If your Codex environment uses `CODEX_HOME`, a local install shape is:

```bash
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -R bigdeal-supplier-finder "${CODEX_HOME:-$HOME/.codex}/skills/"
```

This copies the portable skill contract only. It does not add provider access,
browser sessions, credentials, paid APIs, live search, or external writes.

`bigdeal-supplier-finder/agents/openai.yaml` is included as advisory metadata
only. It does not prove OpenAI marketplace acceptance, Codex runtime acceptance,
or any named registry listing.

## Local Package Validation

From the repository root:

```bash
npm test
npm run check
npm run fixture
npm pack --dry-run
```

`npm pack --dry-run` shows what would be included in an npm package. It does not
publish the package and does not prove registry acceptance.

`npm publish`, package name claiming, account checks, registry submission, and
release mutation require separate exact approval and an npm registry receipt.

## Not Included

This package does not include a marketplace listing, live supplier discovery,
paid API integration, credential handling, browser/session automation, or
production readiness.
