import { BaseAlgorithm } from './base';
import type { Scenario, AlgorithmResult, Transaction } from '@bank-opt/shared';

type SortKey = 'value' | 'priority' | 'cost' | 'risk' | 'score_cost';

export class MergeSortAlgorithm extends BaseAlgorithm {
  private key: SortKey = 'value';
  private order: 'asc' | 'desc' = 'desc';
  private scenario!: Scenario;
  private arr: Transaction[] = [];

  private getKeyVal(tx: Transaction): number {
    switch (this.key) {
      case 'value':      return tx.value;
      case 'priority':   return tx.priority;
      case 'cost':       return tx.cost;
      case 'risk':       return tx.risk;
      case 'score_cost': return tx.cost > 0 ? this.getItemValue(tx, this.scenario) / tx.cost : 0;
    }
  }

  run(scenario: Scenario, options?: Record<string, unknown>): AlgorithmResult {
    const start = Date.now();
    this.metrics.theoreticalComplexity = 'O(n log n)';
    this.metrics.spaceComplexity = 'O(n)';
    this.scenario = scenario;
    this.key = (options?.sortKey as SortKey) || 'value';
    this.order = (options?.sortOrder as 'asc' | 'desc') || 'desc';
    this.arr = [...scenario.transactions];
    const txMap = this.buildTxMap(scenario.transactions);

    this.emitEvent('INIT',
      `Merge Sort initialized. Sorting ${this.arr.length} transactions by ${this.key} (${this.order}ending). ` +
      `Will recursively split and merge. Expected O(n log n) = O(${this.arr.length} × log(${this.arr.length}) ≈ ${Math.ceil(this.arr.length * Math.log2(this.arr.length + 1))} comparisons.`,
      { arrayState: this.arr.map(t => ({ id: t.id, val: this.getKeyVal(t) })) }
    );

    const sorted = this.mergeSort(this.arr, 0, this.arr.length - 1);
    this.arr = sorted;

    this.emitEvent('COMPLETE',
      `Merge Sort complete. Final order (${this.key} ${this.order}): [${sorted.map(t => `${t.id}(${this.getKeyVal(t)})`).join(', ')}]. ` +
      `Total comparisons: ${this.metrics.comparisons}.`,
      { arrayState: sorted.map(t => ({ id: t.id, val: this.getKeyVal(t) })), currentSolution: sorted.map(t => t.id) }
    );

    return this.buildResult('merge-sort', sorted.map(t => t.id), txMap, scenario, start);
  }

  private mergeSort(arr: Transaction[], left: number, right: number): Transaction[] {
    if (left >= right) return [arr[left]];

    const mid = Math.floor((left + right) / 2);

    this.emitEvent('SPLIT',
      `Splitting [${arr.slice(left, right + 1).map(t => t.id).join(', ')}] into ` +
      `[${arr.slice(left, mid + 1).map(t => t.id).join(', ')}] and [${arr.slice(mid + 1, right + 1).map(t => t.id).join(', ')}].`,
      { arrayState: arr.map(t => ({ id: t.id, val: this.getKeyVal(t) })), data: { left, mid, right } }
    );

    const leftSorted = this.mergeSort(arr, left, mid);
    const rightSorted = this.mergeSort(arr, mid + 1, right);

    return this.merge(leftSorted, rightSorted);
  }

  private merge(left: Transaction[], right: Transaction[]): Transaction[] {
    const result: Transaction[] = [];
    let i = 0, j = 0;

    while (i < left.length && j < right.length) {
      this.metrics.comparisons++;
      const lv = this.getKeyVal(left[i]);
      const rv = this.getKeyVal(right[j]);
      const lWins = this.order === 'desc' ? lv >= rv : lv <= rv;

      this.emitEvent('COMPARE',
        `Comparing ${left[i].id} (${this.key}=${lv}) vs ${right[j].id} (${this.key}=${rv}). ` +
        `${lWins ? left[i].id : right[j].id} goes first (${this.order}ending sort).`,
        { entity: [left[i].id, right[j].id] }
      );

      if (lWins) {
        result.push(left[i++]);
      } else {
        result.push(right[j++]);
      }
    }

    while (i < left.length) result.push(left[i++]);
    while (j < right.length) result.push(right[j++]);

    this.emitEvent('MERGE',
      `Merged into: [${result.map(t => t.id).join(', ')}].`,
      { arrayState: result.map(t => ({ id: t.id, val: this.getKeyVal(t) })) }
    );

    return result;
  }
}
