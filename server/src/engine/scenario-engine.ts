import type { Scenario, ValidationResult, DependencyGraph, Transaction } from '@bank-opt/shared';

export function generateScenario(options: any): Scenario {
  return {} as Scenario;
}

export function validateScenario(scenario: Scenario): ValidationResult {
  return { valid: true, errors: [], warnings: [] };
}

export function buildDependencyGraph(scenario: Scenario): DependencyGraph {
  return { nodes: [], edges: [] };
}

export function detectCycles(transactions: Transaction[]): boolean {
  return false;
}

export function freezeScenario(scenario: Scenario): Scenario {
  return JSON.parse(JSON.stringify(scenario));
}
