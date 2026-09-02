import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ShieldCheck, Cpu, CornerDownLeft } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'buyer' | 'system';
  text: string;
  timestamp: string;
  sku?: string;
  quantity?: number;
}

export const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init_1',
      sender: 'system',
      text: 'AgentRail Growth Agent Session Initialized. RailFence Policy Engine is actively monitoring all transaction proposals.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'buyer',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) {
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const samplePrompts = [
    'I want to purchase 1 High-Performance Laptop (LAPTOP-PRO-15)',
    'Can I get a bundle discount if I add a Docking Station (DOCK-THUNDER-4)?',
    'Request 10 Laptops with 40% discount for enterprise evaluation',
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Panel Header */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Buyer Agent Terminal
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live Session
              </span>
            </h2>
            <p className="text-xs text-slate-400">Session: <span className="font-mono text-slate-300">sess_buyer_01</span></p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 border border-slate-700/60 rounded-md text-xs text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium text-[11px]">RailFence Protected</span>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[350px] max-h-[550px] bg-slate-950/40">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'buyer' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center space-x-1.5 mb-1 px-1">
              {msg.sender === 'buyer' ? (
                <>
                  <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                  <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
                    Buyer <User className="w-3 h-3 text-slate-400" />
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-emerald-400" /> System Engine
                  </span>
                  <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                </>
              )}
            </div>

            <div
              className={`max-w-[85%] px-3.5 py-2.5 rounded-lg text-xs leading-relaxed ${
                msg.sender === 'buyer'
                  ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-tr-none'
                  : 'bg-slate-800/90 border border-slate-700/60 text-slate-300 rounded-tl-none font-mono'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 bg-slate-900 border-t border-slate-800/80">
        <p className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
          <span>Sample Buyer Prompts</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="text-[11px] text-slate-300 bg-slate-800 hover:bg-slate-750 hover:text-white px-2.5 py-1 rounded border border-slate-700/70 transition-colors text-left truncate max-w-full"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-3 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type buyer intent or catalog request..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim()}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <CornerDownLeft className="w-3 h-3" /> Press Enter to transmit message
          </span>
          <span>Growth Agent &amp; Policy Pipeline ready</span>
        </div>
      </div>
    </div>
  );
};
