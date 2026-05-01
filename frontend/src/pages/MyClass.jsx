import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { socket } from '../services/socket';
import { 
  Calendar, Users, MessageSquare, Award, 
  Clock, Shield, Send, User, Loader2,
  AlertCircle
} from 'lucide-react';

const MyClass = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('timetable');
  const [classInfo, setClassInfo] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [classmates, setClassmates] = useState([]);
  const [marks, setMarks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'chat' && classInfo?.section_id) {
      socket.emit('join_section', classInfo.section_id);
      
      const handleMessage = (data) => {
        setMessages(prev => [...prev, data]);
      };

      socket.on('receive_section_message', handleMessage);
      return () => {
        socket.off('receive_section_message', handleMessage);
      };
    }
  }, [activeTab, classInfo]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const infoRes = await api.get('/myclass/info');
      
      // Backend returns 200 with section_id: null when student has no section
      if (!infoRes.data.section_id) {
        setError('You have not been assigned to a section yet. Please contact your administrator.');
        return;
      }
      
      setClassInfo(infoRes.data);

      const [ttRes, cmRes, marksRes, chatRes] = await Promise.all([
        api.get('/myclass/timetable'),
        api.get('/myclass/students'),
        api.get('/myclass/marks'),
        api.get('/myclass/chat')
      ]);

      setTimetable(ttRes.data);
      setClassmates(cmRes.data);
      setMarks(marksRes.data);
      setMessages(chatRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load class data');
    } finally {
      setLoading(false);
    }
  };


  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !classInfo?.section_id) return;

    socket.emit('section_message', {
      section_id: classInfo.section_id,
      sender_id: user.id,
      message: newMessage
    });
    setNewMessage('');
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 animate-spin text-brand-600 mb-4" />
      <p className="text-slate-500 font-medium">Gathering your class details...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-4">
        <AlertCircle size={32} />
      </div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Notice</h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-md">{error}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              My Class: Section {classInfo.section_name}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {classInfo.department} &bull; Year {classInfo.year}
            </p>
          </div>
          <div className="flex items-center gap-3 bg-brand-50 dark:bg-brand-900/20 px-4 py-2 rounded-2xl">
            <div className="h-10 w-10 rounded-xl bg-brand-100 dark:bg-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest">Class Teacher</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{classInfo.class_teacher_name}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 mt-8 p-1 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
          {[
            { id: 'timetable', label: 'Timetable', icon: Calendar },
            { id: 'classmates', label: 'Classmates', icon: Users },
            { id: 'chat', label: 'Section Chat', icon: MessageSquare },
            { id: 'marks', label: 'Internal Marks', icon: Award },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[50vh]">
        {activeTab === 'timetable' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50">
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Day</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Time</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Subject</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {timetable.length === 0 ? (
                    <tr><td colSpan="3" className="px-6 py-10 text-center text-slate-500">No timetable assigned yet.</td></tr>
                  ) : timetable.map((slot, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{slot.day}</td>
                      <td className="px-6 py-4 font-medium text-brand-600 dark:text-brand-400">{slot.time_slot}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">{slot.subject_name}</p>
                        <p className="text-xs text-slate-500">{slot.subject_code}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'classmates' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classmates.map(student => (
              <div key={student.id} className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:shadow-lg transition-all">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold overflow-hidden">
                  {student.avatar_url ? <img src={student.avatar_url} className="h-full w-full object-cover" /> : <User size={24} />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{student.name}</h4>
                  <p className="text-xs text-slate-500 truncate max-w-[150px]">{student.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-[60vh]">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] flex gap-3 ${msg.sender_id === user.id ? 'flex-row-reverse' : ''}`}>
                    <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {msg.avatar_url ? <img src={msg.avatar_url} className="h-full w-full object-cover" /> : <User size={16} />}
                    </div>
                    <div>
                      <div className={`p-3 rounded-2xl ${
                        msg.sender_id === user.id 
                          ? 'bg-brand-600 text-white rounded-tr-none' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-tl-none'
                      }`}>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                      <p className={`text-[10px] mt-1 text-slate-500 font-bold uppercase ${msg.sender_id === user.id ? 'text-right' : ''}`}>
                        {msg.sender_name} &bull; {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
              <input 
                type="text" 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message to your section..."
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
              <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white p-2.5 rounded-xl transition-all shadow-lg shadow-brand-500/20">
                <Send size={20} />
              </button>
            </form>
          </div>
        )}

        {activeTab === 'marks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marks.length === 0 ? (
              <div className="col-span-full py-10 text-center text-slate-500 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                No marks updated yet.
              </div>
            ) : marks.map((m, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-lg group-hover:text-brand-600 transition-colors">{m.subject_name}</h4>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{m.subject_code}</p>
                  </div>
                  <div className="bg-brand-50 dark:bg-brand-900/20 px-3 py-1 rounded-full text-brand-600 dark:text-brand-400 text-sm font-black">
                    Total: {m.total}
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Internal 1', value: m.internal1, max: 25 },
                    { label: 'Internal 2', value: m.internal2, max: 25 },
                    { label: 'Assignment', value: m.assignment, max: 10 },
                  ].map(stat => (
                    <div key={stat.label}>
                      <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                        <span>{stat.label}</span>
                        <span>{stat.value} / {stat.max}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-500 transition-all duration-1000" 
                          style={{ width: `${(stat.value / stat.max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyClass;
