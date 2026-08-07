import React, { useState, useEffect } from 'react';
import { Search, X, ShieldAlert, FileText, ChevronRight } from 'lucide-react';
import { AduanCase } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: AduanCase[];
  onSelectCase: (aduan: AduanCase) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  cases,
  onSelectCase,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const results = query.trim()
    ? cases.filter(c =>
        c.noRujukan.toLowerCase().includes(query.toLowerCase()) ||
        c.tajuk.toLowerCase().includes(query.toLowerCase()) ||
        c.namaPengadu.toLowerCase().includes(query.toLowerCase()) ||
        c.penerangan.toLowerCase().includes(query.toLowerCase())
      )
    : cases.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder="Cari rujukan (cth: ADV-2026-089), tajuk, pengadu..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm font-semibold text-slate-900 focus:outline-none placeholder:text-slate-400"
          />
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results */}
        <div className="p-3 max-h-80 overflow-y-auto space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {query.trim() ? `Keputusan Carian (${results.length})` : 'Aduan Terkini Workspace'}
          </div>

          {results.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              Tiada aduan padan untuk "{query}"
            </div>
          ) : (
            results.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  onSelectCase(c);
                  onClose();
                }}
                className="w-full p-3 rounded-xl hover:bg-indigo-50/50 flex items-center justify-between text-left transition-colors group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {c.noRujukan}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">{c.kategori}</span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 mt-1 line-clamp-1 group-hover:text-indigo-600">
                    {c.tajuk}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Pengadu: {c.namaPengadu} • Status: {c.status}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
