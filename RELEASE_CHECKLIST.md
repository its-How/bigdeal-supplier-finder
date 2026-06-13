# Release Checklist

Use this checklist before distributing a `bigdeal-supplier-finder` skill package
or npm tarball.

## Portable Skill Inventory

The package must include:

- `bigdeal-supplier-finder/SKILL.md`
- `bigdeal-supplier-finder/agents/openai.yaml` as advisory metadata only
- `bigdeal-supplier-finder/references/contract.md`
- `bigdeal-supplier-finder/scripts/`
- `bigdeal-supplier-finder/fixtures/`
- `bigdeal-supplier-finder/tests/`
- root docs: `README.md`, `INSTALL.md`, `USAGE.md`, `SECURITY.md`,
  `CONTRIBUTING.md`, `CHANGELOG.md`, `OPEN_SOURCE_AUDIT.md`,
  `RELEASE_CHECKLIST.md`, `SUPPORT.md`
- root license: `LICENSE`
- `package.json`

## Deterministic Checks

Run from the repository root:

```bash
npm test
npm run check
npm run fixture
npm pack --dry-run --cache /private/tmp/asf-bsf-npm-cache-20260613
```

## Boundary Checks

- The npm shape has no `bin`, `main`, or `exports`; do not describe it as a
  CLI or JavaScript import API.
- `agents/openai.yaml` is advisory metadata only and does not prove marketplace,
  registry, or runtime acceptance.
- `npm pack --dry-run` proves package contents only. It does not publish and
  does not prove registry acceptance.
- No npm publish, package name claiming, account check, 2FA flow, registry
  submission, marketplace submission, provider/browser/session action,
  credential handling, live search, deploy, or external write is proven by
  local validation.
- Deterministic fixtures prove local contract behavior only, not live supplier
  discovery quality, provider readiness, browser/session readiness, credential
  safety, or production readiness.
