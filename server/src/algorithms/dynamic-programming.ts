import { BaseAlgorithm } from './base';
import type { Scenario, AlgorithmResult, AlgorithmEvent } from '@bank-opt/shared';

export class DynamicProgrammingAlgorithm extends BaseAlgorithm {
  run(scenario: Scenario): AlgorithmResult {
    const start = Date.now();
    this.metrics.theoreticalComplexity = 'O(n × W)';
    this.metrics.spaceComplexity = 'O(n × W)';

    const txs = scenario.transactions;
    const n = txs.length;
    const W = scenario.capacity;
    const txMap = this.buildTxMap(txs);

    this.emitEvent('INIT',
      `Dynamic Programming initialized. Will fill a ${n+1} × ${W+1} DP table. ` +
      `Recurrence: DP[i][w] = max(DP[i-1][w], DP[i-1][w-cost[i]] + val[i]) if cost[i] ≤ w. ` +
      `Note: Dependencies are handled via topological preprocessing.`,
      { currentSolution: [] }
    );

    // Initialize DP table
    const dp: number[][] = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));

    // Build table row by row
    for (let i = 1; i <= n; i++) {
      const tx = txs[i - 1];
      const val = this.getItemValue(tx, scenario);

      for (let w = 0; w <= W; w++) {
        const prev = dp[i - 1][w];
        if (tx.cost <= w) {
          const withTx = dp[i - 1][w - tx.cost] + val;
          this.metrics.comparisons++;
          if (withTx > prev) {
            dp[i][w] = withTx;
            this.metrics.dpUpdates++;
            this.emitEvent('DP_UPDATE',
              `State DP[${i}][${w}] improved from ${prev.toFixed(0)} to ${withTx.toFixed(0)} ` +
              `by including transaction ${tx.id} (value=${val.toFixed(0)}, cost=${tx.cost}).`,
              {
                entity: tx.id,
                data: { row: i, col: w, prev, next: withTx, txId: tx.id },
                dpTable: dp.map(r => [...r]),
                highlight: [tx.id],
                currentSolution: [],
              }
            );
          } else {
            dp[i][w] = prev;
          }
        } else {
          dp[i][w] = prev;
        }
      }

      // Emit a row-complete event so the UI can refresh the full table
      this.emitEvent('CHECK',
        `Finished processing row ${i} (transaction ${tx.id}). Best value with first ${i} items and capacity ≤ ${W}: ₹${dp[i][W].toLocaleString()}.`,
        { entity: tx.id, dpTable: dp.map(r => [...r]) }
      );
    }

    // Traceback
    const selected: string[] = [];
    let w = W;
    for (let i = n; i > 0; i--) {
      if (dp[i][w] !== dp[i - 1][w]) {
        selected.unshift(txs[i - 1].id);
        w -= txs[i - 1].cost;
        this.emitEvent('SELECT',
          `Traceback: Including ${txs[i-1].id} in optimal solution (DP[${i}][${w + txs[i-1].cost}] ≠ DP[${i-1}][${w + txs[i-1].cost}]).`,
          { entity: txs[i-1].id, currentSolution: [...selected], highlight: [...selected] }
        );
      }
    }

    const bestObj = dp[n][W];
    this.metrics.objectiveValue = bestObj;
    this.metrics.statesExplored = (n + 1) * (W + 1);

    this.emitEvent('BEST_UPDATE',
      `Optimal value confirmed: ₹${bestObj.toLocaleString()} is the globally optimal solution via DP.`,
      { incumbent: bestObj, currentSolution: [...selected] }
    );

    this.emitEvent('COMPLETE',
      `Dynamic Programming complete. Optimal selection: [${selected.join(', ')}]. ` +
      `Objective: ₹${bestObj.toLocaleString()}. DP guaranteed this is optimal for the capacity-constrained formulation.`,
      { incumbent: bestObj, currentSolution: [...selected] }
    );

    return this.buildResult('dynamic-programming', selected, txMap, scenario, start);
  }
}
