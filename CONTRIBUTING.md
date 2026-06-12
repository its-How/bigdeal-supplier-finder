# Contributing

Keep this repository agent-first and boundary-safe.

Before opening a change, run:

```bash
npm test
npm run check
npm run fixture
```

Do not add:

- credential handling;
- browser profile/session handling;
- captcha bypass;
- paid API requirements;
- recursive crawling or bulk scraping;
- persistent supplier databases;
- trust scores, supplier recommendations, or procurement advice;
- claims that deterministic fixtures prove live supplier quality.

Changes that add live/provider/browser behavior need a separate design and review gate.
