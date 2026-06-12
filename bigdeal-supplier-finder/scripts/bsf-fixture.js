#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { runFixture } from './src/orchestrator.js';
import { summarizeAcceptance } from './src/classifier.js';

const fixturePath = process.argv[2] ?? new URL('../fixtures/sample-suite.json', import.meta.url).pathname;
const raw = await readFile(fixturePath, 'utf8');
const suite = JSON.parse(raw);
const reports = suite.reports.map(runFixture);
const acceptance = summarizeAcceptance({
  fixtureGateVerdict: suite.fixture_gate_verdict ?? 'PASS',
  liveReports: [],
  live_smoke_executed: false
});

process.stdout.write(`${JSON.stringify({
  evidence_scope: 'deterministic-fixture',
  cannot_prove: ['real_search_breadth', 'supplier_discovery_quality', 'live_smoke_readiness'],
  acceptance,
  deterministic_reports: reports,
  live_reports: []
}, null, 2)}\n`);
