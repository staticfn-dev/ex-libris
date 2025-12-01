import React, { useState, useMemo } from 'react';
import { Paper } from '../types';
import { ExternalLink, Trash2, Users, Pencil, Check, X as XIcon, Plus, Tag, ArrowUpRight, ChevronRight } from 'lucide-react';

interface PaperCardProps {
  paper: Paper;
  onDelete: (id: string) => void;
  onUpdateMetadata: (id: string, topic: string, subTopic: string | undefined, tags: string[]) => void;
  onTagClick: (tag: string) => void;
}

const TOPIC_SUGGESTIONS = ["Neuroscience", "Immunology", "Biology", "Developmental Biology", "Genetics", "Bioinformatics"];

// Deterministically generate a design based on the paper ID
const getCardDesign = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const designs = [
    // Style 1: Blue Geometric Wash
    {
      container: "bg-white border-blue-100 hover:border-blue-300",
      style: { backgroundImage: "radial-gradient(circle at top right, #f0f9ff 0%, transparent 45%)" },
      bar: "bg-blue-500"
    },
    // Style 2: Emerald Soft Linear
    {
      container: "bg-white border-emerald-100 hover:border-emerald-300",
      style: { backgroundImage: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 60%)" },
      bar: "bg-emerald-500"
    },
    // Style 3: Amber Warm Glow
    {
      container: "bg-white border-amber-100 hover:border-amber-300",
      style: { backgroundImage: "radial-gradient(circle at top left, #fffbeb 0%, transparent 50%)" },
      bar: "bg-amber-500"
    },
    // Style 4: Violet Corner
    {
      container: "bg-white border-violet-100 hover:border-violet-300",
      style: { backgroundImage: "linear-gradient(to bottom right, #f5f3ff 0%, #ffffff 50%, #f5f3ff 100%)" },
      bar: "bg-violet-500"
    },
    // Style 5: Rose Gradient
    {
      container: "bg-white border-rose-100 hover:border-rose-300",
      style: { backgroundImage: "linear-gradient(to right, #fff1f2 0%, #ffffff 100%)" },
      bar: "bg-rose-500"
    },
    // Style 6: Slate Minimal Dot Pattern
    {
      container: "bg-white border-slate-200 hover:border-slate-400",
      style: { 
        backgroundImage: "radial-gradient(#e2e8f0 1.5px, transparent 1.5px)",
        backgroundSize: "24px 24px"
      },
      bar: "bg-slate-500"
    },
    // Style 7: Cyan Top Wash
    {
      container: "bg-white border-cyan-100 hover:border-cyan-300",
      style: { backgroundImage: "linear-gradient(to bottom, #ecfeff 0%, #ffffff 150px)" },
      bar: "bg-cyan-500"
    },
    // Style 8: Fuchsia Angle
    {
      container: "bg-white border-fuchsia-100 hover:border-fuchsia-300",
      style: { backgroundImage: "linear-gradient(225deg, #fdf4ff 0%, #ffffff 50%)" },
      bar: "bg-fuchsia-500"
    },
    // Style 9: Subtle Grid
    {
      container: "bg-white border-slate-200 hover:border-indigo-200",
      style: {
        backgroundImage: "linear-gradient(0deg, transparent 23px, #f1f5f9 24px), linear-gradient(90deg, transparent 23px, #f1f5f9 24px)",
        backgroundSize: "24px 24px"
      },
      bar: "bg-indigo-500"
    }
  ];
  
  return designs[Math.abs(hash) % designs.length];
};

export const PaperCard: React.FC<PaperCardProps> = ({ paper, onDelete, onUpdateMetadata, onTagClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit State
  const [editedTopic, setEditedTopic] = useState(paper.topic);
  const [editedSubTopic, setEditedSubTopic] = useState(paper.subTopic || '');
  const [editedTags, setEditedTags] = useState(paper.tags);
  const [newTagInput, setNewTagInput] = useState('');

  const design = useMemo(() => getCardDesign(paper.id), [paper.id]);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(paper.id);
  };

  const startEditing = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditedTopic(paper.topic);
    setEditedSubTopic(paper.subTopic || '');
    setEditedTags(paper.tags);
    setIsEditing(true);
  };

  const saveChanges = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onUpdateMetadata(paper.id, editedTopic, editedSubTopic || undefined, editedTags);
    setIsEditing(false);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(false);
    setNewTagInput('');
  };

  const addTag = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = newTagInput.trim();
    if (trimmed && !editedTags.includes(trimmed)) {
      setEditedTags([...editedTags, trimmed]);
      setNewTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditedTags(editedTags.filter(t => t !== tagToRemove));
  };
  
  const promoteTagToSubTopic = (tag: string) => {
    setEditedSubTopic(tag);
  };

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.preventDefault();
    e.stopPropagation();
    onTagClick(tag);
  };

  const getDisplayAuthors = () => {
    if (isHovered || paper.authors.length <= 5) {
      return paper.authors.join(', ');
    }
    const firstThree = paper.authors.slice(0, 3).join(', ');
    const last = paper.authors[paper.authors.length - 1];
    return `${firstThree}, ..., ${last}`;
  };

  return (
    <div 
      className={`relative group rounded-xl shadow-sm border overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col break-inside-avoid mb-6 ${design.container}`}
      style={design.style}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`h-1.5 w-full transition-colors duration-300 ${design.bar}`} />
      
      <div className="p-5 flex-1 flex flex-col relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start gap-4 mb-2 relative">
           <div className="flex-1 flex gap-3 min-w-0">
              <a 
                href={paper.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 min-w-0 text-lg font-semibold text-slate-900 leading-tight hover:text-brand-700 transition-colors flex items-start gap-2 group/link"
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={() => setIsHovered(true)}
              >
                <span className="break-words">{paper.title}</span>
                <ExternalLink className="w-4 h-4 mt-1 opacity-40 flex-shrink-0 group-hover/link:opacity-100 transition-opacity" />
              </a>
          </div>
          
          <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-white/60 backdrop-blur-sm rounded-lg pl-1 h-8">
            <button onClick={handleDelete} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer" title="Remove paper" type="button">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Authors */}
        <div className="flex items-start gap-2 text-sm text-slate-600 mb-4 font-medium">
          <Users className="w-3.5 h-3.5 mt-1 flex-shrink-0 opacity-70" />
          <span className="leading-relaxed transition-all duration-300">
            {getDisplayAuthors()}
          </span>
        </div>

        {/* Abstract */}
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isHovered ? 'max-h-[1000px] opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'}`}>
          <div className="p-3 bg-white/80 backdrop-blur-sm rounded-lg text-sm text-slate-800 leading-relaxed border border-slate-200/50 shadow-sm max-h-[60vh] overflow-y-auto">
            <span className="font-bold block mb-1 text-slate-900 text-xs uppercase tracking-wider sticky top-0 bg-white/95 py-1 z-10">Abstract</span>
            <div className="whitespace-pre-wrap">{paper.summary}</div>
          </div>
        </div>

        <div className="mt-auto" />

        {/* Metadata Section */}
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          {isEditing ? (
            <div className="bg-white/90 backdrop-blur-sm p-2 rounded-lg border border-brand-200 space-y-2 animate-in fade-in duration-200 shadow-sm">
              {/* Topic Edit */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Topic</label>
                <input 
                  type="text"
                  list="topic-suggestions"
                  value={editedTopic}
                  onChange={(e) => setEditedTopic(e.target.value)}
                  className="w-full text-xs p-1.5 rounded border border-slate-300 focus:border-brand-500 outline-none"
                  placeholder="Main Topic"
                />
                <datalist id="topic-suggestions">
                  {TOPIC_SUGGESTIONS.map(t => <option key={t} value={t} />)}
                </datalist>
              </div>

              {/* Sub-Topic Edit */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Sub-topic</label>
                <input 
                  type="text"
                  value={editedSubTopic}
                  onChange={(e) => setEditedSubTopic(e.target.value)}
                  className="w-full text-xs p-1.5 rounded border border-slate-300 focus:border-brand-500 outline-none"
                  placeholder="Specific Sub-field"
                />
              </div>

              {/* Tags Edit */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editedTags.map((tag, idx) => (
                    <span key={idx} className="group/tag px-2 py-1 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md flex items-center gap-1">
                      #{tag}
                      <button 
                        onClick={() => promoteTagToSubTopic(tag)} 
                        className="p-0.5 text-brand-400 hover:text-brand-600 hover:bg-brand-50 rounded hidden group-hover/tag:block"
                        title="Set as Sub-topic"
                      >
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeTag(tag)} className="p-0.5 hover:bg-red-50 hover:text-red-500 rounded-full">
                        <XIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag(e)}
                    placeholder="Add tag..."
                    className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded focus:border-brand-500 focus:outline-none"
                  />
                  <button onClick={addTag} className="p-1 bg-slate-200 rounded hover:bg-slate-300">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/50">
                <button onClick={cancelEditing} className="p-1 text-slate-400 hover:text-slate-600">
                  <XIcon className="w-4 h-4" />
                </button>
                <button onClick={saveChanges} className="p-1 text-brand-600 hover:text-brand-700 bg-brand-50 rounded">
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 group/meta">
               {/* Topic & Sub-topic Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-wrap gap-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white/60 border border-slate-200/60 text-slate-800 shadow-sm backdrop-blur-sm">
                    <Tag className="w-3 h-3 text-slate-500" />
                    {paper.topic}
                  </span>
                  {paper.subTopic && (
                    <>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-white/40 border border-slate-200/40 text-slate-700">
                        {paper.subTopic}
                      </span>
                    </>
                  )}
                </div>
                <button
                  onClick={startEditing}
                  className="p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover/meta:opacity-100 transition-opacity"
                  title="Edit metadata"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>

              {/* Tags List */}
              <div className="flex flex-wrap items-center gap-2">
                {paper.tags.map((tag, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => handleTagClick(e, tag)}
                    className="px-2 py-0.5 text-[11px] font-medium text-slate-600 bg-white/50 rounded-md border border-slate-200/50 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-colors cursor-pointer backdrop-blur-[2px]"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-5 py-2 border-t border-slate-200/50 bg-white/30 backdrop-blur-sm flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-widest font-semibold relative z-10">
        <span className="truncate max-w-[150px]">{paper.journal || "Research Paper"}</span>
        <span>{paper.publishDate || new Date(paper.addedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
};