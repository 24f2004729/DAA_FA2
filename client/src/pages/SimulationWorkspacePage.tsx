import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { AlgorithmSidebar } from '../components/layout/AlgorithmSidebar';
import { SimulationCanvas } from '../components/visualization';
import { ExplanationPanel } from '../components/panels/ExplanationPanel';
import { ComplexityPanel } from '../components/panels/ComplexityPanel';
import { MetricsStrip } from '../components/panels/MetricsStrip';

export default function SimulationWorkspacePage() {
  return (
    <div className="h-screen flex flex-col bg-canvas text-charcoal">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <AlgorithmSidebar />
        <div className="flex-1 flex flex-col">
          <SimulationCanvas />
        </div>
        <div className="flex flex-col w-[300px]">
          <div className="flex-1 overflow-hidden">
            <ExplanationPanel />
          </div>
          <ComplexityPanel />
        </div>
      </div>
      <MetricsStrip />
    </div>
  );
}
