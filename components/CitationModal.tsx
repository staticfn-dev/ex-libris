import React, { useState } from 'react';
import { Paper } from '../types';
import { X, Copy, Check, Quote } from 'lucide-react';

interface CitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: Paper;
}

type CitationFormat = 'APA' | 'MLA' | 'BibTeX';

export const CitationModal: React.FC<CitationModalProps> = ({ isOpen, onClose, paper }) => {
  const [format, setFormat] = useState<CitationFormat>('APA');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateCitation = (format: CitationFormat): string => {
    const today = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    const authorText = paper.authors.length > 0 ? paper.authors.join(', ') : 'Unknown Author';
    
    switch (format) {
      case 'APA':
        // Format: Author(s). (n.d.). Title. [URL]
        return `${authorText}. (n.d.). ${paper.title}. Retrieved from ${paper.url}`;
      
      case 'MLA':
        // Format: Author(s). "Title." Web. Date Accessed <URL>.
        return `${authorText}. "${paper.title}." Web. Accessed ${today}. <${paper.url}>.`;
      
      case 'BibTeX':
        // Format: @misc{...}
        const firstAuthorLast = paper.authors[0]?.split(' ').pop()?.toLowerCase() || 'unknown';
        const titleSlug = paper.title.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        const id = `${firstAuthorLast}${new Date().getFullYear()}${titleSlug}`;
        
        return `@misc{${id},
  title = {${paper.title}},
  author = {${paper.authors.join(' and ')}},
  howpublished = {\\url{${paper.url}}},
  note = {Accessed: ${today}}
}`;
      default:
        return '';
    }
  };

  const citationText = generateCitation(format);

  const handleCopy = () => {
    navigator.clipboard.writeText(citationText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-slate-900/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-brand-100 text-brand-600 rounded-md">
              <Quote className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-800">Cite Paper</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {/* Format Tabs */}
          <div className="flex gap-2 mb-4 p-1 bg-slate-100 rounded-lg">
            {(['APA', 'MLA', 'BibTeX'] as CitationFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => { setFormat(f); setCopied(false); }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  format === f 
                    ? 'bg-white text-brand-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Citation Text Area */}
          <div className="relative group">
            <textarea
              readOnly
              value={citationText}
              className="w-full h-32 p-3 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 resize-none font-mono leading-relaxed"
            />
            
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-2 bg-white border border-slate-200 shadow-sm rounded-md hover:bg-slate-50 transition-all flex items-center gap-1.5 group/btn"
              title="Copy to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-xs font-medium text-green-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-brand-500" />
                  <span className="text-xs font-medium text-slate-500 group-hover/btn:text-brand-600">Copy</span>
                </>
              )}
            </button>
          </div>
          
          <p className="text-[10px] text-slate-400 mt-3 text-center">
            Note: Citations are generated automatically and may require manual verification.
          </p>
        </div>
      </div>
    </div>
  );
};