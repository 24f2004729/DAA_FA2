const { runAlgorithm } = require('./src/algorithms');
const { getPresetScenarios } = require('./src/engine/generator');
const { v4: uuidv4 } = require('uuid');

const preset = getPresetScenarios()[0];
const s = { ...preset.scenario, scenarioId: uuidv4(), version: 1, createdAt: new Date().toISOString() };

try {
  const r = runAlgorithm({ algorithmId: 'greedy', scenario: s });
  console.log('GREEDY OK: obj=', r.objectiveValue, 'events=', r.events.length, 'selected=', r.selectedTransactions);
} catch(e) { console.error('GREEDY ERROR:', e.message); }

try {
  const r = runAlgorithm({ algorithmId: 'brute-force', scenario: s });
  console.log('BRUTE-FORCE OK: obj=', r.objectiveValue, 'events=', r.events.length, 'selected=', r.selectedTransactions);
} catch(e) { console.error('BRUTE-FORCE ERROR:', e.message); }

try {
  const r = runAlgorithm({ algorithmId: 'dynamic-programming', scenario: s });
  console.log('DP OK: obj=', r.objectiveValue, 'events=', r.events.length, 'selected=', r.selectedTransactions);
} catch(e) { console.error('DP ERROR:', e.message); }

try {
  const r = runAlgorithm({ algorithmId: 'backtracking', scenario: s });
  console.log('BACKTRACKING OK: obj=', r.objectiveValue, 'events=', r.events.length, 'selected=', r.selectedTransactions);
} catch(e) { console.error('BACKTRACKING ERROR:', e.message); }

try {
  const r = runAlgorithm({ algorithmId: 'branch-and-bound', scenario: s });
  console.log('B&B OK: obj=', r.objectiveValue, 'events=', r.events.length, 'selected=', r.selectedTransactions);
} catch(e) { console.error('B&B ERROR:', e.message); }
