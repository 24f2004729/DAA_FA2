import { BaseAlgorithm } from './base';
import type { Scenario, AlgorithmResult, Transaction } from '@bank-opt/shared';

interface BBNode {
  level: number;
  value: number;
  weight: number;
  selected: string[];
  bound: number;
}

export class BranchAndBoundAlgorithm extends BaseAlgorithm {
  /** Fractional knapsack upper bound (LP relaxation) */
  private calcUpperBound(
    node: BBNode,
    txs: Transaction[],
    scenario: Scenario
  ): number {
    let remaining = scenario.capacity - node.weight;
    let bound = node.value;

    for (let i = node.level; i < txs.length; i++) {
      const tx = txs[i];
      if (tx.cost <= remaining) {
        remaining -= tx.cost;
        bound += this.getItemValue(tx, scenario);
      } else {
        // Take fraction
        bound += (remaining / tx.cost) * this.getItemValue(tx, scenario);
        break;
      }
    }
    return bound;
  }

  run(scenario: Scenario): AlgorithmResult {
    const start = Date.now();
    this.metrics.theoreticalComplexity = 'O(2ⁿ) worst, typically O(n log n) – O(2^(n/2)) with pruning';
    this.metrics.spaceComplexity = 'O(n) best-first queue';

    const txMap = this.buildTxMap(scenario.transactions);

    // Sort by value/cost ratio for tighter bounds
    const txs = [...scenario.transactions].sort((a, b) => {
      const ra = this.getItemValue(a, scenario) / a.cost;
      const rb = this.getItemValue(b, scenario) / b.cost;
      return rb - ra;
    });

    let incumbent = 0;
    let bestSelected: string[] = [];

    this.emitEvent('INIT',
      `Branch & Bound initialized. Transactions sorted by value/cost ratio for tighter bounds. ` +
      `Will prune any branch whose optimistic upper bound ≤ current best (₹${incumbent.toLocaleString()}).`,
      { currentSolution: [] }
    );

    // Best-first priority queue (max-heap by bound)
    const queue: BBNode[] = [];
    const rootBound = this.calcUpperBound({ level: 0, value: 0, weight: 0, selected: [], bound: 0 }, txs, scenario);
    queue.push({ level: 0, value: 0, weight: 0, selected: [], bound: rootBound });

    this.emitEvent('BRANCH',
      `Root node created. Upper bound = ₹${rootBound.toFixed(0)}. Starting best-first search.`,
      { data: { bound: rootBound }, incumbent }
    );

    while (queue.length > 0) {
      // Pop node with highest bound
      queue.sort((a, b) => b.bound - a.bound);
      const node = queue.shift()!;
      this.metrics.statesExplored++;

      // Prune if bound is not better than incumbent
      if (node.bound <= incumbent) {
        this.metrics.prunings++;
        this.emitEvent('PRUNE',
          `Branch pruned. This node's upper bound ₹${node.bound.toFixed(0)} ≤ incumbent ₹${incumbent.toLocaleString()}. ` +
          `No better solution can come from this branch.`,
          { bound: node.bound, incumbent, currentSolution: [...bestSelected] }
        );
        continue;
      }

      // Leaf node
      if (node.level === txs.length) {
        const feasibility = this.isFeasible(node.selected, txMap, scenario);
        if (feasibility.ok && node.value > incumbent) {
          incumbent = node.value;
          bestSelected = [...node.selected];
          this.emitEvent('BEST_UPDATE',
            `New optimal found at leaf: [${bestSelected.join(', ')}] → ₹${incumbent.toLocaleString()}.`,
            { incumbent, currentSolution: [...bestSelected] }
          );
        }
        continue;
      }

      const tx = txs[node.level];

      // ── INCLUDE branch ──────────────────────────────────────────────────────
      const includeWeight = node.weight + tx.cost;
      if (includeWeight <= scenario.capacity) {
        const includeValue = node.value + this.getItemValue(tx, scenario);
        const includeSelected = [...node.selected, tx.id];
        const includeBound = this.calcUpperBound(
          { level: node.level + 1, value: includeValue, weight: includeWeight, selected: includeSelected, bound: 0 },
          txs, scenario
        );

        this.emitEvent('BRANCH',
          `Level ${node.level}: INCLUDE ${tx.id}. Value becomes ₹${includeValue.toFixed(0)}, ` +
          `weight ${includeWeight}/${scenario.capacity}. Upper bound = ₹${includeBound.toFixed(0)}.`,
          { entity: tx.id, bound: includeBound, incumbent, highlight: includeSelected, currentSolution: [...bestSelected] }
        );

        if (includeBound > incumbent) {
          if (includeValue > incumbent) {
            incumbent = includeValue;
            bestSelected = [...includeSelected];
            this.metrics.selections++;
            this.emitEvent('BEST_UPDATE',
              `Incumbent updated to ₹${incumbent.toLocaleString()} — [${bestSelected.join(', ')}].`,
              { incumbent, currentSolution: [...bestSelected] }
            );
          }
          queue.push({ level: node.level + 1, value: includeValue, weight: includeWeight, selected: includeSelected, bound: includeBound });
        } else {
          this.metrics.prunings++;
          this.emitEvent('PRUNE',
            `INCLUDE ${tx.id} branch pruned immediately — bound ₹${includeBound.toFixed(0)} ≤ incumbent ₹${incumbent.toLocaleString()}.`,
            { bound: includeBound, incumbent, entity: tx.id }
          );
        }
      }

      // ── EXCLUDE branch ──────────────────────────────────────────────────────
      const excludeBound = this.calcUpperBound(
        { level: node.level + 1, value: node.value, weight: node.weight, selected: node.selected, bound: 0 },
        txs, scenario
      );

      this.emitEvent('BRANCH',
        `Level ${node.level}: EXCLUDE ${tx.id}. Upper bound = ₹${excludeBound.toFixed(0)}.`,
        { entity: tx.id, bound: excludeBound, incumbent, currentSolution: [...bestSelected] }
      );

      if (excludeBound > incumbent) {
        queue.push({ level: node.level + 1, value: node.value, weight: node.weight, selected: node.selected, bound: excludeBound });
      } else {
        this.metrics.prunings++;
        this.emitEvent('PRUNE',
          `EXCLUDE ${tx.id} branch pruned — bound ₹${excludeBound.toFixed(0)} ≤ incumbent ₹${incumbent.toLocaleString()}.`,
          { bound: excludeBound, incumbent, entity: tx.id }
        );
      }
    }

    this.emitEvent('COMPLETE',
      `Branch & Bound complete. Explored ${this.metrics.statesExplored} nodes, pruned ${this.metrics.prunings} branches. ` +
      `Optimal: [${bestSelected.join(', ')}] → ₹${incumbent.toLocaleString()}.`,
      { incumbent, currentSolution: [...bestSelected] }
    );

    return this.buildResult('branch-and-bound', bestSelected, txMap, scenario, start);
  }
}
