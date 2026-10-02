import { BaseAlgorithm } from './base';
import type { Scenario, AlgorithmResult } from '@bank-opt/shared';

export class DFSAlgorithm extends BaseAlgorithm {
  private visited = new Set<string>();
  private visitOrder: string[] = [];
  private stack: string[] = [];
  private txMap: ReturnType<typeof this.buildTxMap> = new Map();

  run(scenario: Scenario, options?: Record<string, unknown>): AlgorithmResult {
    const start = Date.now();
    this.metrics.theoreticalComplexity = 'O(V + E)';
    this.metrics.spaceComplexity = 'O(V) recursion stack';

    const txs = scenario.transactions;
    this.txMap = this.buildTxMap(txs);
    const sourceId = (options?.bfsBfsSource as string) || txs[0]?.id;

    // Build adjacency list
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
      `DFS initialized. Source: ${sourceId}. ` +
      `Will explore as deep as possible before backtracking. ` +
      `Graph: ${txs.length} nodes, ${txs.reduce((s, t) => s + t.dependencies.length + t.conflicts.length, 0)} edges.`,
      { stackState: [], queueState: [] }
    );

    this.dfs(sourceId, adj, null);

    // Visit disconnected nodes
    for (const tx of txs) {
      if (!this.visited.has(tx.id)) {
        this.emitEvent('CHECK',
          `${tx.id} is disconnected from main component. Starting new DFS tree.`,
          { entity: tx.id }
        );
        this.dfs(tx.id, adj, null);
      }
    }

    this.emitEvent('COMPLETE',
      `DFS complete. Visited ${this.visitOrder.length} node(s): [${this.visitOrder.join(' → ')}]. ` +
      `Total backtracks: ${this.metrics.backtracks}.`,
      { currentSolution: [...this.visitOrder] }
    );

    return this.buildResult('dfs', this.visitOrder, this.txMap, scenario, start);
  }

  private dfs(nodeId: string, adj: Map<string, string[]>, parent: string | null): void {
    this.visited.add(nodeId);
    this.stack.push(nodeId);
    this.visitOrder.push(nodeId);
    this.metrics.statesExplored++;

    const tx = this.txMap.get(nodeId);

    this.emitEvent('STACK_PUSH',
      `Pushed ${nodeId} onto DFS stack. Stack: [${this.stack.join(', ')}].`,
      { entity: nodeId, stackState: [...this.stack], graphEdge: parent ? [parent, nodeId] : undefined }
    );

    this.emitEvent('VISIT',
      `Visiting ${nodeId}. ` +
      `value=₹${tx?.value?.toLocaleString()}, priority=${tx?.priority}, deps=[${tx?.dependencies.join(', ') || 'none'}].`,
      { entity: nodeId, highlight: [...this.stack], currentSolution: [...this.visitOrder] }
    );

    const neighbors = adj.get(nodeId) ?? [];
    for (const neighbor of neighbors) {
      this.metrics.comparisons++;
      if (!this.visited.has(neighbor)) {
        this.dfs(neighbor, adj, nodeId);
      } else {
        this.emitEvent('CHECK',
          `${neighbor} already visited — not recursing (${neighbor === parent ? 'parent edge' : 'back edge'}).`,
          { entity: neighbor, graphEdge: [nodeId, neighbor] }
        );
      }
    }

    // Backtrack
    this.stack.pop();
    this.metrics.backtracks++;
    this.emitEvent('STACK_POP',
      `Backtracking from ${nodeId}. Popped from stack. Stack: [${this.stack.join(', ')}].`,
      { entity: nodeId, stackState: [...this.stack] }
    );
  }
}
