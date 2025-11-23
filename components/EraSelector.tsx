import React from 'react';
import { HistoricalEra, SUPPORTED_ERAS } from '../types';
import { Clock } from 'lucide-react';

interface EraSelectorProps {
  selectedEra: string | null;
  onSelect: (eraId: string) => void;
  disabled: boolean;
}

const EraSelector: React.FC<EraSelectorProps> = ({ selectedEra, onSelect, disabled }) => {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4 text-slate-300">
        <Clock size={20} />
        <h3 className="text-lg font-semibold">Select Destination Era</h3>
      </div>
      
      <div className="flex overflow-x-auto gap-4 pb-4 snap-x custom-scrollbar touch-pan-x">
        {SUPPORTED_ERAS.map((era) => (
          <button
            key={era.id}
            onClick={() => onSelect(era.id)}
            disabled={disabled}
            className={`
              relative p-4 rounded-xl text-left transition-all duration-200 border
              flex flex-col gap-2 h-40 justify-between shrink-0 w-40 md:w-48 snap-start
              ${selectedEra === era.id 
                ? 'bg-indigo-900/50 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-[1.02]' 
                : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-500'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span className={`text-sm font-bold leading-tight ${selectedEra === era.id ? 'text-indigo-300' : 'text-slate-200'}`}>
              {era.name}
            </span>
            <span className="text-xs text-slate-400 leading-tight line-clamp-3">
              {era.description}
            </span>
            {selectedEra === era.id && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EraSelector;