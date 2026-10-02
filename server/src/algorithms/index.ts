import type { AlgorithmId, RunAlgorithmRequest, AlgorithmResult } from '@bank-opt/shared';
import { BruteForceAlgorithm } from './brute-force';
import { GreedyAlgorithm } from './greedy';
import { DynamicProgrammingAlgorithm } from './dynamic-programming';
import { BacktrackingAlgorithm } from './backtracking';
import { BranchAndBoundAlgorithm } from './branch-and-bound';
import { MergeSortAlgorithm } from './merge-sort';
import { QuickSortAlgorithm } from './quick-sort';
import { BinarySearchAlgorithm } from './binary-search';
import { BFSAlgorithm } from './bfs';
import { DFSAlgorithm } from './dfs';
import { ALGORITHM_META, getAlgorithmMeta, getAlgorithmsByCategory } from './registry';

export {
  BruteForceAlgorithm,
  GreedyAlgorithm,
  DynamicProgrammingAlgorithm,
  BacktrackingAlgorithm,
  BranchAndBoundAlgorithm,
  MergeSortAlgorithm,
  QuickSortAlgorithm,
  BinarySearchAlgorithm,
  BFSAlgorithm,
  DFSAlgorithm,
  ALGORITHM_META,
  getAlgorithmMeta,
  getAlgorithmsByCategory,
};

export function runAlgorithm(req: RunAlgorithmRequest): AlgorithmResult {
  const { algorithmId, scenario, options = {} } = req;

  switch (algorithmId as AlgorithmId) {
    case 'brute-force':          return new BruteForceAlgorithm().run(scenario, options);
    case 'greedy':               return new GreedyAlgorithm().run(scenario, options);
    case 'dynamic-programming':  return new DynamicProgrammingAlgorithm().run(scenario, options);
    case 'backtracking':         return new BacktrackingAlgorithm().run(scenario, options);
    case 'branch-and-bound':     return new BranchAndBoundAlgorithm().run(scenario, options);
    case 'merge-sort':           return new MergeSortAlgorithm().run(scenario, options);
    case 'quick-sort':           return new QuickSortAlgorithm().run(scenario, options);
    case 'binary-search':        return new BinarySearchAlgorithm().run(scenario, options);
    case 'bfs':                  return new BFSAlgorithm().run(scenario, options);
    case 'dfs':                  return new DFSAlgorithm().run(scenario, options);
    default:
      throw new Error(`Algorithm not implemented: ${algorithmId}`);
  }
}
