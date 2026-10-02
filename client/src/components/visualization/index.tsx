import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useBankOptStore } from '../../store';
import type { AlgorithmEvent } from '@bank-opt/shared';

// ─── Candidate Table Visualization ──────────────────────────────────────────

export const CandidateTableViz: React.FC = () => {
  const { scenario, events, currentStep } = useBankOptStore();
  const currentEvent = events[currentStep - 1];
  const highlighted = new Set<string>(
    Array.isArray(currentEvent?.highlight) ? currentEvent.highlight :
    currentEvent?.highlight ? [currentEvent.highlight] : []
  );
  const currentSolution = new Set<string>(currentEvent?.currentSolution ?? []);

  if (!scenario) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <p className="text-sm">No scenario loaded. Go to Scenario Setup first.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <h3 className="text-sm font-semibold text-primary mb-4">
        Transaction Candidates — Step {currentStep}
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {scenario.transactions.map(tx => {
          const isHighlighted = highlighted.has(tx.id);
          const isSelected = currentSolution.has(tx.id);
          let borderColor = 'border-border';
          let bg = 'bg-white';
          let statusLabel = 'Pending';
          let statusColor = 'text-gray-500';

          if (isSelected) {
            borderColor = 'border-secondary';
            bg = 'bg-emerald-50';
            statusLabel = 'Selected';
            statusColor = 'text-emerald-700';
          }
          if (isHighlighted) {
            borderColor = 'border-primary border-2';
            bg = 'bg-blue-50';
          }
          if (currentEvent?.type === 'REJECT' &&
              (currentEvent.entity === tx.id || (Array.isArray(currentEvent.entity) && currentEvent.entity.includes(tx.id)))) {
            borderColor = 'border-red-400 border-2';
            bg = 'bg-red-50';
            statusLabel = 'Rejected';
            statusColor = 'text-red-600';
          }

          return (
            <div
              key={tx.id}
              className={`rounded-lg border ${borderColor} ${bg} p-3 transition-all duration-300 shadow-sm`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-primary text-base">{tx.id}</span>
                <span className={`text-xs font-medium ${statusColor}`}>{statusLabel}</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs text-charcoal">
                <div><span className="text-gray-400">Value</span><br />₹{(tx.value / 1000).toFixed(0)}K</div>
                <div><span className="text-gray-400">Cost</span><br />{tx.cost} units</div>
                <div><span className="text-gray-400">Priority</span><br />{tx.priority}/10</div>
                <div><span className="text-gray-400">Risk</span><br />{tx.risk}/10</div>
              </div>
              {tx.dependencies.length > 0 && (
                <div className="mt-2 text-xs text-gray-400">
                  Deps: <span className="text-primary">{tx.dependencies.join(', ')}</span>
                </div>
              )}
              {tx.conflicts.length > 0 && (
                <div className="text-xs text-gray-400">
                  Conflicts: <span className="text-red-500">{tx.conflicts.join(', ')}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current best solution */}
      {currentSolution.size > 0 && (
        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <h4 className="text-xs font-semibold text-emerald-700 mb-2">Current Solution</h4>
          <div className="flex flex-wrap gap-2">
            {[...currentSolution].map(id => (
              <span key={id} className="px-2 py-1 bg-secondary text-white rounded text-xs font-medium">{id}</span>
            ))}
          </div>
          {currentEvent?.incumbent !== undefined && (
            <p className="text-xs text-emerald-700 mt-2">
              Objective: ₹{Number(currentEvent.incumbent).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── DP Table Visualization ──────────────────────────────────────────────────

export const DPTableViz: React.FC = () => {
  const { scenario, events, currentStep } = useBankOptStore();
  const currentEvent = events[currentStep - 1];
  const dpTable = currentEvent?.dpTable;

  if (!scenario) {
    return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">No scenario loaded.</div>;
  }

  if (!dpTable) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <p className="text-sm">DP table will appear here as the algorithm runs.</p>
      </div>
    );
  }

  const activeRow = (currentEvent?.data as Record<string, number> | undefined)?.row;
  const activeCol = (currentEvent?.data as Record<string, number> | undefined)?.col;

  return (
    <div className="flex-1 p-4 overflow-auto">
      <h3 className="text-sm font-semibold text-primary mb-1">DP Table</h3>
      <p className="text-xs text-gray-400 mb-4 font-mono">DP[i][w] = best objective using first i transactions, capacity ≤ w</p>
      <div className="overflow-auto">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th className="border border-border p-1 bg-canvas text-gray-500 min-w-[40px]">i\w</th>
              {Array.from({ length: scenario.capacity + 1 }, (_, w) => (
                <th key={w} className="border border-border p-1 bg-canvas text-gray-500 min-w-[40px]">{w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dpTable.map((row, i) => (
              <tr key={i}>
                <td className="border border-border p-1 bg-canvas font-semibold text-primary">
                  {i === 0 ? '∅' : scenario.transactions[i-1]?.id ?? i}
                </td>
                {row.map((cell, w) => {
                  const isActive = i === activeRow && w === activeCol;
                  const isUpdated = cell > 0;
                  return (
                    <td
                      key={w}
                      className={`border border-border p-1 text-center font-mono transition-all duration-200 ${
                        isActive ? 'bg-primary text-white font-bold' :
                        isUpdated ? 'bg-teal-50 text-secondary' :
                        'bg-white text-gray-400'
                      }`}
                    >
                      {cell > 0 ? (cell / 1000).toFixed(0) + 'K' : '0'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Search Tree Visualization ───────────────────────────────────────────────

interface TreeNode {
  id: string;
  label: string;
  type: AlgorithmEvent['type'];
  children: TreeNode[];
  x?: number;
  y?: number;
  depth?: number;
}

export const SearchTreeViz: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { events, currentStep } = useBankOptStore();

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const w = svgRef.current.clientWidth || 600;
    const h = svgRef.current.clientHeight || 400;

    const g = svg.append('g').attr('transform', 'translate(20, 20)');

    // Build nodes from BRANCH, PRUNE, BACKTRACK events
    const branchEvents = events.slice(0, currentStep)
      .filter(e => ['BRANCH', 'PRUNE', 'BACKTRACK', 'BEST_UPDATE'].includes(e.type));

    if (branchEvents.length === 0) {
      svg.append('text').attr('x', w / 2).attr('y', h / 2)
        .attr('text-anchor', 'middle').attr('fill', '#9CA3AF').attr('font-size', 13)
        .text('Run algorithm to see search tree');
      return;
    }

    // Simple horizontal layout: one row per level, nodes spaced
    const nodeSize = 32;
    const levelGap = 70;

    branchEvents.slice(0, 50).forEach((ev, i) => {
      const x = (i % 7) * 90 + 50;
      const y = Math.floor(i / 7) * levelGap + 40;

      const color = ev.type === 'PRUNE' ? '#E53E3E' :
                    ev.type === 'BACKTRACK' ? '#ED8936' :
                    ev.type === 'BEST_UPDATE' ? '#38A169' : '#1F4E79';

      g.append('circle')
        .attr('cx', x).attr('cy', y).attr('r', nodeSize / 2)
        .attr('fill', color).attr('fill-opacity', 0.15)
        .attr('stroke', color).attr('stroke-width', 2);

      g.append('text')
        .attr('x', x).attr('y', y - 2)
        .attr('text-anchor', 'middle').attr('fill', color)
        .attr('font-size', 9).attr('font-weight', 'bold')
        .text(ev.type.substring(0, 6));

      const entity = Array.isArray(ev.entity) ? ev.entity.slice(-1)[0] : ev.entity;
      if (entity) {
        g.append('text')
          .attr('x', x).attr('y', y + 10)
          .attr('text-anchor', 'middle').attr('fill', '#4B5563')
          .attr('font-size', 8)
          .text(String(entity).slice(0, 5));
      }
    });

  }, [events, currentStep]);

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 pt-3">
        <h3 className="text-sm font-semibold text-primary">Search Tree</h3>
        <div className="flex gap-3 text-xs mt-1">
          {[['#1F4E79','Branch'],['#E53E3E','Prune'],['#ED8936','Backtrack'],['#38A169','Best']].map(([c,l]) => (
            <span key={l} className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: c }}></span>
              {l}
            </span>
          ))}
        </div>
      </div>
      <svg ref={svgRef} className="flex-1 w-full" />
    </div>
  );
};

// ─── Dependency Graph Visualization ─────────────────────────────────────────

export const DependencyGraphViz: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { scenario, events, currentStep } = useBankOptStore();

  useEffect(() => {
    if (!svgRef.current || !scenario) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const w = svgRef.current.clientWidth || 600;
    const h = svgRef.current.clientHeight || 400;

    const visitedInSteps = new Set<string>(
      events.slice(0, currentStep)
        .filter(e => e.type === 'VISIT')
        .map(e => e.entity as string)
    );
    const queuedInSteps = new Set<string>(
      events.slice(0, currentStep)
        .filter(e => e.type === 'QUEUE_PUSH' || e.type === 'STACK_PUSH')
        .map(e => e.entity as string)
    );
    const activeEdges = new Set<string>(
      events.slice(0, currentStep)
        .filter(e => e.graphEdge)
        .map(e => `${e.graphEdge![0]}-${e.graphEdge![1]}`)
    );

    const nodes = scenario.transactions.map((tx, i) => ({
      id: tx.id, tx,
      x: w / 2 + Math.cos((i / scenario.transactions.length) * 2 * Math.PI) * Math.min(w, h) * 0.35,
      y: h / 2 + Math.sin((i / scenario.transactions.length) * 2 * Math.PI) * Math.min(w, h) * 0.35,
    }));
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    const edges: { s: typeof nodes[0]; t: typeof nodes[0]; type: string }[] = [];
    for (const tx of scenario.transactions) {
      for (const dep of tx.dependencies) {
        const s = nodeMap.get(dep), t = nodeMap.get(tx.id);
        if (s && t) edges.push({ s, t, type: 'dependency' });
      }
      for (const conf of tx.conflicts) {
        const s = nodeMap.get(tx.id), t = nodeMap.get(conf);
        if (s && t && tx.id < conf) edges.push({ s, t, type: 'conflict' });
      }
    }

    // Draw edges
    edges.forEach(({ s, t, type }) => {
      const key = `${s.id}-${t.id}`;
      const isActive = activeEdges.has(key) || activeEdges.has(`${t.id}-${s.id}`);
      svg.append('line')
        .attr('x1', s.x).attr('y1', s.y).attr('x2', t.x).attr('y2', t.y)
        .attr('stroke', isActive ? '#1F4E79' : type === 'dependency' ? '#2A7F7F' : '#E53E3E')
        .attr('stroke-width', isActive ? 2.5 : 1.5)
        .attr('stroke-dasharray', type === 'conflict' ? '5,3' : 'none')
        .attr('opacity', isActive ? 1 : 0.5);
    });

    // Draw nodes
    nodes.forEach(n => {
      const isVisited = visitedInSteps.has(n.id);
      const isQueued = queuedInSteps.has(n.id);
      const fill = isVisited ? '#2A7F7F' : isQueued ? '#BEE3F8' : '#F7F9FC';
      const stroke = isVisited ? '#1D5A5A' : '#1F4E79';

      svg.append('circle')
        .attr('cx', n.x).attr('cy', n.y).attr('r', 22)
        .attr('fill', fill).attr('stroke', stroke).attr('stroke-width', 2);

      svg.append('text')
        .attr('x', n.x).attr('y', n.y - 2)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('font-size', 12).attr('font-weight', 'bold')
        .attr('fill', isVisited ? 'white' : '#1F4E79')
        .text(n.id);

      svg.append('text')
        .attr('x', n.x).attr('y', n.y + 13)
        .attr('text-anchor', 'middle')
        .attr('font-size', 8).attr('fill', isVisited ? '#BEE3F8' : '#6B7280')
        .text(`P${n.tx.priority}`);
    });

  }, [scenario, events, currentStep]);

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 pt-3 pb-1">
        <h3 className="text-sm font-semibold text-primary">Dependency / Conflict Graph</h3>
        <div className="flex gap-4 text-xs mt-1 text-gray-500">
          <span>─── Dependency</span>
          <span style={{ color: '#E53E3E' }}>- - - Conflict</span>
          <span style={{ color: '#2A7F7F' }}>● Visited</span>
        </div>
      </div>
      <svg ref={svgRef} className="flex-1 w-full" />
    </div>
  );
};

// ─── Array Visualization ─────────────────────────────────────────────────────

export const ArrayViz: React.FC = () => {
  const { events, currentStep, scenario } = useBankOptStore();
  const currentEvent = events[currentStep - 1];
  const arrayState = currentEvent?.arrayState as Array<{ id: string; val: number; status?: string }> | undefined;

  const displayArr = arrayState ?? scenario?.transactions.map(t => ({ id: t.id, val: t.value, status: 'normal' })) ?? [];
  const maxVal = Math.max(...displayArr.map(d => d.val), 1);
  const data = currentEvent?.data as Record<string, unknown> | undefined;

  return (
    <div className="flex-1 p-4 flex flex-col">
      <h3 className="text-sm font-semibold text-primary mb-1">Array State</h3>
      {data && (
        <p className="text-xs text-gray-400 mb-4 font-mono">
          {data.low !== undefined && `low=${data.low} `}
          {data.mid !== undefined && `mid=${data.mid} `}
          {data.high !== undefined && `high=${data.high} `}
          {data.pivotId !== undefined && `pivot=${data.pivotId}`}
        </p>
      )}
      <div className="flex items-end gap-2 flex-1 pb-4">
        {displayArr.map((item, i) => {
          const height = `${Math.max(8, (item.val / maxVal) * 200)}px`;
          const isMid = data?.mid === i;
          const isLow = data?.low === i;
          const isHigh = data?.high === i;
          const isPivot = data?.pivotId === item.id;
          const bgColor = isPivot ? 'bg-amber-400' :
                          item.status === 'mid' || isMid ? 'bg-primary' :
                          item.status === 'low' || isLow ? 'bg-secondary' :
                          item.status === 'high' || isHigh ? 'bg-orange-400' :
                          currentEvent?.entity && (Array.isArray(currentEvent.entity) ? currentEvent.entity.includes(item.id) : currentEvent.entity === item.id)
                            ? 'bg-red-400' : 'bg-blue-200';
          return (
            <div key={item.id} className="flex flex-col items-center flex-1">
              {(isMid || isLow || isHigh || isPivot) && (
                <span className="text-xs font-bold mb-1 text-primary">
                  {isMid ? 'mid' : isLow ? 'low' : isHigh ? 'hi' : 'pvt'}
                </span>
              )}
              <div
                className={`w-full rounded-t ${bgColor} transition-all duration-300 flex items-end justify-center`}
                style={{ height }}
              />
              <span className="text-xs font-bold text-primary mt-1">{item.id}</span>
              <span className="text-xs text-gray-400 font-mono">{item.val > 1000 ? `${(item.val/1000).toFixed(0)}K` : item.val}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Simulation Canvas (router) ────────────────────────────────────────

export const SimulationCanvas: React.FC = () => {
  const { selectedAlgorithm, simulationStatus, scenario } = useBankOptStore();

  const getVizType = () => {
    switch (selectedAlgorithm) {
      case 'dynamic-programming': return 'dp-table';
      case 'backtracking':
      case 'branch-and-bound':    return 'search-tree';
      case 'bfs':
      case 'dfs':                 return 'dependency-graph';
      case 'merge-sort':
      case 'quick-sort':
      case 'binary-search':       return 'array';
      default:                    return 'candidate-table';
    }
  };

  const vizType = getVizType();

  return (
    <div className="flex-1 flex flex-col bg-canvas overflow-hidden">
      {/* Status bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-white text-xs">
        <span className="font-semibold text-gray-500">Visualization:</span>
        <span className="font-mono text-primary">{vizType}</span>
        <span className={`ml-auto px-2 py-0.5 rounded-full text-white text-xs font-medium ${
          simulationStatus === 'running' ? 'bg-secondary' :
          simulationStatus === 'paused' ? 'bg-amber-500' :
          simulationStatus === 'complete' ? 'bg-green-600' :
          simulationStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
        }`}>
          {simulationStatus.toUpperCase()}
        </span>
      </div>
      {/* Visualization */}
      <div className="flex-1 flex overflow-hidden">
        {vizType === 'dp-table' && <DPTableViz />}
        {vizType === 'search-tree' && <SearchTreeViz />}
        {vizType === 'dependency-graph' && <DependencyGraphViz />}
        {vizType === 'array' && <ArrayViz />}
        {vizType === 'candidate-table' && <CandidateTableViz />}
      </div>
    </div>
  );
};
