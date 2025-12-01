import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Github, X } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { PaperCard } from './components/PaperCard';
import { AddPaperModal } from './components/AddPaperModal';
import { Paper } from './types';

function App() {
  // State
  const [papers, setPapers] = useState<Paper[]>(() => {
    const saved = localStorage.getItem('research-stack-papers');
    const initial = saved ? JSON.parse(saved) : [];
    
    // Migration: Ensure older papers have a 'topic'
    // Default to 'Biology' or the first tag if available
    return initial.map((p: any) => ({
      ...p,
      topic: p.topic || (p.tags && p.tags.length > 0 ? p.tags[0] : "Biology"),
      tags: p.tags || []
    }));
  });
  
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedSubTopic, setSelectedSubTopic] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Effects
  useEffect(() => {
    localStorage.setItem('research-stack-papers', JSON.stringify(papers));
  }, [papers]);

  // Derived State
  const topics = useMemo(() => {
    const topicCounts: Record<string, number> = {};
    papers.forEach(p => {
      // Only count the main topic for the sidebar
      const t = p.topic;
      if (t) {
        topicCounts[t] = (topicCounts[t] || 0) + 1;
      }
    });
    return topicCounts;
  }, [papers]);

  const subTopics = useMemo(() => {
    if (!selectedTopic) return {};
    const counts: Record<string, number> = {};
    papers.forEach(p => {
      if (p.topic === selectedTopic && p.subTopic) {
        counts[p.subTopic] = (counts[p.subTopic] || 0) + 1;
      }
    });
    return counts;
  }, [papers, selectedTopic]);

  const filteredPapers = useMemo(() => {
    return papers
      .filter(p => {
        // Filter by the main TOPIC
        const matchesTopic = selectedTopic ? p.topic === selectedTopic : true;
        
        // Filter by SUB-TOPIC
        const matchesSubTopic = selectedSubTopic ? p.subTopic === selectedSubTopic : true;

        // Filter by TAG
        const matchesTag = selectedTag ? p.tags.includes(selectedTag) : true;

        const matchesSearch = searchQuery 
          ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            p.authors.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
            p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
            p.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.subTopic && p.subTopic.toLowerCase().includes(searchQuery.toLowerCase()))
          : true;
        return matchesTopic && matchesSubTopic && matchesTag && matchesSearch;
      })
      .sort((a, b) => b.addedAt - a.addedAt);
  }, [papers, selectedTopic, selectedSubTopic, selectedTag, searchQuery]);

  // Handlers
  const handleAddPaper = (newPaper: Paper) => {
    setPapers(prev => [newPaper, ...prev]);
  };

  const handleDeletePaper = (id: string) => {
    setPapers(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdateMetadata = (id: string, newTopic: string, newSubTopic: string | undefined, newTags: string[]) => {
    setPapers(prev => prev.map(p => 
      p.id === id ? { ...p, topic: newTopic, subTopic: newSubTopic, tags: newTags } : p
    ));
  };

  const handleTopicSelection = (topic: string | null) => {
    setSelectedTopic(topic);
    setSelectedSubTopic(null); // Reset subtopic when topic changes
    setSelectedTag(null); // Clear tag filter
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    setSelectedTopic(null); // Clear topic to show global results for this tag
    setSelectedSubTopic(null);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-brand-100 selection:text-brand-900">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <Sidebar 
          topics={topics} 
          subTopics={subTopics}
          selectedTopic={selectedTopic} 
          selectedSubTopic={selectedSubTopic}
          onSelectTopic={handleTopicSelection} 
          onSelectSubTopic={setSelectedSubTopic}
          totalPapers={papers.length}
        />

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          
          {/* Top Bar */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search by title, author, or tag..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-brand-300 focus:ring-4 focus:ring-brand-50/50 outline-none transition-all shadow-sm"
              />
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4" />
              Add Paper
            </button>
          </header>

          {/* Active Tag Banner */}
          {selectedTag && (
            <div className="mb-6 flex items-center justify-between px-4 py-3 bg-brand-50 border border-brand-100 rounded-lg text-sm text-brand-700 animate-in fade-in slide-in-from-top-2 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Filtered by tag:</span>
                <span className="px-2 py-0.5 bg-white rounded-md border border-brand-200 font-bold text-brand-800">#{selectedTag}</span>
              </div>
              <button 
                onClick={() => setSelectedTag(null)}
                className="p-1 text-brand-400 hover:text-brand-700 hover:bg-brand-100 rounded-full transition-colors"
                title="Clear filter"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Content Grid */}
          <div className="columns-1 md:columns-2 xl:columns-3 gap-6 pb-20">
            {filteredPapers.length > 0 ? (
              filteredPapers.map(paper => (
                <PaperCard 
                  key={paper.id} 
                  paper={paper} 
                  onDelete={handleDeletePaper}
                  onUpdateMetadata={handleUpdateMetadata}
                  onTagClick={handleTagClick}
                />
              ))
            ) : (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center text-slate-400">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Github className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-lg font-medium text-slate-600">No papers found</p>
                <p className="text-sm">
                  {papers.length === 0 
                    ? "Your bookshelf is empty. Add a research paper URL to get started." 
                    : "Try adjusting your search or filters."}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      <AddPaperModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddPaper} 
        existingPapers={papers}
      />
    </div>
  );
}

export default App;