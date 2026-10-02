import { BaseAlgorithm } from './base';
import type { Scenario, AlgorithmResult } from '@bank-opt/shared';

export class BacktrackingAlgorithm extends BaseAlgorithm {
  private txs: ReturnType<typeof this.buildTxMap> = new Map();
  private scenario!: Scenario;
  private bestSelected: string[] = [];
  private bestObj: number = -Infinity;

  run(scenario: Scenario): AlgorithmResult {
    const start = Date.now();
    this.metrics.theoreticalComplexity = 'O(2ⁿ) worst case, typically much better';
    this.metrics.spaceComplexity = 'O(n) recursion stack';
    this.scenario = scenario;
    this.txs = this.buildTxMap(scenario.transactions);

    this.emitEvent('INIT',
      `Backtracking initialized. Will recursively explore include/exclude decisions for ${scenario.transactions.length} transactions. ` +
      `Constraint violations prune branches before full exploration. Capacity: ${scenario.capacity} units.`,
      { currentSolution: [] }
    );

    this.backtrack(0, [], 0);

    if (this.bestObj < 0) this.bestSelected = [];

    this.emitEvent('COMPLETE',
      `Backtracking complete. Explored ${this.metrics.statesExplored} states with ${this.metrics.backtracks} backtracks. ` +
      `Optimal solution: [${this.bestSelected.join(', ')}]. Objective: ₹${Math.max(this.bestObj, 0).toLocaleString()}.`,
      { incumbent: Math.max(this.bestObj, 0), currentSolution: [...this.bestSelected] }
    );

    return this.buildResult('backtracking', this.bestSelected, this.txs, scenario, start);
  }

  private backtrack(index: number, current: string[], capacityUsed: number): void {
    this.metrics.statesExplored++;

    if (index === this.scenario.transactions.length) {
      const feasibility = this.isFeasible(current, this.txs, this.scenario);
      if (feasibility.ok) {
        const obj = this.calcObjective(current, this.txs, this.scenario);
        if (obj > this.bestObj) {
          this.bestObj = obj;
          this.bestSelected = [...current];
          this.emitEvent('BEST_UPDATE',
            `New best found at leaf node: [${current.join(', ')}] → ₹${obj.toLocaleString()}.`,
            { incumbent: obj, currentSolution: [...current] }
          );
        }
      }
      return;
    }

    const tx = this.scenario.transactions[index];
    const depth = index;

    // ── INCLUDE branch ────────────────────────────────────────────────────────
    const withTx = [...current, tx.id];
    const newCap = capacityUsed + tx.cost;

    this.emitEvent('BRANCH',
      `Depth ${depth}: Considering INCLUDE ${tx.id} (cost=${tx.cost}). Capacity would be ${newCap}/${this.scenario.capacity}.`,
      { entity: tx.id, highlight: [...withTx], currentSolution: [...current] }
    );

    if (newCap > this.scenario.capacity) {
      this.metrics.rejections++;
      this.emitEvent('REJECT',
        `${tx.id} EXCLUDED from branch — adding it exceeds remaining capacity (${newCap} > ${this.scenario.capacity}).`,
        { entity: tx.id, reason: 'capacity_exceeded', currentSolution: [...current] }
      );
    } else {
      const deps = this.checkDependencies(withTx, this.txs);
      const confs = this.checkConflicts(withTx, this.txs);

      if (!deps.ok) {
        this.emitEvent('CHECK',
          `Dependency check for including ${tx.id}: PENDING (${deps.missing.join('; ')}). Proceeding — may be satisfied later.`,
          { entity: tx.id, currentSolution: [...current] }
        );
      }

      if (!confs.ok) {
        this.metrics.rejections++;
        this.emitEvent('REJECT',
          `${tx.id} cannot be included — conflicts with already selected: ${confs.pairs.join('; ')}.`,
          { entity: tx.id, reason: 'conflict', currentSolution: [...current] }
        );
      } else {
        this.backtrack(index + 1, withTx, newCap);
        // After returning from recursion
        this.metrics.backtracks++;
        this.emitEvent('BACKTRACK',
          `Returning from INCLUDE ${tx.id} branch at depth ${depth}. Backtracking to try EXCLUDE option.`,
          { entity: tx.id, currentSolution: [...current] }
        );
      }
    }

    // ── EXCLUDE branch ────────────────────────────────────────────────────────
    this.emitEvent('BRANCH',
      `Depth ${depth}: Considering EXCLUDE ${tx.id}. Continuing without it.`,
      { entity: tx.id, highlight: [...current], currentSolution: [...current] }
    );
    this.backtrack(index + 1, current, capacityUsed);
    this.metrics.backtracks++;
    this.emitEvent('BACKTRACK',
      `Returning from EXCLUDE ${tx.id} branch at depth ${depth}.`,
      { entity: tx.id, currentSolution: [...current] }
    );
  }
}
