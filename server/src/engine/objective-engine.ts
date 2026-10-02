import type { Transaction } from '@bank-opt/shared';

export function calculateObjective(selected: string[], transactions: Transaction[], objective: any): number {
  return 0;
}

export function calculateComposite(selected: string[], transactions: Transaction[], weights: any): number {
  return 0;
}

export function scoreTransaction(tx: Transaction, objective: any): number {
  return tx.value;
}
