# Install

`bigdeal-supplier-finder` is distributed as a portable skill directory plus a
local npm package shape for deterministic validation.

The core skill directory is:

```text
bigdeal-supplier-finder/
```

The npm package is not published by this repository's local validation.

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

## Codex-Style Local Skill Directory

If your Codex environment uses `CODEX_HOME`, a local install shape is:

```bash
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -R bigdeal-supplier-finder "${CODEX_HOME:-$HOME/.codex}/skills/"
```

This copies the portable skill contract only. It does not add provider access,
browser sessions, credentials, paid APIs, live search, or external writes.

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

## Not Included

This package does not include npm publication, a marketplace listing, live
supplier discovery, paid API integration, credential handling, browser/session
automation, or production readiness.
