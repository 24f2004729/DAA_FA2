import type { Transaction, ValidationResult, Scenario } from '@bank-opt/shared';

export function checkCapacity(selected: string[], transactions: Transaction[], capacity: number): boolean {
  let sum = 0;
  for (const id of selected) {
    const t = transactions.find(tx => tx.id === id);
    if (t) sum += t.cost;
  }
  return sum <= capacity;
}

export function checkDependencies(selected: string[], transactions: Transaction[]): { satisfied: boolean; missing: string[] } {
  return { satisfied: true, missing: [] };
}

export function checkConflicts(selected: string[], transactions: Transaction[]): { satisfied: boolean; conflicts: [string,string][] } {
  return { satisfied: true, conflicts: [] };
}

export function checkRisk(selected: string[], transactions: Transaction[], threshold: number): { satisfied: boolean; violations: string[] } {
  return { satisfied: true, violations: [] };
}

export function checkFeasibility(selected: string[], transactions: Transaction[], scenario: Scenario): ValidationResult {
  return { valid: true, errors: [], warnings: [] };
}
