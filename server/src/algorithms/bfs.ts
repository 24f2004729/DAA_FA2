import { BaseAlgorithm } from './base';
import type { Scenario, AlgorithmResult } from '@bank-opt/shared';

export class BFSAlgorithm extends BaseAlgorithm {
  run(scenario: Scenario, options?: Record<string, unknown>): AlgorithmResult {
    const start = Date.now();
    this.metrics.theoreticalComplexity = 'O(V + E)';
    this.metrics.spaceComplexity = 'O(V)';

    const txs = scenario.transactions;
    const txMap = this.buildTxMap(txs);
    const sourceId = (options?.bfsBfsSource as string) || txs[0]?.id;

    // Build adjacency list (dependencies + conflicts as undirected for traversal)
    const adj = new Map<string, string[]>();
    for (const tx of txs) adj.set(tx.id, []);
    for (const tx of txs) {
      for (const dep of tx.dependencies) {
        adj.get(tx.id)!.push(dep);
        adj.get(dep)!.push(tx.id);
      }
      for (const conf of tx.conflicts) {
        adj.get(tx.id)!.push(conf);
        adj.get(conf)!.push(tx.id);
      }
    }

    this.emitEvent('INIT',
      `BFS initialized on dependency/conflict graph. Source: ${sourceId}. ` +
      `Graph has ${txs.length} nodes and ${txs.reduce((s, t) => s + t.dependencies.length + t.conflicts.length, 0)} edges. ` +
      `BFS explores all reachable transactions level by level.`,
      { queueState: [sourceId] }
    );

    const visited = new Set<string>();
    const queue: string[] = [sourceId];
    const visitOrder: string[] = [];
    const layerMap = new Map<string, number>();
    layerMap.set(sourceId, 0);

    visited.add(sourceId);

    this.emitEvent('QUEUE_PUSH',
      `Source ${sourceId} enqueued. Queue: [${queue.join(', ')}].`,
      { entity: sourceId, queueState: [...queue] }
    );

    while (queue.length > 0) {
      const current = queue.shift()!;
      const layer = layerMap.get(current) ?? 0;
      visitOrder.push(current);
      this.metrics.statesExplored++;

      this.emitEvent('QUEUE_POP',
        `Dequeued ${current} (layer ${layer}). Queue now: [${queue.join(', ')}].`,
        { entity: current, queueState: [...queue], highlight: [current] }
      );

      this.emitEvent('VISIT',
        `Visiting ${current} at BFS layer ${layer}. ` +
        `Transaction: value=₹${txMap.get(current)?.value?.toLocaleString()}, priority=${txMap.get(current)?.priority}.`,
        { entity: current, highlight: [current], currentSolution: [...visitOrder] }
      );

      const neighbors = adj.get(current) ?? [];
      for (const neighbor of neighbors) {
        this.metrics.comparisons++;
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          layerMap.set(neighbor, layer + 1);
          queue.push(neighbor);
          this.emitEvent('QUEUE_PUSH',
            `Discovered ${neighbor} (layer ${layer + 1}) via ${current}. Enqueued. Queue: [${queue.join(', ')}].`,
            { entity: neighbor, graphEdge: [current, neighbor], queueState: [...queue], highlight: [current, neighbor] }
          );
        } else {
          this.emitEvent('CHECK',
            `${neighbor} already visited — skipping.`,
            { entity: neighbor, graphEdge: [current, neighbor] }
          );
        }
      }
    }

    this.emitEvent('COMPLETE',
      `BFS complete. Visited ${visitOrder.length} node(s) in order: [${visitOrder.join(' → ')}]. ` +
      `${txs.length - visitOrder.length} disconnected node(s) not reachable from ${sourceId}.`,
      { currentSolution: [...visitOrder] }
    );

    return this.buildResult('bfs', visitOrder, txMap, scenario, start);
  }
}
