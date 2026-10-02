import { BaseAlgorithm } from './base';
import type { Scenario, AlgorithmResult } from '@bank-opt/shared';

export class BruteForceAlgorithm extends BaseAlgorithm {
  run(scenario: Scenario): AlgorithmResult {
    const start = Date.now();
    this.metrics.theoreticalComplexity = 'O(2ⁿ)';
    this.metrics.spaceComplexity = 'O(n)';

    const txs = scenario.transactions;
    const n = txs.length;
    const txMap = this.buildTxMap(txs);
    let bestSelected: string[] = [];
    let bestObj = -Infinity;

    this.emitEvent('INIT',
      `Brute Force initialized. Will enumerate all 2^${n} = ${Math.pow(2, n)} subsets of ${n} transactions. ` +
      `This is the exhaustive reference oracle.`,
      { currentSolution: [] }
    );

    const total = 1 << n;
    for (let mask = 0; mask < total; mask++) {
      this.metrics.statesExplored++;
      const candidate: string[] = [];
      for (let i = 0; i < n; i++) {
        if (mask & (1 << i)) candidate.push(txs[i].id);
      }

      const bitmask = mask.toString(2).padStart(n, '0');
      this.emitEvent('BRANCH',
        `Evaluating subset #${mask + 1}/${total}: [${candidate.join(', ') || '∅'}] — binary mask: ${bitmask}`,
        { entity: candidate, highlight: [...candidate], currentSolution: bestSelected.length ? [...bestSelected] : [] }
      );

      // Check capacity
      const cap = this.calcCapacity(candidate, txMap);
      this.emitEvent('CHECK',
        `Capacity check for [${candidate.join(', ') || '∅'}]: ${cap} units used of ${scenario.capacity} available. ` +
        `${cap <= scenario.capacity ? 'PASS ✓' : 'FAIL ✗'}`,
        { entity: candidate }
      );
      if (cap > scenario.capacity) {
        this.metrics.rejections++;
        this.emitEvent('REJECT',
          `Subset [${candidate.join(', ')}] rejected — capacity ${cap} exceeds limit ${scenario.capacity}.`,
          { entity: candidate, reason: 'capacity_exceeded' }
        );
        continue;
      }

      // Check dependencies
      const deps = this.checkDependencies(candidate, txMap);
      if (!deps.ok) {
        this.metrics.rejections++;
        this.emitEvent('REJECT',
          `Subset [${candidate.join(', ')}] rejected — unmet dependencies: ${deps.missing.join('; ')}.`,
          { entity: candidate, reason: 'dependency_not_met' }
        );
        continue;
      }

      // Check conflicts
      const confs = this.checkConflicts(candidate, txMap);
      if (!confs.ok) {
        this.metrics.rejections++;
        this.emitEvent('REJECT',
          `Subset [${candidate.join(', ')}] rejected — conflict pairs: ${confs.pairs.join('; ')}.`,
          { entity: candidate, reason: 'conflict' }
        );
        continue;
      }

      // Feasible — calculate objective
      const obj = this.calcObjective(candidate, txMap, scenario);
      this.metrics.comparisons++;

      if (obj > bestObj) {
        bestObj = obj;
        bestSelected = [...candidate];
        this.metrics.selections++;
        this.emitEvent('BEST_UPDATE',
          `New best solution found! [${bestSelected.join(', ')}] — objective ₹${bestObj.toLocaleString()} > previous best ₹${bestObj === obj ? 0 : bestObj}.`,
          { incumbent: bestObj, currentSolution: [...bestSelected] }
        );
      }
    }

    this.emitEvent('COMPLETE',
      `Brute Force exhausted all ${total} subsets. Optimal solution: [${bestSelected.join(', ')}] ` +
      `with objective ₹${bestObj <= 0 ? 0 : bestObj.toLocaleString()}. This result is the guaranteed global optimum.`,
      { incumbent: Math.max(bestObj, 0), currentSolution: [...bestSelected] }
    );

    if (bestObj < 0) bestSelected = [];
    return this.buildResult('brute-force', bestSelected, txMap, scenario, start);
  }
}
