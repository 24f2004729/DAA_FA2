import { Scenario, Transaction, DependencyGraph } from '@bank-opt/shared';

export const buildDependencyGraph = (scenario: Scenario): DependencyGraph => {
  const nodes = scenario.transactions.map(t => ({ id: t.id, label: t.label }));
  const edges: any[] = [];
  scenario.transactions.forEach(t => {
    t.dependencies.forEach(d => edges.push({ source: d, target: t.id, type: 'dependency' }));
    t.conflicts.forEach(c => edges.push({ source: t.id, target: c, type: 'conflict' }));
  });
  return { nodes, edges };
};

export const getTransactionById = (id: string, transactions: Transaction[]): Transaction | undefined => {
  return transactions.find(t => t.id === id);
};

export const calcObjectiveValue = (selected: string[], transactions: Transaction[], objective: any): number => {
  // Simplified objective calculation
  return selected.reduce((sum, id) => {
    const t = getTransactionById(id, transactions);
    return sum + (t ? t.value : 0);
  }, 0);
};
