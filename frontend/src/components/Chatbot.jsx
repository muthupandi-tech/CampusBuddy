import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Loader2 } from 'lucide-react';
import api from '../services/api';
import Draggable from 'react-draggable';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm Buddy, your campus assistant. How can I help you today?", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const nodeRef = useRef(null);
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('chatbot-position');
    return saved ? JSON.parse(saved) : { x: 0, y: 0 };
  });

  const handleStop = (e, data) => {
    setPosition({ x: data.x, y: data.y });
    localStorage.setItem('chatbot-position', JSON.stringify({ x: data.x, y: data.y }));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-adjust position when opening near edges to keep window visible
  useEffect(() => {
    if (isOpen && nodeRef.current) {
      const adjustPosition = () => {
        const rect = nodeRef.current.getBoundingClientRect();
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        
        let adjustX = 0;
        let adjustY = 0;
        
        if (rect.right > winWidth) adjustX = winWidth - rect.right - 20;
        if (rect.left < 0) adjustX = -rect.left + 20;
        if (rect.bottom > winHeight) adjustY = winHeight - rect.bottom - 20;
        if (rect.top < 0) adjustY = -rect.top + 20;
        
        if (adjustX !== 0 || adjustY !== 0) {
          setPosition(prev => ({ x: prev.x + adjustX, y: prev.y + adjustY }));
        }
      };
      
      // Delay to ensure the DOM is updated after opening
      const timer = setTimeout(adjustPosition, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), text: input, isBot: false };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.post('/chatbot', { question: input });
      const botMessage = { id: Date.now() + 1, text: res.data.response, isBot: true };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now() + 1, text: "Sorry, I'm having trouble connecting right now.", isBot: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <Draggable 
        nodeRef={nodeRef}
        handle=".chat-drag-handle" 
        bounds="parent"
        position={position}
        onStop={handleStop}
      >
        <div ref={nodeRef} className="absolute bottom-6 right-6 pointer-events-auto">
        {/* Floating Button */}
        {!isOpen && (
          <button 
            onClick={() => setIsOpen(true)}
            className="chat-drag-handle h-14 w-14 rounded-full bg-brand-600 dark:bg-brand-500 text-white shadow-2xl flex items-center justify-center hover:bg-brand-700 dark:hover:bg-brand-600 hover:scale-110 transition-all group cursor-move"
          >
            <MessageSquare className="group-hover:animate-bounce pointer-events-none" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-800"></span>
          </button>
        )}

        {/* Chat Window */}
        {isOpen && (
          <div className="chat-drag-handle w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden animate-fade-in-up cursor-move transition-colors duration-300">
            {/* Header */}
            <div className="chat-drag-handle p-4 bg-brand-600 dark:bg-brand-700 text-white flex items-center justify-between cursor-move select-none">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-bold">CampusBuddy AI</h3>
                  <p className="text-[10px] text-brand-100 dark:text-brand-200 font-medium">Drag to move • Always online</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50 scrollbar-thin cursor-default transition-colors">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                  <div className={`flex gap-2 max-w-[85%] ${msg.isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.isBot ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                      {msg.isBot ? <Bot size={16} /> : <User size={16} />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm shadow-sm ${msg.isBot ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100/50 dark:border-slate-700' : 'bg-brand-600 dark:bg-brand-500 text-white rounded-tr-none'}`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 max-w-[85%]">
                    <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                      <Bot size={16} />
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2 border border-slate-100/50 dark:border-slate-700">
                      <Loader2 size={16} className="animate-spin text-brand-500 dark:text-brand-400" />
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium italic">Buddy is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 cursor-default transition-colors">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about attendance, timetable..."
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-900 border-none rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2 bg-brand-600 dark:bg-brand-500 text-white rounded-xl hover:bg-brand-700 dark:hover:bg-brand-600 disabled:opacity-50 transition-all"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Draggable>
  </div>
  );
};

export default Chatbot;
