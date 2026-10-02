import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Pages
import ScenarioSetupPage from './pages/ScenarioSetupPage';
import SimulationWorkspacePage from './pages/SimulationWorkspacePage';
import DatasetInspectorPage from './pages/DatasetInspectorPage';
import AlgorithmDetailPage from './pages/AlgorithmDetailPage';
import CompareLabPage from './pages/CompareLabPage';
import ComplexityLabPage from './pages/ComplexityLabPage';
import CorrectnessLabPage from './pages/CorrectnessLabPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<ScenarioSetupPage />} />
      <Route path="/lab" element={<SimulationWorkspacePage />} />
      <Route path="/dataset" element={<DatasetInspectorPage />} />
      <Route path="/algorithm/:id" element={<AlgorithmDetailPage />} />
      <Route path="/compare" element={<CompareLabPage />} />
      <Route path="/complexity" element={<ComplexityLabPage />} />
      <Route path="/correctness" element={<CorrectnessLabPage />} />
    </Routes>
  );
}

export default App;
