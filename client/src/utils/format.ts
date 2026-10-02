import { AlgorithmEventType } from '@bank-opt/shared';

export const formatCurrency = (n: number): string => `₹${n.toLocaleString('en-IN')}`;

export const formatEventType = (type: AlgorithmEventType): string => {
  return type.replace(/_/g, ' ');
};

export const getEventColor = (type: AlgorithmEventType): string => {
  switch(type) {
    case 'SELECT': return 'bg-[#2A7F7F] text-white';
    case 'REJECT': return 'bg-[#C62828] text-white';
    case 'PRUNE': return 'bg-[#ED6C02] text-white';
    case 'BEST_UPDATE': return 'bg-[#2E7D32] text-white';
    default: return 'bg-[#1F4E79] text-white';
  }
};

export const formatComplexity = (c: string): string => {
  return c.replace(/n/g, '<i>n</i>').replace(/\^2/g, '<sup>2</sup>');
};
