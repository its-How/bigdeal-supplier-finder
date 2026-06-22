# Install

`bigdeal-supplier-finder` is distributed as a portable skill directory.

The core skill directory is:

```text
bigdeal-supplier-finder/
```

## From GitHub

```bash
git clone https://github.com/its-How/bigdeal-supplier-finder.git
cd bigdeal-supplier-finder
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

## Not Included

This package does not include a marketplace listing, live supplier discovery,
paid API integration, credential handling, browser/session automation, or
production readiness.
