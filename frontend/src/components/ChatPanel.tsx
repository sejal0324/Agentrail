import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ShieldCheck, Cpu, CornerDownLeft, AlertTriangle, Sparkles, TrendingUp, ShoppingBag, XCircle } from 'lucide-react';

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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

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
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
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
    <div className="flex flex-col w-full h-[calc(100vh-112px)] sticky top-[88px] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
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
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 border border-slate-700/60 rounded-md text-xs text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium text-[11px]">RailFence Protected</span>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 p-4 space-y-3 bg-slate-950/40 overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col w-full ${
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
              className={`max-w-[90%] px-3.5 py-3 rounded-xl text-xs leading-relaxed ${
                msg.sender === 'buyer'
                  ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-tr-none self-end'
                  : msg.isError
                  ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-tl-none font-sans'
                  : 'bg-transparent text-slate-200 rounded-tl-none font-sans w-full'
              }`}
            >
              {msg.text && !msg.proposal && (
                <div className="mb-3 text-slate-200 font-sans leading-relaxed">
                  {msg.text}
                </div>
              )}

              {/* A. AGENT RECOMMENDATION & B. AGENT PROPOSAL */}
              {msg.proposal && (
                <div className="space-y-4 w-full">
                  
                  {/* A. AGENT RECOMMENDATION */}
                  <div className="bg-[#0f172a] border border-indigo-500/40 rounded-xl p-3.5 relative shadow-lg shadow-indigo-900/10">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-xl"></div>
                    <div className="flex items-center justify-between mb-3 pl-1">
                      <h4 className="text-indigo-400 font-bold text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Recommended For You
                      </h4>
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/20 font-semibold tracking-wide">
                        Selected by Growth Agent
                      </span>
                    </div>
                    
                    <div className="space-y-3 pl-1">
                      {msg.proposal.items.map((item: any, idx: number) => (
                        <div key={idx} className="bg-slate-900/80 rounded-lg border border-slate-700/50 p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-semibold text-slate-100 text-sm">{item.sku.replace(/-/g, ' ')}</div>
                              <div className="text-[10px] text-slate-400 mt-1 font-mono bg-slate-800/50 inline-block px-1.5 py-0.5 rounded">Qty: {item.quantity}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono text-slate-200 font-medium">₹{item.originalUnitPrice.toLocaleString('en-IN')}</div>
                              {item.proposedUnitPrice < item.originalUnitPrice && (
                                <div className="text-[10px] text-emerald-400 font-medium mt-1 bg-emerald-500/10 px-1.5 py-0.5 rounded inline-block">
                                  Agent Price: ₹{item.proposedUnitPrice.toLocaleString('en-IN')}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <details className="mt-3 text-[10px] text-slate-400 cursor-pointer group">
                            <summary className="hover:text-indigo-300 transition-colors font-medium outline-none">
                              <span className="border-b border-dashed border-slate-600 group-hover:border-indigo-400">View details</span>
                            </summary>
                            <div className="mt-2 pl-2.5 border-l-2 border-slate-700/50 space-y-1 text-slate-300">
                              <div>Original Unit Price: ₹{item.originalUnitPrice.toLocaleString('en-IN')}</div>
                              <div>Proposed Unit Price: ₹{item.proposedUnitPrice.toLocaleString('en-IN')}</div>
                              <div className="italic text-slate-500 mt-1">Product metadata automatically retrieved by catalog tools.</div>
                            </div>
                          </details>
                        </div>
                      ))}
                    </div>

                    {msg.proposal.negotiationContext && (
                      <div className="mt-3 pl-1 text-[11px] text-indigo-200/90 italic border-l-2 border-indigo-500/30 ml-1 py-0.5 px-2 bg-indigo-500/5 rounded-r">
                        "{msg.proposal.negotiationContext}"
                      </div>
                    )}
                  </div>



                  {/* C. AGENT-GENERATED TRANSACTION PROPOSAL */}
                  <div className="bg-[#0f172a] border border-blue-500/40 rounded-xl p-3.5 relative shadow-lg shadow-blue-900/10">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl"></div>
                    <div className="flex items-center justify-between mb-4 pl-1">
                      <h4 className="text-blue-400 font-bold text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5" /> Agent Proposal
                      </h4>
                      <span className="text-[9px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/20 font-semibold tracking-wide">
                        Prepared by Growth Agent
                      </span>
                    </div>
                    
                    <div className="space-y-2.5 text-[11px] pl-1">
                      <div className="flex justify-between text-slate-300 items-center">
                        <span>Items Proposed</span>
                        <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-200">
                          {msg.proposal.items.reduce((acc: number, i: any) => acc + i.quantity, 0)}
                        </span>
                      </div>
                      {msg.proposal.proposedDiscountPercent > 0 && (
                        <div className="flex justify-between text-emerald-400 font-medium items-center">
                          <span>Agent Discount</span>
                          <span className="font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            {msg.proposal.proposedDiscountPercent}%
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-100 font-bold border-t border-slate-700/50 pt-3 mt-3 items-center">
                        <span className="text-sm">Proposed Total</span>
                        <span className="font-mono text-blue-400 text-base">₹{msg.proposal.proposedTotal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* D. RAILFENCE RESULT */}
              {msg.evaluation && (
                <div className={`mt-4 border rounded-xl p-3.5 relative shadow-lg ${
                  msg.evaluation.status === 'APPROVED' 
                    ? 'bg-emerald-950/10 border-emerald-500/40 shadow-emerald-900/10' 
                    : 'bg-rose-950/10 border-rose-500/40 shadow-rose-900/10'
                }`}>
                  <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${
                    msg.evaluation.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}></div>
                  
                  <div className="flex items-center gap-2 pl-1 mb-2">
                    {msg.evaluation.status === 'APPROVED' ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    )}
                    <h4 className={`font-bold text-[11px] tracking-widest uppercase ${
                      msg.evaluation.status === 'APPROVED' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      RailFence {msg.evaluation.status}
                    </h4>
                  </div>
                  
                  {msg.evaluation.status === 'BLOCKED' && (
                    <div className="mt-3 text-[11px] leading-relaxed">
                      {msg.evaluation.reasons && msg.evaluation.reasons.length > 0 && (
                        <div className="text-rose-200/90 bg-rose-950/50 p-2.5 rounded-lg border border-rose-900/50 ml-1 mb-2">
                          <span className="font-semibold block mb-1">Enforcement Reason:</span>
                          {msg.evaluation.reasons.join('; ')}
                        </div>
                      )}
                      <div className="ml-1 flex items-center gap-1.5 text-rose-300/80 font-medium">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Razorpay payment execution was blocked by RailFence. No API calls made.</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* E. RAZORPAY PAYMENT REQUEST */}
              {msg.evaluation?.status === 'APPROVED' && msg.razorpayOrder && (
                <div className="mt-4 bg-[#0a1128] border border-cyan-500/40 rounded-xl p-5 text-center shadow-xl shadow-cyan-900/20 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500"></div>
                  
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/10 mb-3 border border-cyan-500/20 text-cyan-400">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  
                  <h4 className="text-cyan-400 font-bold text-xs tracking-widest uppercase mb-1.5">
                    Payment Request Ready
                  </h4>
                  <p className="text-[10px] text-slate-400 mb-4 px-4 leading-relaxed">
                    <strong>Flow:</strong> Growth Agent (Proposal) → RailFence (Approved) → Razorpay (Ready)
                  </p>
                  
                  <button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]">
                    <span>Review & Proceed to Pay</span>
                  </button>

                  <div className="font-mono text-cyan-300/40 text-[9px] mt-4 uppercase tracking-wider">
                    ORDER_ID: {msg.razorpayOrder.orderId}
                  </div>
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

      {/* Suggested Quick Prompts - Only show when buyer session has no user messages */}
      {!messages.some((m) => m.sender === 'buyer') && (
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800/80 flex-shrink-0">
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
      )}

      {/* Input Form */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex-shrink-0">
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

