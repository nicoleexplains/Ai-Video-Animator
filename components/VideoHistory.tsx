import React from 'react';
import { HistoryItem } from '../App';
import { TrashIcon } from './icons';

interface VideoHistoryProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

export const VideoHistory: React.FC<VideoHistoryProps> = ({ history, onSelect, onClear }) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <section className="mt-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-slate-300">Animation History</h2>
        <button 
          onClick={onClear} 
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors"
          aria-label="Clear all animation history"
        >
          <TrashIcon className="w-4 h-4" />
          Clear History
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6">
        {history.map((item) => (
          <div 
            key={item.id} 
            className="group cursor-pointer"
            onClick={() => onSelect(item)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(item)}
            aria-label={`View animation for image from ${new Date(parseInt(item.id)).toLocaleString()}`}
          >
            <div className="aspect-square bg-slate-800 rounded-lg overflow-hidden relative shadow-lg group-hover:shadow-brand-500/30 transition-all duration-300 transform group-hover:scale-105">
              <img 
                src={`data:image/jpeg;base64,${item.imageBase64}`} 
                alt="Animation thumbnail"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-white/80">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="mt-2 text-center text-xs text-slate-400">
                <p 
                    className="font-mono bg-slate-700/50 inline-block px-2 py-0.5 rounded text-slate-300 truncate" 
                    title={item.modelUsed}
                >
                    {item.modelUsed.replace('veo-3.1-fast-generate-preview', 'Veo Fast')}
                </p>
                <p className="mt-1">
                    ~{(item.generationTime / 1000).toFixed(1)}s
                </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
