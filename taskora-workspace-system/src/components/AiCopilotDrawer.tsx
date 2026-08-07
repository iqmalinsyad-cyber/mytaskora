import React, { useState } from 'react';
import { X, Sparkles, Send, Bot, User, CheckCircle2, RefreshCw } from 'lucide-react';
import { AduanCase } from '../types';

interface AiCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cases: AduanCase[];
}

export const AiCopilotDrawer: React.FC<AiCopilotDrawerProps> = ({
  isOpen,
  onClose,
  cases,
}) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'Selamat sejahtera! Saya Pembantu AI Copilot Nova Workspace. Ada apa yang boleh saya bantu mengenai analisis kes aduan, penyediaan format catatan, atau draf surat maklum balas hari ini?',
    },
  ]);

  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userText = inputMsg.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputMsg('');
    setIsLoading(true);

    try {
      const summaryContext = {
        totalCases: cases.length,
        pendingCases: cases.filter(c => c.status !== 'Selesai').length,
        criticalCases: cases.filter(c => c.prioriti === 'Kritikal').map(c => ({ id: c.noRujukan, title: c.tajuk })),
      };

      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          context: summaryContext,
        }),
      });

      const data = await res.json();
      const aiReply = data.reply || 'Maaf, tiada maklum balas diterima daripada model AI.';
      setMessages(prev => [...prev, { sender: 'ai', text: aiReply }]);
    } catch (e) {
      console.error('AI Copilot error:', e);
      setMessages(prev => [...prev, { sender: 'ai', text: 'Ralat semasa berhubung dengan perkhidmatan AI Copilot.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'Ringkaskan kes aduan kritikal minggu ini',
    'Bagaimana tatacara pengurusan aduan SLA lewat?',
    'Sediakan draf surat penutupan aduan awam',
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-slide-left">
      {/* Drawer Header */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold tracking-tight">AI Copilot Workspace</h3>
            <p className="text-[10px] text-slate-300">Dipertuduhkan oleh Gemini 2.5 Flash</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs bg-slate-50/50">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.sender === 'ai' && (
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
              m.sender === 'user'
                ? 'bg-indigo-600 text-white rounded-tr-none font-medium'
                : 'bg-white text-slate-800 border border-slate-200 shadow-xs rounded-tl-none'
            }`}>
              {m.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 p-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            <span>AI Copilot sedang memikirkan jawapan...</span>
          </div>
        )}
      </div>

      {/* Prompt Suggestions */}
      <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => setInputMsg(prompt)}
            className="px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold whitespace-nowrap border border-indigo-100 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
        <input
          type="text"
          placeholder="Tanya AI Copilot..."
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          className="flex-1 px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  );
};
