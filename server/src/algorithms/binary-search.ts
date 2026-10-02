import { BaseAlgorithm } from './base';
import type { Scenario, AlgorithmResult } from '@bank-opt/shared';

type SortKey = 'value' | 'priority' | 'cost' | 'risk';

export class BinarySearchAlgorithm extends BaseAlgorithm {
  run(scenario: Scenario, options?: Record<string, unknown>): AlgorithmResult {
    const start = Date.now();
    this.metrics.theoreticalComplexity = 'O(log n) search + O(n log n) pre-sort';
    this.metrics.spaceComplexity = 'O(1)';

    const key = (options?.searchKey as SortKey) || 'value';
    const target = (options?.searchTarget as number) ?? (scenario.transactions[0]?.[key] ?? 0);
    const txMap = this.buildTxMap(scenario.transactions);

    // Sort first
    const sorted = [...scenario.transactions].sort((a, b) => a[key] - b[key]);

    this.emitEvent('INIT',
      `Binary Search initialized. Array sorted by ${key} ascending. ` +
      `Searching for ${key} = ${target}. Array: [${sorted.map(t => `${t.id}(${t[key]})`).join(', ')}].`,
      { arrayState: sorted.map(t => ({ id: t.id, val: t[key], key })) }
    );

    let low = 0, high = sorted.length - 1;
    let foundId: string | null = null;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midVal = sorted[mid][key];
      this.metrics.comparisons++;

      this.emitEvent('COMPARE',
        `Step ${this.metrics.comparisons}: low=${low}(${sorted[low]?.id}), mid=${mid}(${sorted[mid].id}=${midVal}), high=${high}(${sorted[high]?.id}). ` +
        `Target=${target}. ${midVal === target ? 'FOUND!' : midVal < target ? 'Search RIGHT half.' : 'Search LEFT half.'}`,
        {
          arrayState: sorted.map((t, i) => ({ id: t.id, val: t[key], status: i === low ? 'low' : i === mid ? 'mid' : i === high ? 'high' : 'normal' })),
          data: { low, mid, high, midVal, target }
        }
      );

      if (midVal === target) {
        foundId = sorted[mid].id;
        this.emitEvent('FOUND',
          `Found! ${sorted[mid].id} has ${key} = ${target} at index ${mid}. ` +
          `Binary search required only ${this.metrics.comparisons} comparison(s) vs O(n)=${sorted.length} for linear search.`,
          { entity: foundId, highlight: [foundId], currentSolution: [foundId] }
        );
        break;
      } else if (midVal < target) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    if (!foundId) {
      this.emitEvent('NOT_FOUND',
        `Target ${key}=${target} not found in the transaction array after ${this.metrics.comparisons} comparisons. ` +
        `Search space exhausted (low=${low} > high=${high}).`,
        { data: { target, key } }
      );
    }

    this.emitEvent('COMPLETE',
      `Binary Search complete in ${this.metrics.comparisons} comparison(s) — O(log ${sorted.length}) = O(log n). ` +
      `Result: ${foundId ? `Found ${foundId}` : 'Not found'}.`,
      { currentSolution: foundId ? [foundId] : [] }
    );

    return this.buildResult('binary-search', foundId ? [foundId] : [], txMap, scenario, start);
  }
}
