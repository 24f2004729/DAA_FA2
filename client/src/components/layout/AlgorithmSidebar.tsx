import React from 'react';
import { useBankOptStore } from '../../store';
import { Button } from '../common';
import { AlgorithmId } from '@bank-opt/shared';

const ALGORITHMS: { id: AlgorithmId; name: string; complexity: string; category: string }[] = [
  { id: 'brute-force', name: 'Brute Force', complexity: 'O(2^n)', category: 'OPTIMIZATION' },
  { id: 'greedy', name: 'Greedy', complexity: 'O(n log n)', category: 'OPTIMIZATION' },
  { id: 'dynamic-programming', name: 'Dynamic Programming', complexity: 'O(nW)', category: 'OPTIMIZATION' },
];

export const AlgorithmSidebar = () => {
  const { selectedAlgorithm, setSelectedAlgorithm, runSimulation, stepSimulation, pauseSimulation, resetSimulation, setSpeed, speed } = useBankOptStore();

  return (
    <div className="w-[260px] h-full bg-[#F7F9FC] border-r border-[#D9E0E7] flex flex-col">
      <div className="p-4 flex-1 overflow-y-auto">
        <h2 className="text-sm font-bold text-[#1F4E79] mb-4">OPTIMIZATION</h2>
        <div className="flex flex-col gap-2">
          {ALGORITHMS.map(alg => (
            <div 
              key={alg.id} 
              className={`p-3 rounded border cursor-pointer ${selectedAlgorithm === alg.id ? 'border-[#1F4E79] bg-white' : 'border-transparent hover:bg-[#E5E9F0]'}`}
              onClick={() => setSelectedAlgorithm(alg.id)}
            >
              <div className="font-semibold text-sm text-[#2A3038]">{alg.name}</div>
              <div className="text-xs text-gray-500 font-mono mt-1">{alg.complexity}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 bg-white border-t border-[#D9E0E7] flex flex-col gap-2">
        <select className="text-sm border rounded p-1" value={speed} onChange={(e) => setSpeed(e.target.value as any)}>
          <option value="slow">Slow</option>
          <option value="normal">Normal</option>
          <option value="fast">Fast</option>
        </select>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={runSimulation}>Run</Button>
          <Button variant="outline" onClick={pauseSimulation}>Pause</Button>
          <Button variant="outline" onClick={stepSimulation}>Step</Button>
          <Button variant="outline" onClick={resetSimulation}>Reset</Button>
        </div>
      </div>
    </div>
  );
};
