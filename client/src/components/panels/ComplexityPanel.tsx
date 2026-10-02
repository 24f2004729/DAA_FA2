import React from 'react';

export const ComplexityPanel = () => {
  return (
    <div className="p-4 border-t border-[#D9E0E7] bg-[#F7F9FC]">
      <h4 className="text-sm font-bold text-[#1F4E79] mb-2">Complexity Analysis</h4>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div><span className="text-gray-500">Time:</span> <span className="font-mono">O(n)</span></div>
        <div><span className="text-gray-500">Space:</span> <span className="font-mono">O(1)</span></div>
      </div>
    </div>
  );
};
