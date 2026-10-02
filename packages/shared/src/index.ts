// ─── Transaction & Scenario Models ──────────────────────────────────────────

export type TransactionStatus = 'pending' | 'selected' | 'rejected' | 'blocked' | 'processed';

export interface Transaction {
  id: string;
  label: string;
  value: number;        // financial value (₹)
  cost: number;         // processing capacity units consumed
  priority: number;     // 1-10
  risk: number;         // 1-10
  dependencies: string[]; // transaction IDs that must be selected first
  conflicts: string[];    // transaction IDs that cannot coexist
  status: TransactionStatus;
  disabled?: boolean;
}

export type ObjectiveMode = 'value' | 'priority' | 'composite' | 'lexicographic';

export interface ObjectiveWeights {
  alpha: number; // value weight
  beta: number;  // priority weight
  gamma: number; // risk penalty weight
  delta: number; // cost penalty weight
}

export interface Scenario {
  scenarioId: string;
  seed: number;
  label: string;
  capacity: number;
  riskThreshold: number;
  objective: {
    mode: ObjectiveMode;
    weights: ObjectiveWeights;
  };
  transactions: Transaction[];
  version: number;
  createdAt: string;
}

export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  scenario: Omit<Scenario, 'scenarioId' | 'createdAt' | 'version'>;
}

// ─── Algorithm Event Types ───────────────────────────────────────────────────

export type AlgorithmEventType =
  | 'INIT'
  | 'SELECT'
  | 'COMPARE'
  | 'CHECK'
  | 'REJECT'
  | 'BRANCH'
  | 'BACKTRACK'
  | 'PRUNE'
  | 'SPLIT'
  | 'COMBINE'
  | 'DP_UPDATE'
  | 'QUEUE_PUSH'
  | 'QUEUE_POP'
  | 'STACK_PUSH'
  | 'STACK_POP'
  | 'BEST_UPDATE'
  | 'COMPLETE'
  | 'SWAP'
  | 'PARTITION'
  | 'MERGE'
  | 'FOUND'
  | 'NOT_FOUND'
  | 'VISIT';

export interface AlgorithmEvent {
  type: AlgorithmEventType;
  step: number;
  timestamp: number;
  entity?: string | string[];
  reason?: string;
  data?: Record<string, unknown>;
  explanation: string;
  highlight?: string[];   // transaction IDs to highlight
  currentSolution?: string[]; // currently selected transaction IDs
  incumbent?: number;     // best objective so far
  bound?: number;         // upper bound (B&B)
  dpTable?: number[][];   // DP table snapshot
  arrayState?: unknown[]; // array state for sorting/search
  queueState?: string[];  // BFS queue
  stackState?: string[];  // DFS stack
  graphEdge?: [string, string]; // graph edge being traversed
  metrics?: Partial<AlgorithmMetrics>;
}

// ─── Algorithm Metrics ───────────────────────────────────────────────────────

export interface AlgorithmMetrics {
  operationCount: number;
  comparisons: number;
  selections: number;
  rejections: number;
  backtracks: number;
  prunings: number;
  dpUpdates: number;
  statesExplored: number;
  objectiveValue: number;
  capacityUsed: number;
  priorityScore: number;
  riskScore: number;
  selectedTransactions: string[];
  feasible: boolean;
  elapsedMs: number;
  theoreticalComplexity: string;
  spaceComplexity: string;
}

// ─── Algorithm Definitions ───────────────────────────────────────────────────

export type AlgorithmId =
  | 'brute-force'
  | 'greedy'
  | 'dynamic-programming'
  | 'backtracking'
  | 'branch-and-bound'
  | 'merge-sort'
  | 'quick-sort'
  | 'binary-search'
  | 'bfs'
  | 'dfs'
  | 'kruskal'
  | 'prim';

export type AlgorithmCategory =
  | 'OPTIMIZATION'
  | 'DIVIDE_AND_CONQUER'
  | 'GRAPH'
  | 'NETWORK';

export interface AlgorithmMeta {
  id: AlgorithmId;
  name: string;
  category: AlgorithmCategory;
  paradigm: string;
  timeComplexity: string;
  spaceComplexity: string;
  description: string;
  pros: string[];
  cons: string[];
  pseudocode: string;
  guaranteesOptimal: boolean;
  visualizationType: 'candidate-table' | 'dp-table' | 'search-tree' | 'graph' | 'array' | 'dependency-graph';
}

// ─── Algorithm Result ────────────────────────────────────────────────────────

export interface AlgorithmResult {
  algorithmId: AlgorithmId;
  scenarioId: string;
  scenarioVersion: number;
  selectedTransactions: string[];
  objectiveValue: number;
  capacityUsed: number;
  feasible: boolean;
  metrics: AlgorithmMetrics;
  events: AlgorithmEvent[];
}

// ─── Comparison ──────────────────────────────────────────────────────────────

export interface ComparisonEntry {
  algorithmId: AlgorithmId;
  result: AlgorithmResult;
}

export interface ComparisonReport {
  scenarioId: string;
  scenarioVersion: number;
  entries: ComparisonEntry[];
  generatedAt: string;
}

// ─── Complexity Lab ──────────────────────────────────────────────────────────

export interface ComplexityDataPoint {
  n: number;
  operationCount: number;
  elapsedMs: number;
}

export interface ComplexityResult {
  algorithmId: AlgorithmId;
  dataPoints: ComplexityDataPoint[];
}

// ─── Correctness Lab ─────────────────────────────────────────────────────────

export interface CorrectnessTestCase {
  caseId: string;
  scenario: Scenario;
  oracleResult: AlgorithmResult;
  testedResults: { algorithmId: AlgorithmId; result: AlgorithmResult; matches: boolean }[];
}

// ─── API Types ───────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RunAlgorithmRequest {
  algorithmId: AlgorithmId;
  scenario: Scenario;
  options?: {
    greedyKey?: 'value_cost' | 'priority_cost' | 'priority' | 'value';
    searchKey?: 'value' | 'priority' | 'cost' | 'risk';
    searchTarget?: number;
    sortKey?: 'value' | 'priority' | 'cost' | 'risk';
    sortOrder?: 'asc' | 'desc';
    bfsBfsSource?: string;
  };
}

export interface ComplexityBenchmarkRequest {
  algorithmId: AlgorithmId;
  nValues: number[];
}

export interface CorrectnessRequest {
  algorithmIds: AlgorithmId[];
  numCases: number;
  maxN: number;
  capacity: number;
}

// ─── WebSocket Messages ──────────────────────────────────────────────────────

export type WsMessageType =
  | 'RUN_START'
  | 'EVENT'
  | 'COMPLETE'
  | 'ERROR'
  | 'PAUSE'
  | 'RESUME';

export interface WsMessage {
  type: WsMessageType;
  payload: unknown;
}

// ─── Scenario Validation ─────────────────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
  transactionId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

// ─── Graph Types (for BFS/DFS) ───────────────────────────────────────────────

export interface GraphNode {
  id: string;
  label: string;
  x?: number;
  y?: number;
  layer?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'dependency' | 'conflict';
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ─── Greedy Key Options ──────────────────────────────────────────────────────

export type GreedyKey = 'value_cost' | 'priority_cost' | 'value' | 'priority' | 'composite';

export interface GreedyOptions {
  key: GreedyKey;
  weights?: ObjectiveWeights;
}

// ─── Sorting Options ─────────────────────────────────────────────────────────

export type SortKey = 'value' | 'priority' | 'cost' | 'risk' | 'score_cost';
export type SortAlgorithm = 'merge-sort' | 'quick-sort';

export interface SortOptions {
  key: SortKey;
  order: 'asc' | 'desc';
  algorithm: SortAlgorithm;
}

// ─── Search Options ──────────────────────────────────────────────────────────

export interface SearchOptions {
  key: SortKey;
  target: number;
}
