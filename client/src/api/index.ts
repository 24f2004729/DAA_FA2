import axios from 'axios';
import type {
  ApiResponse, Scenario, AlgorithmId, AlgorithmMeta, AlgorithmResult,
  RunAlgorithmRequest, ComparisonReport, ComplexityResult,
  CorrectnessTestCase, ScenarioPreset, ValidationResult, DependencyGraph
} from '@bank-opt/shared';

const http = axios.create({ baseURL: '/api' });

async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const { data } = await promise;
  if (!data.success) throw new Error(data.error ?? 'API error');
  return data.data as T;
}

export const api = {
  // Scenarios
  getPresets: () => unwrap<ScenarioPreset[]>(http.get('/scenarios/presets')),
  generateScenario: (params: { seed?: number; n?: number; capacity?: number }) =>
    unwrap<Scenario>(http.post('/scenarios/generate', params)),
  validateScenario: (scenario: Scenario) =>
    unwrap<ValidationResult>(http.post('/scenarios/validate', scenario)),
  getDependencyGraph: (scenario: Scenario) =>
    unwrap<DependencyGraph>(http.post('/scenarios/graph', scenario)),

  // Algorithms
  getAlgorithms: () => unwrap<AlgorithmMeta[]>(http.get('/algorithms')),
  getAlgorithmCategories: () => unwrap<Record<string, AlgorithmMeta[]>>(http.get('/algorithms/categories')),
  getAlgorithm: (id: AlgorithmId) => unwrap<AlgorithmMeta>(http.get(`/algorithms/${id}`)),
  runAlgorithm: (req: RunAlgorithmRequest) =>
    unwrap<AlgorithmResult>(http.post('/algorithms/run', req)),
  compareAlgorithms: (payload: { algorithmIds: AlgorithmId[]; scenario: Scenario; options?: Record<string, unknown> }) =>
    unwrap<ComparisonReport>(http.post('/algorithms/compare', payload)),

  // Complexity
  benchmarkComplexity: (payload: { algorithmId: AlgorithmId; nValues: number[] }) =>
    unwrap<ComplexityResult>(http.post('/complexity/benchmark', payload)),

  // Correctness
  runCorrectnessTests: (payload: { algorithmIds: AlgorithmId[]; numCases: number; maxN: number; capacity: number }) =>
    unwrap<CorrectnessTestCase[]>(http.post('/correctness/run', payload)),
};
