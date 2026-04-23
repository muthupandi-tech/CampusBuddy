import React, { useState, useEffect, useContext, useRef } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { AuthContext } from '../contexts/AuthContext';
import { socket } from '../services/socket';
import api from '../services/api';
import { Search, Send, User, MessageSquare } from 'lucide-react';

const Messages = () => {
  const { user } = useContext(AuthContext);
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  
  const messagesEndRef = useRef(null);

  // Fetch contacts (Staff if student, Students if staff)
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        if (user.role === 'student') {
          const res = await api.get('/users/staff');
          setContacts(res.data);
        } else if (user.role === 'staff') {
          // For MVP, just get all students. In a real app, only students in their subjects are shown.
          const res = await api.get('/users/students');
          setContacts(res.data);
        }
        // Admins don't generally chat in this MVP, but we skip it here.
      } catch (err) {
        console.error("Failed to load contacts", err);
      } finally {
        setLoadingContacts(false);
      }
    };
    if (user.role !== 'admin') {
      fetchContacts();
    } else {
      setLoadingContacts(false);
    }
  }, [user.role]);

  // Fetch messages when contact is selected
  useEffect(() => {
    if (!activeContact) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${activeContact.id}`);
        setMessages(res.data);
        scrollToBottom();
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    };

    fetchMessages();
  }, [activeContact]);

  // Listen to socket messages
  useEffect(() => {
    const handleReceiveMessage = (msg) => {
      // Add message if it belongs to the current chat window
      if (
        activeContact && 
        (msg.sender_id === activeContact.id || msg.receiver_id === activeContact.id)
      ) {
        setMessages(prev => [...prev, msg]);
      }
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [activeContact]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContact) return;

    const msgData = {
      sender_id: user.id,
      receiver_id: activeContact.id,
      message: newMessage
    };

    // Emit to server
    socket.emit('send_message', msgData);
    setNewMessage('');
  };

  if (user.role === 'admin') {
    return (
      <DashboardLayout>
        <div className="card p-8 text-center text-slate-500">
          Messaging is not available for Admin role in Phase 1 MVP.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-140px)] card overflow-hidden">
        {/* Sidebar Contacts */}
        <div className={`w-full md:w-80 border-r border-slate-200 dark:border-slate-700 flex flex-col ${activeContact ? 'hidden md:flex' : 'flex'} transition-colors`}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search contacts..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loadingContacts ? (
              <div className="p-4 text-center text-sm text-slate-500">Loading contacts...</div>
            ) : contacts.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">No contacts available.</div>
            ) : (
              contacts.map(contact => (
                <div 
                  key={contact.id} 
                  onClick={() => setActiveContact(contact)}
                  className={`p-4 cursor-pointer flex items-center space-x-3 transition-colors border-b border-slate-50 dark:border-slate-700/50 ${
                    activeContact?.id === contact.id ? 'bg-brand-50 dark:bg-brand-900/40' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-slate-600 dark:text-slate-300 font-bold">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{contact.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{contact.department}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {activeContact ? (
          <div className={`flex-1 flex flex-col ${activeContact ? 'flex' : 'hidden md:flex'} transition-colors`}>
            <div className="h-16 border-b border-slate-200 dark:border-slate-700 flex items-center px-6 bg-white dark:bg-slate-800 shrink-0">
              <button 
                onClick={() => setActiveContact(null)} 
                className="md:hidden mr-4 text-brand-600 dark:text-brand-400 font-medium text-sm"
              >
                &larr; Back
              </button>
              <div className="flex items-center space-x-3">
                 <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold shadow-sm">
                   {activeContact.name.charAt(0).toUpperCase()}
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">{activeContact.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{activeContact.role}</p>
                 </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/50 space-y-4 transition-colors">
              {messages.map((msg, index) => {
                const isMine = msg.sender_id === user.id;
                return (
                  <div key={msg.id || index} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm relative ${
                      isMine ? 'bg-brand-600 dark:bg-brand-500 text-white rounded-br-sm' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-bl-sm'
                    }`}>
                      <p className="text-sm break-words leading-relaxed">{msg.message}</p>
                      <span className={`text-[10px] mt-1 block right-0 ${isMine ? 'text-brand-200' : 'text-slate-400 dark:text-slate-500'}`}>
                        {new Date(msg.timestamp || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shrink-0 transition-colors">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..." 
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="h-12 w-12 rounded-full bg-brand-600 dark:bg-brand-500 text-white flex items-center justify-center hover:bg-brand-700 dark:hover:bg-brand-600 transition-colors disabled:opacity-50 shadow-md"
                >
                  <Send className="w-5 h-5 ml-1" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-slate-50 dark:bg-slate-900/50 transition-colors">
            <div className="text-center">
              <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                <MessageSquare className="w-8 h-8 text-brand-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Your Messages</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Select a contact to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Messages;
