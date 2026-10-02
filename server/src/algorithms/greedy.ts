import { BaseAlgorithm } from './base';
import type { Scenario, AlgorithmResult, Transaction } from '@bank-opt/shared';

type GreedyKey = 'value_cost' | 'priority_cost' | 'value' | 'priority' | 'composite';

export class GreedyAlgorithm extends BaseAlgorithm {
  private scoreKey(tx: Transaction, key: GreedyKey, scenario: Scenario): number {
    switch (key) {
      case 'value_cost':    return tx.cost > 0 ? tx.value / tx.cost : tx.value;
      case 'priority_cost': return tx.cost > 0 ? tx.priority / tx.cost : tx.priority;
      case 'value':         return tx.value;
      case 'priority':      return tx.priority;
      case 'composite':     return this.getItemValue(tx, scenario);
      default:              return tx.value / tx.cost;
    }
  }

  run(scenario: Scenario, options?: Record<string, unknown>): AlgorithmResult {
    const start = Date.now();
    this.metrics.theoreticalComplexity = 'O(n log n)';
    this.metrics.spaceComplexity = 'O(n)';

    const key: GreedyKey = (options?.greedyKey as GreedyKey) || 'value_cost';
    const txMap = this.buildTxMap(scenario.transactions);
    const selected: string[] = [];
    let capacityUsed = 0;

    this.emitEvent('INIT',
      `Greedy algorithm initialized. Strategy: ${key.replace('_', '/')} ratio. ` +
      `Capacity: ${scenario.capacity} units. Evaluating ${scenario.transactions.length} transactions.`,
      { currentSolution: [] }
    );

    // Score and sort all candidates
    const scored = scenario.transactions.map(tx => ({
      tx,
      score: this.scoreKey(tx, key, scenario),
    })).sort((a, b) => b.score - a.score);

    for (const { tx, score } of scored) {
      this.metrics.comparisons++;

      // Emit compare event for this candidate
      this.emitEvent('COMPARE',
        `Evaluating ${tx.id} (${key.replace('_', '/')} score = ${score.toFixed(2)}). ` +
        `Currently at ${capacityUsed}/${scenario.capacity} capacity.`,
        { entity: tx.id, highlight: [tx.id], currentSolution: [...selected] }
      );

      // Check capacity
      if (capacityUsed + tx.cost > scenario.capacity) {
        this.metrics.rejections++;
        this.emitEvent('REJECT',
          `${tx.id} rejected — adding it would use ${capacityUsed + tx.cost} units, exceeding capacity of ${scenario.capacity}.`,
          { entity: tx.id, reason: 'capacity_exceeded', currentSolution: [...selected] }
        );
        continue;
      }

      // Check dependencies
      const deps = this.checkDependencies([...selected, tx.id], txMap);
      if (!deps.ok) {
        this.metrics.rejections++;
        this.emitEvent('REJECT',
          `${tx.id} rejected — dependency not yet satisfied: ${deps.missing.join('; ')}.`,
          { entity: tx.id, reason: 'dependency_not_met', currentSolution: [...selected] }
        );
        continue;
      }

      // Check conflicts
      const confs = this.checkConflicts([...selected, tx.id], txMap);
      if (!confs.ok) {
        this.metrics.rejections++;
        this.emitEvent('REJECT',
          `${tx.id} rejected — conflict with already selected transaction: ${confs.pairs.join('; ')}.`,
          { entity: tx.id, reason: 'conflict', currentSolution: [...selected] }
        );
        continue;
      }

      // Select
      selected.push(tx.id);
      capacityUsed += tx.cost;
      this.metrics.selections++;
      const obj = this.calcObjective(selected, txMap, scenario);

      this.emitEvent('SELECT',
        `${tx.id} selected! Its ${key.replace('_', '/')} ratio of ${score.toFixed(2)} is the highest among feasible candidates. ` +
        `Capacity used: ${capacityUsed}/${scenario.capacity}. Running objective: ₹${obj.toLocaleString()}.`,
        { entity: tx.id, highlight: [...selected], currentSolution: [...selected], incumbent: obj }
      );

      this.emitEvent('BEST_UPDATE',
        `Current best objective value updated to ₹${obj.toLocaleString()} with ${selected.length} transaction(s) selected.`,
        { incumbent: obj, currentSolution: [...selected] }
      );
    }

    const finalObj = this.calcObjective(selected, txMap, scenario);
    this.metrics.objectiveValue = finalObj;
    this.metrics.statesExplored = scenario.transactions.length;

    this.emitEvent('COMPLETE',
      `Greedy algorithm finished. Selected ${selected.length} transactions: [${selected.join(', ')}]. ` +
      `Final objective: ₹${finalObj.toLocaleString()}. Capacity used: ${capacityUsed}/${scenario.capacity}. ` +
      `Note: Greedy local choices may not equal the global optimum.`,
      { incumbent: finalObj, currentSolution: [...selected] }
    );

    return this.buildResult('greedy', selected, txMap, scenario, start);
  }
}
