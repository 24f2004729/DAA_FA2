import type {
  AlgorithmEvent, AlgorithmMetrics, AlgorithmEventType,
  Scenario, Transaction, AlgorithmResult, ObjectiveWeights
} from '@bank-opt/shared';

export abstract class BaseAlgorithm {
  protected events: AlgorithmEvent[] = [];
  protected metrics: AlgorithmMetrics = {
    operationCount: 0, comparisons: 0, selections: 0, rejections: 0,
    backtracks: 0, prunings: 0, dpUpdates: 0, statesExplored: 0,
    objectiveValue: 0, capacityUsed: 0, priorityScore: 0, riskScore: 0,
    selectedTransactions: [], feasible: false, elapsedMs: 0,
    theoreticalComplexity: '', spaceComplexity: ''
  };
  protected stepCount: number = 0;

  protected emitEvent(
    type: AlgorithmEventType,
    explanation: string,
    extra?: Partial<AlgorithmEvent>
  ): void {
    this.metrics.operationCount++;
    this.events.push({
      type,
      step: ++this.stepCount,
      timestamp: Date.now(),
      explanation,
      metrics: { ...this.metrics },
      ...extra,
    });
  }

  abstract run(scenario: Scenario, options?: Record<string, unknown>): AlgorithmResult;

  protected buildTxMap(transactions: Transaction[]): Map<string, Transaction> {
    const map = new Map<string, Transaction>();
    for (const tx of transactions) map.set(tx.id, tx);
    return map;
  }

  protected getItemValue(tx: Transaction, scenario: Scenario): number {
    const { mode, weights } = scenario.objective;
    if (mode === 'value') return tx.value;
    if (mode === 'priority') return tx.priority * 10000;
    if (mode === 'composite') {
      const w = weights as ObjectiveWeights;
      return w.alpha * tx.value + w.beta * tx.priority * 1000 - w.gamma * tx.risk * 500 - w.delta * tx.cost * 100;
    }
    // lexicographic: primary = priority, secondary = -cost
    return tx.priority * 10000000 - tx.cost;
  }

  protected calcObjective(selected: string[], txMap: Map<string, Transaction>, scenario: Scenario): number {
    return selected.reduce((sum, id) => {
      const tx = txMap.get(id);
      return tx ? sum + this.getItemValue(tx, scenario) : sum;
    }, 0);
  }

  protected calcCapacity(selected: string[], txMap: Map<string, Transaction>): number {
    return selected.reduce((sum, id) => {
      const tx = txMap.get(id);
      return tx ? sum + tx.cost : sum;
    }, 0);
  }

  protected checkDependencies(selected: string[], txMap: Map<string, Transaction>): { ok: boolean; missing: string[] } {
    const selectedSet = new Set(selected);
    const missing: string[] = [];
    for (const id of selected) {
      const tx = txMap.get(id);
      if (tx) {
        for (const dep of tx.dependencies) {
          if (!selectedSet.has(dep)) missing.push(`${id} needs ${dep}`);
        }
      }
    }
    return { ok: missing.length === 0, missing };
  }

  protected checkConflicts(selected: string[], txMap: Map<string, Transaction>): { ok: boolean; pairs: string[] } {
    const selectedSet = new Set(selected);
    const pairs: string[] = [];
    for (const id of selected) {
      const tx = txMap.get(id);
      if (tx) {
        for (const conf of tx.conflicts) {
          if (selectedSet.has(conf)) pairs.push(`${id} conflicts ${conf}`);
        }
      }
    }
    return { ok: pairs.length === 0, pairs };
  }

  protected isFeasible(
    selected: string[],
    txMap: Map<string, Transaction>,
    scenario: Scenario
  ): { ok: boolean; reason?: string } {
    const cap = this.calcCapacity(selected, txMap);
    if (cap > scenario.capacity) return { ok: false, reason: `capacity exceeded (${cap}/${scenario.capacity})` };
    const deps = this.checkDependencies(selected, txMap);
    if (!deps.ok) return { ok: false, reason: `unmet dependencies: ${deps.missing.join(', ')}` };
    const confs = this.checkConflicts(selected, txMap);
    if (!confs.ok) return { ok: false, reason: `conflicts: ${confs.pairs.join(', ')}` };
    return { ok: true };
  }

  protected buildResult(
    algorithmId: AlgorithmResult['algorithmId'],
    selected: string[],
    txMap: Map<string, Transaction>,
    scenario: Scenario,
    startTime: number
  ): AlgorithmResult {
    this.metrics.elapsedMs = Date.now() - startTime;
    this.metrics.selectedTransactions = selected;
    this.metrics.objectiveValue = this.calcObjective(selected, txMap, scenario);
    this.metrics.capacityUsed = this.calcCapacity(selected, txMap);
    this.metrics.feasible = this.isFeasible(selected, txMap, scenario).ok;
    this.metrics.priorityScore = selected.reduce((s, id) => s + (txMap.get(id)?.priority ?? 0), 0);
    this.metrics.riskScore = selected.reduce((s, id) => s + (txMap.get(id)?.risk ?? 0), 0);
    return {
      algorithmId,
      scenarioId: scenario.scenarioId,
      scenarioVersion: scenario.version,
      selectedTransactions: selected,
      objectiveValue: this.metrics.objectiveValue,
      capacityUsed: this.metrics.capacityUsed,
      feasible: this.metrics.feasible,
      metrics: { ...this.metrics },
      events: this.events,
    };
  }

  /** Topological sort — returns sorted IDs or throws on cycle */
  protected topoSort(transactions: Transaction[]): string[] {
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();
    const ids = transactions.map(t => t.id);
    for (const id of ids) { inDegree.set(id, 0); adj.set(id, []); }
    for (const tx of transactions) {
      for (const dep of tx.dependencies) {
        adj.get(dep)!.push(tx.id);
        inDegree.set(tx.id, (inDegree.get(tx.id) ?? 0) + 1);
      }
    }
    const queue = ids.filter(id => inDegree.get(id) === 0);
    const result: string[] = [];
    while (queue.length > 0) {
      const node = queue.shift()!;
      result.push(node);
      for (const neighbor of (adj.get(node) ?? [])) {
        const deg = (inDegree.get(neighbor) ?? 1) - 1;
        inDegree.set(neighbor, deg);
        if (deg === 0) queue.push(neighbor);
      }
    }
    return result; // if result.length < ids.length, there's a cycle — ignore cycled nodes
  }
}
