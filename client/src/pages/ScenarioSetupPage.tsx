import React from 'react';

export default function ScenarioSetupPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-primary">BANK-OPT</h1>
      <p className="text-secondary mt-2">Algorithm Laboratory</p>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border border-border p-4 rounded bg-white">
          <h2 className="text-xl font-semibold mb-4">Manual Configuration</h2>
          <button className="bg-primary text-white px-4 py-2 rounded">Generate Scenario</button>
        </div>
        <div className="border border-border p-4 rounded bg-white">
          <h2 className="text-xl font-semibold mb-4">Preset Scenarios</h2>
          <button className="bg-secondary text-white px-4 py-2 rounded">Load Preset</button>
        </div>
      </div>
    </div>
  );
}
