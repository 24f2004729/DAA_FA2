# BANK-OPT — Multi-Paradigm Algorithmic Decision & Optimization Laboratory
### DAA FA2 Project

> ONE PROBLEM • SAME INPUT • MULTIPLE ALGORITHMIC STRATEGIES • LIVE EXECUTION • EXPLAINABLE RESULTS

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Start Development Servers

**Option 1 — Double-click `start-dev.bat`** (Windows, recommended)

**Option 2 — Manual:**
```bash
# Terminal 1: Start backend (port 3001)
node_modules/.bin/ts-node --project server/tsconfig.json server/src/index.ts

# Terminal 2: Start frontend (port 5173)
cd client && ../node_modules/.bin/vite --host
```

Then open **http://localhost:5173**

---

## 🏗️ Architecture

```
DAA_FA2/
├── packages/shared/          # Shared TypeScript types & models
│   └── src/index.ts          # All shared interfaces (Scenario, AlgorithmEvent, etc.)
├── client/                   # React 18 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── pages/            # 7 full pages
│   │   ├── components/       # All UI + visualization components
│   │   │   ├── layout/       # Navbar, AlgorithmSidebar
│   │   │   ├── visualization/ # CandidateTableViz, DPTableViz, SearchTreeViz, etc.
│   │   │   ├── panels/       # ExplanationPanel, MetricsStrip, ComplexityPanel
│   │   │   └── common/       # Button, Badge, Card, Input, Select, etc.
│   │   ├── store/            # Zustand global state + simulation engine
│   │   └── api/              # Axios client + WebSocket
└── server/                   # Node.js + Express + TypeScript
    ├── src/
    │   ├── algorithms/       # All algorithm implementations
    │   │   ├── base.ts       # BaseAlgorithm abstract class
    │   │   ├── brute-force.ts
    │   │   ├── greedy.ts
    │   │   ├── dynamic-programming.ts
    │   │   ├── backtracking.ts
    │   │   ├── branch-and-bound.ts
    │   │   ├── merge-sort.ts
    │   │   ├── quick-sort.ts
    │   │   ├── binary-search.ts
    │   │   ├── bfs.ts
    │   │   ├── dfs.ts
    │   │   └── registry.ts   # Full metadata for all algorithms
    │   ├── engine/
    │   │   ├── generator.ts  # Seeded scenario generator + 6 presets
    │   │   ├── scenario-engine.ts
    │   │   ├── constraint-engine.ts
    │   │   └── objective-engine.ts
    │   ├── routes/
    │   │   ├── scenarios.ts  # GET /presets, POST /generate, /validate, /graph
    │   │   ├── algorithms.ts # GET /, GET /:id, POST /run, POST /compare
    │   │   ├── complexity.ts # POST /benchmark
    │   │   └── correctness.ts # POST /run
    │   └── websocket/        # Real-time event streaming
    └── start-dev.bat
```

---

## 🧮 Implemented Algorithms

### OPTIMIZATION (Knapsack-style selection)
| Algorithm | Complexity | Guarantees Optimal |
|-----------|-----------|-------------------|
| Brute Force | O(2ⁿ) | ✅ Yes (oracle) |
| Greedy | O(n log n) | ❌ No |
| Dynamic Programming | O(n × W) | ✅ Yes |
| Backtracking | O(2ⁿ) worst | ✅ Yes |
| Branch & Bound | O(2ⁿ) worst, much better in practice | ✅ Yes |

### DIVIDE & CONQUER / PREPROCESSING
| Algorithm | Complexity |
|-----------|-----------|
| Merge Sort | O(n log n) |
| Quick Sort | O(n log n) avg, O(n²) worst |
| Binary Search | O(log n) |

### GRAPH TRAVERSAL
| Algorithm | Complexity |
|-----------|-----------|
| BFS | O(V + E) |
| DFS | O(V + E) |

---

## 🎯 Features

- **ONE SCENARIO, MULTIPLE ALGORITHMS** — Switching algorithms never changes the input
- **LIVE STEP-BY-STEP EXECUTION** — Run / Step / Pause / Reset controls
- **SPEED CONTROL** — Fast (80ms) / Normal (350ms) / Slow (900ms)
- **5 VISUALIZATION TYPES** — Candidate table, DP table, search tree, dependency graph, array bars
- **EXPLAINABILITY** — Every event emits a human-readable explanation
- **COMPARE LAB** — Run multiple algorithms on identical scenario snapshots
- **COMPLEXITY LAB** — Measure O(n) empirically vs theoretical
- **CORRECTNESS LAB** — Brute Force oracle validates optimization algorithms
- **6 PRESET SCENARIOS** — Canonical Example, Balanced Day, Liquidity Crunch, Dependency Chain, Conflict Heavy, High-Risk Batch
- **SCENARIO GENERATOR** — Seeded PRNG for reproducible random scenarios

---

## 🔌 API Reference

```
GET  /api/scenarios/presets           List all preset scenarios
POST /api/scenarios/generate          Generate random scenario {seed, n, capacity}
POST /api/scenarios/validate          Validate scenario (cycle detection, ref checks)
POST /api/scenarios/graph             Build dependency/conflict graph

GET  /api/algorithms                  List all algorithms with metadata
GET  /api/algorithms/categories       Algorithms grouped by category
GET  /api/algorithms/:id              Single algorithm metadata
POST /api/algorithms/run              Run algorithm, get full result + events
POST /api/algorithms/compare          Compare multiple algorithms, same scenario

POST /api/complexity/benchmark        Measure operation counts for n values
POST /api/correctness/run             Oracle correctness tests
```

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Canvas | `#F7F9FC` |
| Primary | `#1F4E79` (deep academic blue) |
| Secondary | `#2A7F7F` (restrained teal) |
| Text | `#2A3038` (charcoal) |
| Border | `#D9E0E7` |
| Font UI | Inter |
| Font Code | JetBrains Mono |

---

## 📋 Canonical Test Scenario

| ID | Value | Cost | Priority | Risk | Dependencies | Conflicts |
|----|-------|------|----------|------|-------------|----------|
| T1 | ₹80K | 4 | 9 | 2 | — | — |
| T2 | ₹50K | 3 | 7 | 4 | T1 | — |
| T3 | ₹120K | 7 | 8 | 3 | — | T5 |
| T4 | ₹40K | 2 | 5 | 8 | T2 | — |
| T5 | ₹90K | 5 | 10 | 2 | — | T3 |

**Capacity:** 18 units | **Optimal (DP/B&B):** ₹330K [T1+T3+T4+T5 or similar]

---

## 📊 Smoke Test Results

```
GREEDY:      obj=₹220,000  events=15   selected=[T1, T5, T2]
BRUTE-FORCE: obj=₹290,000  events=92   selected=[T1, T2, T3, T4]
DP:          obj=₹330,000  events=66   selected=[T1, T3, T4, T5]
BACKTRACKING:obj=₹290,000  events=143  selected=[T1, T2, T3, T4]
B&B:         obj=₹330,000  events=20   selected=[T1, T4, T5, T3]
```

*Note: Greedy ≠ optimal (local greedy choices). DP and B&B agree on global optimum.*

---

*BANK-OPT turns DAA from a set of static formulas into an observable decision process.*
