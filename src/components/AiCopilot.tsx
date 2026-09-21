import React, { useState } from 'react';
import { Bot, Send, Sparkles, Terminal, HelpCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AiCopilotProps {
  serviceName: string;
  darkMode?: boolean;
}

export function AiCopilot({ serviceName, darkMode }: AiCopilotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I am your AI WhatsApp Windows Service & PHP Daemon Copilot. Ask me how to configure WinSW, fix Windows Service error 1067, handle long-running memory leaks in PHP CLIs, or integrate Baileys/Evolution API webhooks!`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    "How to fix Windows Service error 1067 with PHP?",
    "How to prevent memory leaks in long-running PHP daemons?",
    "Write a PHP snippet to handle incoming WhatsApp webhook JSON payload",
    "How to install WinSW as a Windows Service step-by-step?"
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          context: { serviceName }
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error || 'Failed to get AI response'}` }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Network Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-2xl border shadow-sm p-6 sm:p-8 flex flex-col h-[600px] transition-colors duration-200 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-slate-800'}`}>
      <div className={`flex items-center justify-between pb-6 border-b mb-4 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <div>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <Bot className="w-5 h-5 text-emerald-600" />
            AI WhatsApp & Windows Service Copilot
          </h2>
          <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Powered by Gemini AI to assist with PHP daemon architecture and Windows service troubleshooting.
          </p>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2 mb-4">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
              darkMode 
                ? 'bg-slate-950 hover:bg-emerald-950/60 hover:text-emerald-300 text-slate-300 border-slate-800' 
                : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-emerald-600" />
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className={`flex-1 overflow-y-auto space-y-4 p-4 rounded-xl border mb-4 font-mono text-xs ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className={`p-3.5 rounded-xl max-w-[85%] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-slate-900 text-white font-sans text-sm border border-slate-700'
                  : darkMode 
                    ? 'bg-slate-900 text-slate-200 border border-slate-800 whitespace-pre-wrap font-sans text-sm' 
                    : 'bg-white text-slate-800 border border-slate-200 whitespace-pre-wrap font-sans text-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 items-center text-slate-400">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <span className="text-xs italic">Gemini is analyzing Windows service & PHP configuration...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about PHP sync daemons, NSSM, WinSW, or WhatsApp APIs..."
          className={`flex-1 px-4 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all ${
            darkMode 
              ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:bg-slate-950' 
              : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white'
          }`}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-xl transition-all flex items-center gap-2 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </form>
    </div>
  );
}
