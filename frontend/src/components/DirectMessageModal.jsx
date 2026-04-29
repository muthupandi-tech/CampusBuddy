import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Paperclip, FileIcon, 
  Download, Loader2, User, 
  ShieldAlert, ImageIcon, FileText 
} from 'lucide-react';
import api from '../services/api';
import { socket } from '../services/socket';

const DirectMessageModal = ({ isOpen, onClose, receiver, myUser, classroomId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && receiver) {
      fetchHistory();
      setupSocket();
    }
    return () => {
      socket.off('dm_receive');
    };
  }, [isOpen, receiver]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const setupSocket = () => {
    socket.off('dm_receive');
    socket.on('dm_receive', (msg) => {
      if ((msg.sender_id === receiver.id && msg.receiver_id === myUser.id) ||
          (msg.sender_id === myUser.id && msg.receiver_id === receiver.id)) {
        setMessages(prev => [...prev, msg]);
      }
    });
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/dm/history/${receiver.id}`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !file) return;

    try {
      setSending(true);
      setError(null);
      const formData = new FormData();
      formData.append('receiverId', receiver.id);
      formData.append('message', newMessage);
      if (classroomId) formData.append('classroomId', classroomId);
      if (file) formData.append('file', file);

      const res = await api.post('/dm/send', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Emit via socket
      socket.emit('dm_send', {
        sender_id: myUser.id,
        receiver_id: receiver.id,
        message: res.data.message,
        file_url: res.data.file_url
      });

      setNewMessage('');
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg h-[80vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-slate-700 flex items-center justify-center font-bold text-brand-700 dark:text-brand-400 overflow-hidden">
              {receiver.avatar_url ? (
                <img src={receiver.avatar_url} className="w-full h-full object-cover" />
              ) : (
                receiver.name?.charAt(0)
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">{receiver.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Direct Message</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <User className="w-12 h-12 mb-2 opacity-20" />
              <p>No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.sender_id === myUser.id;
              return (
                <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm ${
                    isMe 
                      ? 'bg-brand-600 text-white rounded-br-sm' 
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm'
                  }`}>
                    {msg.file_url && (
                      <div className="mb-2">
                        {msg.file_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                          <img 
                            src={`${import.meta.env.VITE_API_URL || ''}${msg.file_url}`} 
                            alt="attachment" 
                            className="max-w-full rounded-lg cursor-pointer"
                            onClick={() => window.open(`${import.meta.env.VITE_API_URL || ''}${msg.file_url}`, '_blank')}
                          />
                        ) : (
                          <a 
                            href={`${import.meta.env.VITE_API_URL || ''}${msg.file_url}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className={`flex items-center gap-2 p-2 rounded-lg border ${isMe ? 'bg-brand-700/50 border-brand-500' : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600'}`}
                          >
                            <FileIcon className="w-5 h-5" />
                            <span className="text-xs truncate max-w-[150px]">Attachment</span>
                            <Download className="w-4 h-4 ml-auto" />
                          </a>
                        )}
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <p className={`text-[10px] mt-1 opacity-60 ${isMe ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          {error && (
            <div className="mb-3 p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
              <ShieldAlert className="w-4 h-4" />
              {error}
            </div>
          )}
          
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-2xl p-2 flex flex-col gap-2">
              {file && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-slate-700 rounded-lg text-xs text-brand-700 dark:text-brand-300">
                  <FileIcon className="w-4 h-4" />
                  <span className="truncate flex-1">{file.name}</span>
                  <button onClick={() => setFile(null)} className="hover:text-red-500" type="button"><X className="w-4 h-4" /></button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <label className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full cursor-pointer transition-colors text-slate-500">
                  <Paperclip className="w-5 h-5" />
                  <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                </label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={error && error.includes('block') ? "Messaging restricted" : "Type a message..."}
                  disabled={error && error.includes('block')}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm py-2 resize-none max-h-32 min-h-[40px] custom-scrollbar"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={sending || (!newMessage.trim() && !file) || (error && error.includes('block'))}
              className="p-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-2xl transition-all shadow-lg shadow-brand-500/20 flex-shrink-0"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DirectMessageModal;
