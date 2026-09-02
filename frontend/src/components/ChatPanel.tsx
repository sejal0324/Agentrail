import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ShieldCheck, Cpu, CornerDownLeft, AlertTriangle } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'buyer' | 'system';
  text: string;
  timestamp: string;
  proposal?: any;
  evaluation?: {
    status?: 'APPROVED' | 'BLOCKED';
    reasons?: string[];
    contractHash?: string;
  } | null;
  razorpayOrder?: {
    success?: boolean;
    orderId?: string;
    amount?: number;
    currency?: string;
    error?: string;
  } | null;
  isError?: boolean;
}

interface ChatPanelProps {
  onTransactionComplete?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ onTransactionComplete }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init_1',
      sender: 'system',
      text: 'AgentRail Growth Agent Session Initialized. RailFence Policy Engine is actively monitoring all transaction proposals.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text || isLoading) return;

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
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          sessionId: 'sess_buyer_01',
          buyerId: 'buyer_default',
        }),
      });

      if (!response.ok) {
        let errorText = `HTTP Error ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson.error) errorText = errJson.error;
        } catch (e) {}
        throw new Error(errorText);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to process chat message');
      }

      const systemMsg: ChatMessage = {
        id: `sys_${Date.now()}`,
        sender: 'system',
        text: data.text || 'Message processed by Growth Agent.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        proposal: data.proposal || null,
        evaluation: data.evaluation || null,
        razorpayOrder: data.razorpayOrder || null,
      };

      setMessages((prev) => [...prev, systemMsg]);

      // Call refetch to update telemetry cards and decision trace table immediately
      if (onTransactionComplete) {
        onTransactionComplete();
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'system',
        text: `Pipeline Connection Error: ${err.message || 'Unable to connect to /api/chat'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
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
                  : msg.isError
                  ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-tl-none font-mono'
                  : 'bg-slate-800/90 border border-slate-700/60 text-slate-300 rounded-tl-none font-mono'
              }`}
            >
              {msg.text}

              {/* Proposal Summary if present */}
              {msg.proposal && (
                <div className="mt-2.5 pt-2 border-t border-slate-700/60 text-[11px] font-sans space-y-1">
                  <div className="text-slate-300 font-semibold flex items-center justify-between">
                    <span>Transaction Proposal</span>
                    {typeof msg.proposal.proposedTotal === 'number' && (
                      <span className="font-mono text-emerald-400">
                        ₹{msg.proposal.proposedTotal.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  {msg.proposal.items && Array.isArray(msg.proposal.items) && msg.proposal.items.length > 0 && (
                    <div className="text-slate-400 text-[10px] space-y-0.5">
                      {msg.proposal.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between font-mono">
                          <span>{item.sku} × {item.quantity}</span>
                          {typeof item.proposedUnitPrice === 'number' && (
                            <span>₹{(item.proposedUnitPrice * item.quantity).toLocaleString('en-IN')}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Evaluation Status & Policy Reasons */}
              {msg.evaluation && (
                <div className="mt-2.5 pt-2 border-t border-slate-700/60 text-[11px] font-sans space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">RailFence:</span>
                    {msg.evaluation.status === 'APPROVED' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <ShieldCheck className="w-3 h-3" /> APPROVED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        <AlertTriangle className="w-3 h-3" /> BLOCKED
                      </span>
                    )}
                  </div>

                  {msg.evaluation.reasons && msg.evaluation.reasons.length > 0 && (
                    <div className="text-slate-300 text-[11px] bg-slate-900/60 p-1.5 rounded border border-slate-800">
                      <span className="text-slate-400 font-medium">Policy Note: </span>
                      {msg.evaluation.reasons.join('; ')}
                    </div>
                  )}

                  {msg.razorpayOrder?.orderId && (
                    <div className="text-emerald-400 font-mono text-[10px] flex items-center gap-1 pt-0.5">
                      <span className="text-slate-400">Razorpay Order ID:</span>
                      <span className="bg-emerald-950/60 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">
                        {msg.razorpayOrder.orderId}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Processing/Loading state indicator */}
        {isLoading && (
          <div className="flex items-start flex-col">
            <div className="flex items-center space-x-1.5 mb-1 px-1">
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-emerald-400 animate-pulse" /> System Engine
              </span>
              <span className="text-[10px] text-slate-400">Processing...</span>
            </div>
            <div className="bg-slate-800/90 border border-slate-700/60 text-slate-300 px-3.5 py-2.5 rounded-lg rounded-tl-none text-xs font-mono flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Growth Agent &amp; RailFence analyzing request...</span>
            </div>
          </div>
        )}

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
              disabled={isLoading}
              className="text-[11px] text-slate-300 bg-slate-800 hover:bg-slate-750 hover:text-white disabled:opacity-40 disabled:hover:bg-slate-800 px-2.5 py-1 rounded border border-slate-700/70 transition-colors text-left truncate max-w-full"
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
            disabled={isLoading}
            placeholder={isLoading ? "Processing proposal pipeline..." : "Type buyer intent or catalog request..."}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-colors"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !inputValue.trim()}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <span>{isLoading ? 'Sending...' : 'Send'}</span>
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

