import { BaseAlgorithm } from './base';
import type { Scenario, AlgorithmResult, Transaction } from '@bank-opt/shared';

type SortKey = 'value' | 'priority' | 'cost' | 'risk' | 'score_cost';

export class QuickSortAlgorithm extends BaseAlgorithm {
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
    this.metrics.theoreticalComplexity = 'O(n log n) average, O(n²) worst';
    this.metrics.spaceComplexity = 'O(log n) stack';
    this.scenario = scenario;
    this.key = (options?.sortKey as SortKey) || 'value';
    this.order = (options?.sortOrder as 'asc' | 'desc') || 'desc';
    this.arr = [...scenario.transactions];
    const txMap = this.buildTxMap(scenario.transactions);

    this.emitEvent('INIT',
      `Quick Sort initialized. Sorting ${this.arr.length} transactions by ${this.key} (${this.order}ending). ` +
      `Uses last element as pivot. Average O(n log n).`,
      { arrayState: this.arr.map(t => ({ id: t.id, val: this.getKeyVal(t) })) }
    );

    this.quickSort(0, this.arr.length - 1);

    this.emitEvent('COMPLETE',
      `Quick Sort complete. Final order: [${this.arr.map(t => `${t.id}(${this.getKeyVal(t)})`).join(', ')}]. ` +
      `Total comparisons: ${this.metrics.comparisons}, swaps: ${this.metrics.selections}.`,
      { arrayState: this.arr.map(t => ({ id: t.id, val: this.getKeyVal(t) })), currentSolution: this.arr.map(t => t.id) }
    );

    return this.buildResult('quick-sort', this.arr.map(t => t.id), txMap, scenario, start);
  }

  private quickSort(low: number, high: number): void {
    if (low >= high) return;

    const pivotIdx = this.partition(low, high);
    this.quickSort(low, pivotIdx - 1);
    this.quickSort(pivotIdx + 1, high);
  }

  private partition(low: number, high: number): number {
    const pivot = this.arr[high];
    const pivotVal = this.getKeyVal(pivot);

    this.emitEvent('PARTITION',
      `Partitioning [${this.arr.slice(low, high + 1).map(t => t.id).join(', ')}]. ` +
      `Pivot: ${pivot.id} (${this.key}=${pivotVal}).`,
      { entity: pivot.id, arrayState: this.arr.map(t => ({ id: t.id, val: this.getKeyVal(t) })), data: { low, high, pivotId: pivot.id } }
    );

    let i = low - 1;

    for (let j = low; j < high; j++) {
      this.metrics.comparisons++;
      const jVal = this.getKeyVal(this.arr[j]);
      const shouldSwap = this.order === 'desc' ? jVal >= pivotVal : jVal <= pivotVal;

      this.emitEvent('COMPARE',
        `Comparing ${this.arr[j].id} (${this.key}=${jVal}) with pivot ${pivot.id} (${this.key}=${pivotVal}). ` +
        `${shouldSwap ? 'Goes left of pivot.' : 'Stays right of pivot.'}`,
        { entity: [this.arr[j].id, pivot.id] }
      );

      if (shouldSwap) {
        i++;
        [this.arr[i], this.arr[j]] = [this.arr[j], this.arr[i]];
        this.metrics.selections++;
        this.emitEvent('SWAP',
          `Swapped ${this.arr[j].id} and ${this.arr[i].id}.`,
          { entity: [this.arr[i].id, this.arr[j].id], arrayState: this.arr.map(t => ({ id: t.id, val: this.getKeyVal(t) })) }
        );
      }
    }

    [this.arr[i + 1], this.arr[high]] = [this.arr[high], this.arr[i + 1]];
    const finalPivotIdx = i + 1;

    this.emitEvent('PARTITION',
      `Pivot ${pivot.id} placed at final position ${finalPivotIdx}. ` +
      `Left: [${this.arr.slice(low, finalPivotIdx).map(t => t.id).join(', ')}], Right: [${this.arr.slice(finalPivotIdx + 1, high + 1).map(t => t.id).join(', ')}].`,
      { arrayState: this.arr.map(t => ({ id: t.id, val: this.getKeyVal(t) })), data: { pivotIdx: finalPivotIdx } }
    );

    return finalPivotIdx;
  }
}
