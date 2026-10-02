import type { AlgorithmMeta, AlgorithmId } from '@bank-opt/shared';

export const ALGORITHM_META: Record<AlgorithmId, AlgorithmMeta> = {
  'brute-force': {
    id: 'brute-force',
    name: 'Brute Force',
    category: 'OPTIMIZATION',
    paradigm: 'Exhaustive Enumeration',
    timeComplexity: 'O(2ⁿ)',
    spaceComplexity: 'O(n)',
    description: 'Enumerates all 2ⁿ subsets of transactions, checks feasibility of each, and tracks the globally optimal solution. Serves as the correctness oracle for optimization algorithms.',
    pros: ['Guaranteed optimal solution', 'Simple to understand and verify', 'Useful as ground truth for testing'],
    cons: ['Exponential time — impractical beyond n≈20', 'No pruning of infeasible branches upfront', 'Does not scale'],
    pseudocode: `for mask = 0 to 2^n - 1:
  candidate = {t_i : bit i of mask is set}
  if capacity(candidate) ≤ C
    and dependencies(candidate) satisfied
    and no conflicts in candidate:
      obj = objective(candidate)
      if obj > bestObj:
        bestObj = obj
        best = candidate
return best`,
    guaranteesOptimal: true,
    visualizationType: 'candidate-table',
  },

  'greedy': {
    id: 'greedy',
    name: 'Greedy',
    category: 'OPTIMIZATION',
    paradigm: 'Greedy / Local Optimum',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    description: 'At each step, selects the locally best feasible transaction according to a configurable scoring key (value/cost ratio, priority/cost, etc.). Fast but not guaranteed optimal.',
    pros: ['Very fast — O(n log n)', 'Intuitive decision process', 'Good approximation for many instances'],
    cons: ['Not guaranteed globally optimal', 'Local choice may foreclose better options', 'Sensitive to scoring key choice'],
    pseudocode: `sort transactions by score(t) = value(t)/cost(t) descending
for each t in sorted order:
  if capacity + cost(t) ≤ C
    and dependencies(t) satisfied
    and no conflict with selected:
      select t
      capacity += cost(t)
return selected`,
    guaranteesOptimal: false,
    visualizationType: 'candidate-table',
  },

  'dynamic-programming': {
    id: 'dynamic-programming',
    name: 'Dynamic Programming',
    category: 'OPTIMIZATION',
    paradigm: 'Dynamic Programming / Tabulation',
    timeComplexity: 'O(n × W)',
    spaceComplexity: 'O(n × W)',
    description: 'Fills a 2D DP table where DP[i][w] = best objective using the first i transactions within capacity w. Solves the 0/1 knapsack formulation optimally, then traces back the selection.',
    pros: ['Optimal for capacity-constrained selection (knapsack)', 'Reuses sub-problem solutions (no recomputation)', 'Polynomial in n and W'],
    cons: ['Pseudo-polynomial — exponential in capacity digits', 'Does not handle arbitrary dependency graphs natively', 'Memory: O(n×W)'],
    pseudocode: `for i = 1 to n:
  for w = 0 to W:
    if cost[i] ≤ w:
      dp[i][w] = max(dp[i-1][w],
                     dp[i-1][w-cost[i]] + val[i])
    else:
      dp[i][w] = dp[i-1][w]
// Traceback
w = W
for i = n downto 1:
  if dp[i][w] ≠ dp[i-1][w]:
    select t_i; w -= cost[i]`,
    guaranteesOptimal: true,
    visualizationType: 'dp-table',
  },

  'backtracking': {
    id: 'backtracking',
    name: 'Backtracking',
    category: 'OPTIMIZATION',
    paradigm: 'Systematic Search / Backtracking',
    timeComplexity: 'O(2ⁿ) worst case, typically much better',
    spaceComplexity: 'O(n) recursion stack',
    description: 'Recursively explores include/exclude decisions for each transaction. Prunes branches that violate capacity or conflict constraints before full expansion, unlike brute force.',
    pros: ['Better than brute force in practice due to early pruning', 'Handles all constraint types', 'Optimal when it completes'],
    cons: ['Still exponential worst case', 'Recursion overhead', 'Hard to parallelize'],
    pseudocode: `function backtrack(i, selected, capUsed):
  if i == n:
    if feasible(selected): update best
    return
  // Include t_i
  if capUsed + cost[i] ≤ C and no conflict:
    backtrack(i+1, selected ∪ {t_i}, capUsed + cost[i])
  // Exclude t_i
  backtrack(i+1, selected, capUsed)`,
    guaranteesOptimal: true,
    visualizationType: 'search-tree',
  },

  'branch-and-bound': {
    id: 'branch-and-bound',
    name: 'Branch & Bound',
    category: 'OPTIMIZATION',
    paradigm: 'Branch & Bound / Bounding',
    timeComplexity: 'O(2ⁿ) worst, typically O(n log n) – O(2^(n/2)) with good bounds',
    spaceComplexity: 'O(n) best-first queue',
    description: 'Best-first search with fractional relaxation upper bounds. Prunes any branch whose optimistic upper bound cannot exceed the current incumbent. Often dramatically faster than backtracking.',
    pros: ['Often much faster than backtracking/brute-force', 'Optimal guarantee', 'Tight bounds minimize wasted exploration'],
    cons: ['Bound quality critical — poor bounds reduce effectiveness', 'Memory for open node queue', 'Worst case still exponential'],
    pseudocode: `sort by value/cost descending
rootBound = fractionalBound(root)
queue = [root]
while queue not empty:
  node = best-bound node from queue
  if node.bound ≤ incumbent: PRUNE; continue
  for child in {include t_i, exclude t_i}:
    childBound = fractionalBound(child)
    if childBound > incumbent:
      if child is feasible leaf: update incumbent
      else: enqueue child`,
    guaranteesOptimal: true,
    visualizationType: 'search-tree',
  },

  'merge-sort': {
    id: 'merge-sort',
    name: 'Merge Sort',
    category: 'DIVIDE_AND_CONQUER',
    paradigm: 'Divide & Conquer',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    description: 'Recursively splits the transaction array in half, sorts each half, then merges them. Demonstrates the divide-and-conquer paradigm and feeds sorted output to greedy and binary search.',
    pros: ['Stable sort — preserves relative order of equal elements', 'Guaranteed O(n log n)', 'Predictable performance'],
    cons: ['O(n) extra space for merge buffer', 'Not in-place', 'More memory than quick sort'],
    pseudocode: `function mergeSort(arr):
  if len(arr) ≤ 1: return arr
  mid = len(arr) / 2
  left = mergeSort(arr[:mid])
  right = mergeSort(arr[mid:])
  return merge(left, right)

function merge(L, R):
  result = []
  while L and R not empty:
    if L[0] ≤ R[0]: result.append(L.pop(0))
    else: result.append(R.pop(0))
  return result + remaining`,
    guaranteesOptimal: false,
    visualizationType: 'array',
  },

  'quick-sort': {
    id: 'quick-sort',
    name: 'Quick Sort',
    category: 'DIVIDE_AND_CONQUER',
    paradigm: 'Divide & Conquer / Partitioning',
    timeComplexity: 'O(n log n) average, O(n²) worst',
    spaceComplexity: 'O(log n) stack',
    description: 'Selects a pivot, partitions elements into those smaller/larger than the pivot, then recursively sorts each partition. In-place with low memory overhead.',
    pros: ['In-place — O(log n) space', 'Cache-friendly memory access', 'Fast in practice'],
    cons: ['O(n²) worst case (sorted input with bad pivot)', 'Not stable', 'Performance depends on pivot choice'],
    pseudocode: `function quickSort(arr, low, high):
  if low < high:
    p = partition(arr, low, high)
    quickSort(arr, low, p-1)
    quickSort(arr, p+1, high)

function partition(arr, low, high):
  pivot = arr[high]
  i = low - 1
  for j = low to high-1:
    if arr[j] ≤ pivot:
      i++; swap(arr[i], arr[j])
  swap(arr[i+1], arr[high])
  return i+1`,
    guaranteesOptimal: false,
    visualizationType: 'array',
  },

  'binary-search': {
    id: 'binary-search',
    name: 'Binary Search',
    category: 'DIVIDE_AND_CONQUER',
    paradigm: 'Divide & Conquer / Search',
    timeComplexity: 'O(log n) search, O(n log n) with pre-sort',
    spaceComplexity: 'O(1)',
    description: 'Searches for a transaction by key value in a sorted array by repeatedly halving the search space. Demonstrates O(log n) search after O(n log n) pre-sorting.',
    pros: ['Very fast search — O(log n)', 'Simple and elegant', 'Only O(1) extra space'],
    cons: ['Requires sorted input', 'Not suitable for dynamic data', 'Returns only one match'],
    pseudocode: `sort array by key
low = 0, high = n-1
while low ≤ high:
  mid = (low + high) / 2
  if arr[mid].key == target: return mid
  elif arr[mid].key < target: low = mid + 1
  else: high = mid - 1
return NOT_FOUND`,
    guaranteesOptimal: false,
    visualizationType: 'array',
  },

  'bfs': {
    id: 'bfs',
    name: 'BFS',
    category: 'GRAPH',
    paradigm: 'Graph Traversal / Breadth-First',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    description: 'Explores the dependency/conflict graph layer by layer using a queue. Finds shortest paths in terms of edge count and answers "which transactions are reachable within k relationships?"',
    pros: ['Finds shortest path in unweighted graph', 'Guaranteed to visit all reachable nodes', 'Level-based exploration is intuitive'],
    cons: ['O(V) memory for the queue', 'Does not find optimal paths in weighted graphs', 'Slower than DFS for deep graphs'],
    pseudocode: `queue = [source]; visited = {source}
while queue not empty:
  node = queue.dequeue()
  VISIT(node)
  for neighbor in adj[node]:
    if neighbor not in visited:
      visited.add(neighbor)
      queue.enqueue(neighbor)`,
    guaranteesOptimal: false,
    visualizationType: 'dependency-graph',
  },

  'dfs': {
    id: 'dfs',
    name: 'DFS',
    category: 'GRAPH',
    paradigm: 'Graph Traversal / Depth-First',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V) recursion stack',
    description: 'Explores the dependency/conflict graph as deep as possible before backtracking using a stack (recursion). Used for cycle detection, topological ordering, and dependency chain analysis.',
    pros: ['Memory efficient for deep graphs', 'Natural for cycle detection and topological sort', 'Finds all connected components'],
    cons: ['Does not find shortest paths', 'Recursion depth limited by stack size', 'Non-intuitive traversal order'],
    pseudocode: `function dfs(node):
  visited.add(node)
  VISIT(node)
  stack.push(node)
  for neighbor in adj[node]:
    if neighbor not in visited:
      dfs(neighbor)
  stack.pop()  // BACKTRACK`,
    guaranteesOptimal: false,
    visualizationType: 'dependency-graph',
  },

  'kruskal': {
    id: 'kruskal',
    name: "Kruskal's",
    category: 'NETWORK',
    paradigm: 'Greedy / Minimum Spanning Tree',
    timeComplexity: 'O(E log E)',
    spaceComplexity: 'O(V)',
    description: "Builds a minimum spanning tree by sorting edges by weight and adding each edge if it doesn't create a cycle (Union-Find). Optional network extension for branch/ATM connectivity.",
    pros: ['Optimal MST', 'Works on disconnected graphs', 'Simple greedy approach'],
    cons: ['Requires weighted edges', 'Not applicable to directed graphs', 'Sorting overhead'],
    pseudocode: `sort edges by weight ascending
for each edge (u, v, w) in sorted order:
  if find(u) ≠ find(v):
    add edge to MST
    union(u, v)`,
    guaranteesOptimal: true,
    visualizationType: 'dependency-graph',
  },

  'prim': {
    id: 'prim',
    name: "Prim's",
    category: 'NETWORK',
    paradigm: 'Greedy / Minimum Spanning Tree',
    timeComplexity: 'O(E log V) with priority queue',
    spaceComplexity: 'O(V)',
    description: "Builds MST by starting from a node and greedily adding the minimum weight edge that connects a new node. Optional network extension.",
    pros: ['Good for dense graphs', 'Optimal MST', 'Priority-queue based efficiency'],
    cons: ['Requires connected graph', 'More complex implementation than Kruskal', 'Not applicable to directed graphs'],
    pseudocode: `start from any node, mark visited
while unvisited nodes remain:
  find minimum weight edge crossing cut
  add it to MST
  mark new node visited`,
    guaranteesOptimal: true,
    visualizationType: 'dependency-graph',
  },
};

export function getAlgorithmMeta(id: AlgorithmId): AlgorithmMeta {
  const meta = ALGORITHM_META[id];
  if (!meta) throw new Error(`Unknown algorithm: ${id}`);
  return meta;
}

export function getAlgorithmsByCategory(): Record<string, AlgorithmMeta[]> {
  const result: Record<string, AlgorithmMeta[]> = {};
  for (const meta of Object.values(ALGORITHM_META)) {
    if (!result[meta.category]) result[meta.category] = [];
    result[meta.category].push(meta);
  }
  return result;
}
