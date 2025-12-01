
import React, { useState, useRef } from 'react';
import { X, Loader2, Link as LinkIcon, Sparkles, FileText, Upload, Hash } from 'lucide-react';
import { analyzePaperUrl, analyzePaperPdf } from '../services/geminiService';
import { Paper } from '../types';

interface AddPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (paper: Paper) => void;
  existingPapers: Paper[];
}

type AddMode = 'url' | 'doi' | 'pdf';

export const AddPaperModal: React.FC<AddPaperModalProps> = ({ isOpen, onClose, onAdd, existingPapers = [] }) => {
  const [mode, setMode] = useState<AddMode>('url');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const reset = () => {
    setInputValue('');
    setError(null);
    setLoading(false);
  };

  const handleTabChange = (newMode: AddMode) => {
    setMode(newMode);
    reset();
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let paperUrl = '';
    let paperMetadata;

    setLoading(true);

    try {
      if (mode === 'url') {
        if (!inputValue.trim()) throw new Error("Please enter a URL");
        paperUrl = inputValue.trim();
        paperMetadata = await analyzePaperUrl(paperUrl);
      } 
      else if (mode === 'doi') {
        if (!inputValue.trim()) throw new Error("Please enter a DOI");
        // Clean DOI input
        const cleanDoi = inputValue.trim().replace(/^(https?:\/\/)?(dx\.)?doi\.org\//, '').replace(/^doi:/, '');
        paperUrl = `https://doi.org/${cleanDoi}`;
        paperMetadata = await analyzePaperUrl(paperUrl);
      } 
      else if (mode === 'pdf') {
        const file = fileInputRef.current?.files?.[0];
        if (!file) throw new Error("Please select a PDF file");
        
        const base64Data = await fileToBase64(file);
        const result = await analyzePaperPdf(base64Data);
        
        paperMetadata = result;
        // Use the found URL or fallback to a google search for the title if AI couldn't find a direct link
        paperUrl = result.url || `https://www.google.com/search?q=${encodeURIComponent(result.title)}`;
      }

      if (!paperMetadata) throw new Error("Failed to retrieve metadata");

      // Check for duplicate title
      const isDuplicate = existingPapers.some(
        p => p.title.toLowerCase().trim() === paperMetadata.title.toLowerCase().trim()
      );

      if (isDuplicate) {
        throw new Error("This paper already exists in your bookshelf");
      }

      const newPaper: Paper = {
        id: crypto.randomUUID(),
        url: paperUrl,
        title: paperMetadata.title,
        summary: paperMetadata.summary,
        authors: paperMetadata.authors,
        topic: paperMetadata.topic,
        subTopic: paperMetadata.subTopic,
        tags: paperMetadata.tags,
        journal: paperMetadata.journal,
        publishDate: paperMetadata.publishDate,
        addedAt: Date.now(),
      };

      onAdd(newPaper);
      reset();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze paper");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Add to Bookshelf</h2>
            <p className="text-xs text-slate-500 mt-1">Import paper via Link, DOI, or PDF</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => handleTabChange('url')}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              mode === 'url' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <LinkIcon className="w-4 h-4" /> Link
            </div>
          </button>
          <button
            onClick={() => handleTabChange('doi')}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              mode === 'doi' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Hash className="w-4 h-4" /> DOI
            </div>
          </button>
          <button
            onClick={() => handleTabChange('pdf')}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              mode === 'pdf' ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" /> PDF
            </div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* URL Input */}
          {mode === 'url' && (
            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-medium text-slate-700 block">Paper URL</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  id="url"
                  type="url"
                  autoFocus
                  required
                  placeholder="https://arxiv.org/abs/..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all text-sm text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>
          )}

          {/* DOI Input */}
          {mode === 'doi' && (
            <div className="space-y-2">
              <label htmlFor="doi" className="text-sm font-medium text-slate-700 block">DOI Number</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  id="doi"
                  type="text"
                  autoFocus
                  required
                  placeholder="10.1038/s41586-..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all text-sm text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>
          )}

          {/* PDF Input */}
          {mode === 'pdf' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block">Upload PDF</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-all group"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-brand-100 transition-colors">
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-brand-600" />
                </div>
                <p className="text-sm font-medium text-slate-700">Click to upload PDF</p>
                <p className="text-xs text-slate-400 mt-1">Max file size 10MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setInputValue(file.name);
                  }}
                />
              </div>
              {inputValue && (
                <div className="flex items-center gap-2 text-sm text-brand-700 bg-brand-50 px-3 py-2 rounded-lg">
                  <FileText className="w-4 h-4" />
                  <span className="truncate">{inputValue}</span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className={`p-3 rounded-lg text-xs ${error.includes("already exists") ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !inputValue}
              className="w-full py-3 bg-slate-900 hover:bg-brand-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-brand-300" />
                  Analyze Paper
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
