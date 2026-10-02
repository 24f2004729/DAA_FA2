import React from 'react';
import { Link } from 'react-router-dom';
import { useBankOptStore } from '../../store';
import { Button } from '../common';

export const Navbar = () => {
  const scenario = useBankOptStore(s => s.scenario);
  return (
    <div className="h-16 bg-white border-b border-[#D9E0E7] flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-[#1F4E79]">BANK-OPT <span className="text-[#2A7F7F] font-normal">| Algorithm Laboratory</span></h1>
        {scenario && <div className="ml-4 text-sm font-mono bg-[#F7F9FC] px-2 py-1 rounded">Seed: {scenario.seed}</div>}
      </div>
      <div className="flex items-center gap-4">
        <Link to="/"><Button variant="outline">New Scenario</Button></Link>
        <Link to="/dataset"><Button variant="outline">Dataset Inspector</Button></Link>
        <Link to="/compare"><Button variant="outline">Compare Mode</Button></Link>
      </div>
    </div>
  );
};
