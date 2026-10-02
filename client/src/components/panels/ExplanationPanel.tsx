import React from 'react';
import { useBankOptStore } from '../../store';
import { Badge } from '../common';
import { getEventColor, formatEventType } from '../../utils/format';

export const ExplanationPanel = () => {
  const { currentStep, events } = useBankOptStore();
  const currentEvent = events[currentStep - 1];

  return (
    <div className="w-[300px] bg-white border-l border-[#D9E0E7] flex flex-col h-full">
      <div className="p-4 border-b border-[#D9E0E7]">
        <h3 className="font-bold text-[#1F4E79] mb-2">Step {currentStep} of {events.length}</h3>
        {currentEvent && (
          <>
            <Badge className={getEventColor(currentEvent.type)}>
              {formatEventType(currentEvent.type)}
            </Badge>
            <p className="text-sm mt-3 text-[#2A3038]">{currentEvent.explanation}</p>
          </>
        )}
      </div>
      <div className="p-4 flex-1 overflow-y-auto">
        <h4 className="text-sm font-semibold mb-2">Partial Solution</h4>
        <div className="flex flex-wrap gap-1">
          {currentEvent?.currentSolution?.map(id => (
            <Badge key={id} className="bg-[#E5E9F0] text-[#1F4E79]">{id}</Badge>
          ))}
        </div>
      </div>
    </div>
  );
};
