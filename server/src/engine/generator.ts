import { v4 as uuidv4 } from 'uuid';
import type { Scenario, ScenarioPreset, Transaction } from '@bank-opt/shared';

/** Seeded pseudo-random number generator (mulberry32) */
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function generateRandomScenario(seed: number, n: number, capacity: number): Scenario {
  const rand = mulberry32(seed);
  const ids = Array.from({ length: n }, (_, i) => `T${i + 1}`);

  const transactions: Transaction[] = ids.map((id, i) => {
    const value = Math.round(rand() * 150000 / 10000) * 10000 + 20000;
    const cost = Math.floor(rand() * 8) + 2;
    const priority = Math.floor(rand() * 9) + 1;
    const risk = Math.floor(rand() * 9) + 1;
    return { id, label: id, value, cost, priority, risk, dependencies: [], conflicts: [], status: 'pending' };
  });

  // Add some dependencies (avoid cycles)
  for (let i = 1; i < n; i++) {
    if (rand() < 0.25) {
      const depIdx = Math.floor(rand() * i);
      const depId = ids[depIdx];
      if (!transactions[i].dependencies.includes(depId)) {
        transactions[i] = { ...transactions[i], dependencies: [...transactions[i].dependencies, depId] };
      }
    }
  }

  // Add some conflicts (symmetric, no self-conflicts)
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (rand() < 0.15) {
        transactions[i] = { ...transactions[i], conflicts: [...transactions[i].conflicts, ids[j]] };
        transactions[j] = { ...transactions[j], conflicts: [...transactions[j].conflicts, ids[i]] };
      }
    }
  }

  return {
    scenarioId: uuidv4(),
    seed,
    label: `Random Scenario (n=${n}, cap=${capacity})`,
    capacity,
    riskThreshold: 10,
    objective: { mode: 'value', weights: { alpha: 1, beta: 0.5, gamma: 0.3, delta: 0.2 } },
    transactions,
    version: 1,
    createdAt: new Date().toISOString(),
  };
}

export function getPresetScenarios(): ScenarioPreset[] {
  return [
    {
      id: 'canonical',
      name: 'Canonical Example',
      description: 'The reference scenario from the blueprint: 5 transactions with dependency chain, conflict pair, and mixed priorities/values. Ideal for learning.',
      scenario: {
        seed: 42,
        label: 'Canonical Example (Blueprint)',
        capacity: 18,
        riskThreshold: 10,
        objective: { mode: 'value', weights: { alpha: 1, beta: 0.5, gamma: 0.3, delta: 0.2 } },
        transactions: [
          { id: 'T1', label: 'T1', value: 80000, cost: 4, priority: 9, risk: 2, dependencies: [], conflicts: [], status: 'pending' },
          { id: 'T2', label: 'T2', value: 50000, cost: 3, priority: 7, risk: 4, dependencies: ['T1'], conflicts: [], status: 'pending' },
          { id: 'T3', label: 'T3', value: 120000, cost: 7, priority: 8, risk: 3, dependencies: [], conflicts: ['T5'], status: 'pending' },
          { id: 'T4', label: 'T4', value: 40000, cost: 2, priority: 5, risk: 8, dependencies: ['T2'], conflicts: [], status: 'pending' },
          { id: 'T5', label: 'T5', value: 90000, cost: 5, priority: 10, risk: 2, dependencies: [], conflicts: ['T3'], status: 'pending' },
        ],
      },
    },
    {
      id: 'balanced-day',
      name: 'Balanced Day',
      description: 'A typical trading day with balanced transactions. Ideal for baseline greedy vs DP vs B&B comparison.',
      scenario: {
        seed: 1001,
        label: 'Balanced Day',
        capacity: 20,
        riskThreshold: 8,
        objective: { mode: 'value', weights: { alpha: 1, beta: 0.5, gamma: 0.3, delta: 0.2 } },
        transactions: [
          { id: 'T1', label: 'T1', value: 70000, cost: 3, priority: 8, risk: 2, dependencies: [], conflicts: [], status: 'pending' },
          { id: 'T2', label: 'T2', value: 60000, cost: 4, priority: 6, risk: 3, dependencies: [], conflicts: [], status: 'pending' },
          { id: 'T3', label: 'T3', value: 100000, cost: 6, priority: 9, risk: 4, dependencies: ['T1'], conflicts: [], status: 'pending' },
          { id: 'T4', label: 'T4', value: 45000, cost: 2, priority: 5, risk: 5, dependencies: [], conflicts: ['T6'], status: 'pending' },
          { id: 'T5', label: 'T5', value: 80000, cost: 5, priority: 7, risk: 3, dependencies: ['T2'], conflicts: [], status: 'pending' },
          { id: 'T6', label: 'T6', value: 55000, cost: 3, priority: 6, risk: 6, dependencies: [], conflicts: ['T4'], status: 'pending' },
        ],
      },
    },
    {
      id: 'liquidity-crunch',
      name: 'Liquidity Crunch',
      description: 'Very low capacity forces hard trade-offs. Many transactions exceed the budget. Stress-tests constraint engines.',
      scenario: {
        seed: 2002,
        label: 'Liquidity Crunch',
        capacity: 8,
        riskThreshold: 7,
        objective: { mode: 'value', weights: { alpha: 1, beta: 0.5, gamma: 0.3, delta: 0.2 } },
        transactions: [
          { id: 'T1', label: 'T1', value: 90000, cost: 5, priority: 9, risk: 2, dependencies: [], conflicts: [], status: 'pending' },
          { id: 'T2', label: 'T2', value: 75000, cost: 4, priority: 8, risk: 3, dependencies: [], conflicts: ['T3'], status: 'pending' },
          { id: 'T3', label: 'T3', value: 110000, cost: 6, priority: 10, risk: 4, dependencies: [], conflicts: ['T2'], status: 'pending' },
          { id: 'T4', label: 'T4', value: 40000, cost: 3, priority: 5, risk: 6, dependencies: ['T1'], conflicts: [], status: 'pending' },
          { id: 'T5', label: 'T5', value: 60000, cost: 4, priority: 7, risk: 5, dependencies: [], conflicts: [], status: 'pending' },
        ],
      },
    },
    {
      id: 'dependency-chain',
      name: 'Dependency Chain',
      description: 'Long prerequisite chains (T1 → T2 → T3 → T4). Backtracking and BFS/DFS shine here.',
      scenario: {
        seed: 3003,
        label: 'Dependency Chain',
        capacity: 22,
        riskThreshold: 9,
        objective: { mode: 'priority', weights: { alpha: 0.5, beta: 1, gamma: 0.2, delta: 0.1 } },
        transactions: [
          { id: 'T1', label: 'T1', value: 30000, cost: 3, priority: 6, risk: 2, dependencies: [], conflicts: [], status: 'pending' },
          { id: 'T2', label: 'T2', value: 50000, cost: 4, priority: 7, risk: 3, dependencies: ['T1'], conflicts: [], status: 'pending' },
          { id: 'T3', label: 'T3', value: 80000, cost: 5, priority: 9, risk: 3, dependencies: ['T2'], conflicts: [], status: 'pending' },
          { id: 'T4', label: 'T4', value: 120000, cost: 6, priority: 10, risk: 4, dependencies: ['T3'], conflicts: [], status: 'pending' },
          { id: 'T5', label: 'T5', value: 45000, cost: 3, priority: 5, risk: 5, dependencies: [], conflicts: [], status: 'pending' },
          { id: 'T6', label: 'T6', value: 60000, cost: 4, priority: 6, risk: 2, dependencies: [], conflicts: [], status: 'pending' },
        ],
      },
    },
    {
      id: 'conflict-heavy',
      name: 'Conflict Heavy',
      description: 'Many incompatible pairs. Feasibility pruning is the primary challenge. Good for B&B demonstration.',
      scenario: {
        seed: 4004,
        label: 'Conflict Heavy',
        capacity: 25,
        riskThreshold: 10,
        objective: { mode: 'value', weights: { alpha: 1, beta: 0.5, gamma: 0.3, delta: 0.2 } },
        transactions: [
          { id: 'T1', label: 'T1', value: 85000, cost: 4, priority: 8, risk: 3, dependencies: [], conflicts: ['T2', 'T3'], status: 'pending' },
          { id: 'T2', label: 'T2', value: 90000, cost: 5, priority: 9, risk: 2, dependencies: [], conflicts: ['T1', 'T4'], status: 'pending' },
          { id: 'T3', label: 'T3', value: 70000, cost: 3, priority: 7, risk: 4, dependencies: [], conflicts: ['T1', 'T5'], status: 'pending' },
          { id: 'T4', label: 'T4', value: 95000, cost: 6, priority: 10, risk: 2, dependencies: [], conflicts: ['T2'], status: 'pending' },
          { id: 'T5', label: 'T5', value: 60000, cost: 4, priority: 6, risk: 5, dependencies: [], conflicts: ['T3'], status: 'pending' },
          { id: 'T6', label: 'T6', value: 50000, cost: 3, priority: 5, risk: 6, dependencies: [], conflicts: [], status: 'pending' },
        ],
      },
    },
    {
      id: 'high-risk',
      name: 'High-Risk Batch',
      description: 'Several transactions have high risk scores that interact with risk thresholds. Constraint engine dominates decisions.',
      scenario: {
        seed: 5005,
        label: 'High-Risk Batch',
        capacity: 20,
        riskThreshold: 5,
        objective: { mode: 'composite', weights: { alpha: 1, beta: 0.5, gamma: 2, delta: 0.5 } },
        transactions: [
          { id: 'T1', label: 'T1', value: 100000, cost: 4, priority: 8, risk: 9, dependencies: [], conflicts: [], status: 'pending' },
          { id: 'T2', label: 'T2', value: 60000, cost: 3, priority: 6, risk: 3, dependencies: [], conflicts: [], status: 'pending' },
          { id: 'T3', label: 'T3', value: 80000, cost: 5, priority: 7, risk: 8, dependencies: [], conflicts: [], status: 'pending' },
          { id: 'T4', label: 'T4', value: 45000, cost: 2, priority: 5, risk: 2, dependencies: ['T2'], conflicts: [], status: 'pending' },
          { id: 'T5', label: 'T5', value: 70000, cost: 4, priority: 9, risk: 7, dependencies: [], conflicts: ['T4'], status: 'pending' },
          { id: 'T6', label: 'T6', value: 55000, cost: 3, priority: 4, risk: 1, dependencies: [], conflicts: [], status: 'pending' },
        ],
      },
    },
  ];
}
