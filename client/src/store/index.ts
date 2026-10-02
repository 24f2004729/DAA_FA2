import { create } from 'zustand';
import type {
  Scenario, AlgorithmId, AlgorithmEvent, AlgorithmResult,
  ComparisonEntry, ComplexityResult, CorrectnessTestCase
} from '@bank-opt/shared';
import { api } from '../api';

const SPEED_DELAYS = { fast: 80, normal: 350, slow: 900 };

interface BankOptStore {
  // Scenario
  scenario: Scenario | null;
  setScenario: (s: Scenario) => void;
  frozenScenario: Scenario | null;
  freezeScenario: () => void;

  // Algorithm
  selectedAlgorithm: AlgorithmId | null;
  setSelectedAlgorithm: (id: AlgorithmId) => void;
  algorithmOptions: Record<string, unknown>;
  setAlgorithmOptions: (opts: Record<string, unknown>) => void;

  // Simulation
  simulationStatus: 'idle' | 'running' | 'paused' | 'complete' | 'error';
  currentStep: number;
  events: AlgorithmEvent[];
  currentResult: AlgorithmResult | null;
  speed: 'fast' | 'normal' | 'slow';
  setSpeed: (s: 'fast' | 'normal' | 'slow') => void;
  _pauseFlag: boolean;
  _allEvents: AlgorithmEvent[];

  runSimulation: () => Promise<void>;
  stepSimulation: () => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  resetSimulation: () => void;

  // Comparison
  comparisonResults: ComparisonEntry[];
  addComparisonResult: (entry: ComparisonEntry) => void;
  clearComparison: () => void;

  // Labs
  complexityResults: ComplexityResult[];
  setComplexityResults: (r: ComplexityResult[]) => void;
  correctnessTests: CorrectnessTestCase[];
  setCorrectnessTests: (t: CorrectnessTestCase[]) => void;
}

export const useBankOptStore = create<BankOptStore>((set, get) => ({
  scenario: null,
  setScenario: (s) => set({ scenario: s }),
  frozenScenario: null,
  freezeScenario: () => {
    const s = get().scenario;
    if (s) set({ frozenScenario: JSON.parse(JSON.stringify(s)) });
  },

  selectedAlgorithm: null,
  setSelectedAlgorithm: (id) => set({ selectedAlgorithm: id }),
  algorithmOptions: {},
  setAlgorithmOptions: (opts) => set({ algorithmOptions: opts }),

  simulationStatus: 'idle',
  currentStep: 0,
  events: [],
  currentResult: null,
  speed: 'normal',
  setSpeed: (speed) => set({ speed }),
  _pauseFlag: false,
  _allEvents: [],

  runSimulation: async () => {
    const { scenario, selectedAlgorithm, algorithmOptions, speed } = get();
    if (!scenario || !selectedAlgorithm) return;

    set({ simulationStatus: 'running', currentStep: 0, events: [], currentResult: null, _pauseFlag: false });

    try {
      const result = await api.runAlgorithm({ algorithmId: selectedAlgorithm, scenario, options: algorithmOptions });
      const allEvents = result.events;
      set({ _allEvents: allEvents, currentResult: result });

      const delay = SPEED_DELAYS[speed];

      for (let i = 0; i < allEvents.length; i++) {
        // Pause loop
        while (get()._pauseFlag) {
          await new Promise(r => setTimeout(r, 100));
        }
        if (get().simulationStatus === 'idle') return; // Reset was called

        set((state) => ({
          events: [...state.events, allEvents[i]],
          currentStep: i + 1,
        }));

        if (delay > 0) await new Promise(r => setTimeout(r, delay));
      }

      set({ simulationStatus: 'complete' });
    } catch (err) {
      console.error('Simulation error:', err);
      set({ simulationStatus: 'error' });
    }
  },

  stepSimulation: () => {
    const { _allEvents, currentStep, simulationStatus } = get();
    if (simulationStatus === 'idle' || simulationStatus === 'complete') return;

    const next = _allEvents[currentStep];
    if (next) {
      set((state) => ({
        events: [...state.events, next],
        currentStep: state.currentStep + 1,
        simulationStatus: state.currentStep + 1 >= _allEvents.length ? 'complete' : 'paused',
      }));
    }
  },

  pauseSimulation: () => set({ simulationStatus: 'paused', _pauseFlag: true }),
  resumeSimulation: () => set({ simulationStatus: 'running', _pauseFlag: false }),
  resetSimulation: () => set({
    simulationStatus: 'idle',
    currentStep: 0,
    events: [],
    currentResult: null,
    _pauseFlag: false,
    _allEvents: [],
  }),

  comparisonResults: [],
  addComparisonResult: (entry) => set((s) => ({ comparisonResults: [...s.comparisonResults, entry] })),
  clearComparison: () => set({ comparisonResults: [] }),

  complexityResults: [],
  setComplexityResults: (r) => set({ complexityResults: r }),
  correctnessTests: [],
  setCorrectnessTests: (t) => set({ correctnessTests: t }),
}));
