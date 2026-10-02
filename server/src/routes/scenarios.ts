import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { Scenario, ValidationResult, DependencyGraph, GraphNode, GraphEdge } from '@bank-opt/shared';
import { getPresetScenarios, generateRandomScenario } from '../engine/generator';

const router = Router();

// GET /api/scenarios/presets
router.get('/presets', (_req: Request, res: Response) => {
  res.json({ success: true, data: getPresetScenarios() });
});

// POST /api/scenarios/generate
router.post('/generate', (req: Request, res: Response) => {
  const { seed = Math.floor(Math.random() * 99999), n = 5, capacity = 18 } = req.body;
  const scenario = generateRandomScenario(Number(seed), Number(n), Number(capacity));
  res.json({ success: true, data: scenario });
});

// POST /api/scenarios/validate
router.post('/validate', (req: Request, res: Response) => {
  const scenario = req.body as Scenario;
  const errors: ValidationResult['errors'] = [];
  const warnings: string[] = [];

  if (!scenario.transactions || scenario.transactions.length === 0) {
    errors.push({ field: 'transactions', message: 'Scenario must have at least one transaction.' });
  }
  if (!scenario.capacity || scenario.capacity <= 0) {
    errors.push({ field: 'capacity', message: 'Capacity must be a positive number.' });
  }

  // Check for duplicate IDs
  const ids = scenario.transactions.map(t => t.id);
  const dups = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dups.length > 0) {
    errors.push({ field: 'transactions', message: `Duplicate transaction IDs: ${dups.join(', ')}` });
  }

  // Check for invalid dependency references
  const idSet = new Set(ids);
  for (const tx of scenario.transactions) {
    for (const dep of tx.dependencies) {
      if (!idSet.has(dep)) {
        errors.push({ field: 'dependencies', message: `${tx.id} depends on unknown transaction ${dep}.`, transactionId: tx.id });
      }
    }
    for (const conf of tx.conflicts) {
      if (!idSet.has(conf)) {
        errors.push({ field: 'conflicts', message: `${tx.id} conflicts with unknown transaction ${conf}.`, transactionId: tx.id });
      }
    }
  }

  // Cycle detection (topological sort)
  const inDeg = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const id of ids) { inDeg.set(id, 0); adj.set(id, []); }
  for (const tx of scenario.transactions) {
    for (const dep of tx.dependencies) {
      adj.get(dep)?.push(tx.id);
      inDeg.set(tx.id, (inDeg.get(tx.id) ?? 0) + 1);
    }
  }
  const queue = ids.filter(id => inDeg.get(id) === 0);
  let visited = 0;
  while (queue.length > 0) {
    const node = queue.shift()!;
    visited++;
    for (const n of (adj.get(node) ?? [])) {
      inDeg.set(n, (inDeg.get(n) ?? 1) - 1);
      if (inDeg.get(n) === 0) queue.push(n);
    }
  }
  if (visited < ids.length) {
    errors.push({ field: 'dependencies', message: 'Dependency cycle detected. Remove circular dependencies.' });
  }

  // Warnings
  const totalCost = scenario.transactions.reduce((s, t) => s + t.cost, 0);
  if (totalCost <= scenario.capacity) {
    warnings.push('All transactions fit within capacity — selection is trivially unconstrained.');
  }

  const result: ValidationResult = { valid: errors.length === 0, errors, warnings };
  res.json({ success: true, data: result });
});

// POST /api/scenarios/graph
router.post('/graph', (req: Request, res: Response) => {
  const scenario = req.body as Scenario;
  const nodes: GraphNode[] = scenario.transactions.map((tx, i) => ({
    id: tx.id,
    label: `${tx.id} (₹${(tx.value / 1000).toFixed(0)}K, P${tx.priority})`,
    x: 150 + (i % 4) * 180,
    y: 100 + Math.floor(i / 4) * 150,
  }));

  const edges: GraphEdge[] = [];
  for (const tx of scenario.transactions) {
    for (const dep of tx.dependencies) {
      edges.push({ source: dep, target: tx.id, type: 'dependency' });
    }
    for (const conf of tx.conflicts) {
      if (tx.id < conf) { // deduplicate
        edges.push({ source: tx.id, target: conf, type: 'conflict' });
      }
    }
  }

  const graph: DependencyGraph = { nodes, edges };
  res.json({ success: true, data: graph });
});

export default router;
