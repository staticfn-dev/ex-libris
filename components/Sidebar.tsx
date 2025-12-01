import React from 'react';
import { BookOpen, Library, Tag, FilterX, ChevronRight } from 'lucide-react';

interface SidebarProps {
  topics: Record<string, number>; // Topic name -> count
  subTopics: Record<string, number>; // SubTopic name -> count (for current topic)
  selectedTopic: string | null;
  selectedSubTopic: string | null;
  onSelectTopic: (topic: string | null) => void;
  onSelectSubTopic: (subTopic: string | null) => void;
  totalPapers: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  topics, 
  subTopics, 
  selectedTopic, 
  selectedSubTopic, 
  onSelectTopic, 
  onSelectSubTopic, 
  totalPapers 
}) => {
  const sortedTopics = Object.entries(topics).sort((a, b) => (b[1] as number) - (a[1] as number));
  const sortedSubTopics = Object.entries(subTopics).sort((a, b) => (b[1] as number) - (a[1] as number));

  return (
    <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-6 md:h-[calc(100vh-2rem)] md:sticky md:top-4">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2">
        <div className="p-2 bg-slate-900 rounded-lg text-white shadow-lg ring-1 ring-white/10">
          <BookOpen className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 font-serif italic">ex libris</h1>
      </div>

      {/* Navigation */}
      <div className="space-y-1">
        <button
          onClick={() => onSelectTopic(null)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedTopic === null
              ? 'bg-white text-brand-700 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <Library className="w-4 h-4" />
            All Papers
          </div>
          <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
            {totalPapers}
          </span>
        </button>
      </div>

      {/* Topics Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between px-2 mb-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Topics
          </h3>
          {selectedTopic && (
            <button 
              onClick={() => onSelectTopic(null)}
              className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors"
            >
              <FilterX className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
        
        <div className="space-y-1">
          {sortedTopics.length === 0 ? (
            <p className="text-sm text-slate-400 px-3 italic">No topics yet</p>
          ) : (
            sortedTopics.map(([topic, count]) => (
              <div key={topic} className="flex flex-col">
                <button
                  onClick={() => onSelectTopic(topic === selectedTopic ? null : topic)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-sm transition-all ${
                    selectedTopic === topic
                      ? 'bg-brand-50 text-brand-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-100 hover:translate-x-1'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Tag className={`w-3.5 h-3.5 ${selectedTopic === topic ? 'fill-brand-200 text-brand-500' : 'text-slate-400'}`} />
                    <span className="truncate max-w-[120px]">{topic}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{count}</span>
                </button>

                {/* Sub-topics Expansion */}
                {selectedTopic === topic && sortedSubTopics.length > 0 && (
                  <div className="ml-5 mt-1 pl-3 border-l-2 border-slate-100 space-y-0.5 animate-in slide-in-from-top-1 fade-in duration-200 mb-2">
                     {sortedSubTopics.map(([sub, subCount]) => (
                       <button
                         key={sub}
                         onClick={() => onSelectSubTopic(sub === selectedSubTopic ? null : sub)}
                         className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-md transition-colors ${
                           selectedSubTopic === sub
                             ? 'bg-brand-50 text-brand-600 font-medium'
                             : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                         }`}
                       >
                         <span className="truncate">{sub}</span>
                         <span className="text-[9px] opacity-60 ml-2">{subCount}</span>
                       </button>
                     ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};