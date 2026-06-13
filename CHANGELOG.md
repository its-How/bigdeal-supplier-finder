# Changelog

## v0.1.2

- Local hardening version after the GitHub `v0.1.1` release already existed.
  This keeps the package metadata ahead of that released tag instead of
  rewriting `v0.1.1` contents after the fact.
- Clarifies that the npm package shape only distributes skill files and local
  validation assets. It provides no CLI, no `main` import API, and no `exports`
  API surface.
- Documents supported local channels: generic `SKILL.md` directory installs and
  Codex-style local copies. `agents/openai.yaml` remains advisory metadata only
  and does not prove OpenAI marketplace or runtime acceptance.
- Keeps publication and safety boundaries explicit: no npm publish has occurred,
  and local validation does not prove live supplier quality, provider readiness,
  browser/session readiness, credential safety, registry acceptance, or
  production readiness.

## v0.1.1

- GitHub release existed before this local hardening pass.
- This changelog entry records the observed release-line boundary only; it does
  not claim that the current npm package was published as `0.1.1`.
- Post-release local package/docs changes are tracked as `v0.1.2` to avoid
  drifting package metadata back onto an already-created GitHub release.

## v0.1.0

- Initial GitHub-first release of the standalone `bigdeal-supplier-finder` skill
  package.
- Includes the runtime-agnostic `SKILL.md` contract, deterministic fixture
  runner, tests, report contract reference, fixtures, and open-source audit
  notes.
- Scope is evidence-bound supplier discovery reporting only: no supplier trust
  verdict, purchase recommendation, credential/browser/provider/live behavior,
  paid API integration, or external write.
