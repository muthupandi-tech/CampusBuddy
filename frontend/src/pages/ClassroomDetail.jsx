import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { socket } from '../services/socket';
import { 
  FileText, MessageSquare, Users, 
  ArrowLeft, Upload, Check, X,
  Trash2, ShieldAlert, FileIcon, Send, Plus, Ban, Star, Home, Settings
} from 'lucide-react';
import AddStudentModal from '../components/AddStudentModal';
import DirectMessageModal from '../components/DirectMessageModal';
import EditClassroomModal from '../components/EditClassroomModal';

const ClassroomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [classroom, setClassroom] = useState(null);
  const [activeTab, setActiveTab] = useState('resources');
  const [loading, setLoading] = useState(true);

  // Resources state
  const [resources, setResources] = useState([]);
  const [file, setFile] = useState(null);
  const [resourceTitle, setResourceTitle] = useState('');
  const [uploading, setUploading] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [blockedUsers, setBlockedUsers] = useState([]);
  const messagesEndRef = useRef(null);

  // Members state
  const [members, setMembers] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [dmReceiver, setDmReceiver] = useState(null);
  const [classroomBlocks, setClassroomBlocks] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchClassroom();
    fetchBlockedUsers();
    fetchClassroomBlocks();
    fetchUnreadCounts();
  }, [id]);

  useEffect(() => {
    if (classroom && classroom.isMember) {
      if (activeTab === 'resources') fetchResources();
      if (activeTab === 'chat') {
        fetchMessages();
        setupSocket();
      }
      if (activeTab === 'members') fetchMembers();
    }
    
    return () => {
      socket.emit('leave_classroom', id);
      socket.off('receive_classroom_message');
    };
  }, [classroom, activeTab]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchClassroom = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/classrooms/${id}`);
      setClassroom(res.data);
      if (!res.data.isMember && res.data.myStatus !== 'pending') {
        // Not a member, shouldn't be here, but let them see basic info maybe
        // navigate('/classrooms');
      }
    } catch (err) {
      console.error(err);
      navigate('/classrooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const res = await api.get('/classrooms/block/list');
      setBlockedUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // --- RESOURCES ---
  const fetchResources = async () => {
    try {
      const res = await api.get(`/classrooms/${id}/resources`);
      setResources(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', resourceTitle);
      
      await api.post(`/classrooms/${id}/resources`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFile(null);
      setResourceTitle('');
      fetchResources();
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // --- CHAT ---
  const setupSocket = () => {
    socket.connect();
    socket.emit('join_classroom', id);
    
    socket.off('receive_classroom_message'); // Prevent duplicates
    socket.on('receive_classroom_message', (msg) => {
      // Don't add if from blocked user
      setBlockedUsers(currentBlocked => {
        if (!currentBlocked.includes(msg.sender_id)) {
          setMessages((prev) => [...prev, msg]);
        }
        return currentBlocked;
      });
    });
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/classrooms/${id}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msgData = {
      classroom_id: id,
      sender_id: user.id,
      message: newMessage
    };

    socket.emit('classroom_message', msgData);
    setNewMessage('');
  };

  // --- MEMBERS ---
  const fetchMembers = async () => {
    try {
      const res = await api.get(`/classrooms/${id}/members`);
      setMembers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequest = async (userId, status) => {
    try {
      await api.put(`/classrooms/${id}/approve`, { userId, status });
      fetchMembers();
    } catch (err) {
      alert('Action failed');
    }
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/classrooms/${id}/remove/${userId}`);
      fetchMembers();
    } catch (err) {
      alert('Failed to remove');
    }
  };

  const toggleBlock = async (blockedUserId) => {
    try {
      await api.post('/classrooms/block', { blockedUserId });
      fetchBlockedUsers();
      if (activeTab === 'chat') fetchMessages();
    } catch (err) {
      alert('Block action failed');
    }
  };

  const fetchClassroomBlocks = async () => {
    try {
      const res = await api.get(`/dm/blocks/${id}`);
      setClassroomBlocks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleClassroomBlock = async (studentId) => {
    try {
      await api.post('/dm/block-group', { classroomId: id, studentId });
      fetchClassroomBlocks();
    } catch (err) {
      alert('Failed to toggle classroom block');
    }
  };

  const fetchUnreadCounts = async () => {
    try {
      const res = await api.get('/dm/unread-counts');
      setUnreadCounts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!classroom) return <div className="p-8 text-center">Classroom not found</div>;

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400"
            title="Go to Home"
          >
            <Home className="w-5 h-5" />
          </button>
          <button 
            onClick={() => navigate('/classrooms')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400"
            title="Back to Classrooms"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white line-clamp-1">{classroom.name}</h1>
                {(classroom.staff_id === user.id || user.role === 'admin') && (
                  <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-brand-600 transition-colors"
                    title="Edit Classroom Details"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{classroom.subject} &bull; Instructor: {classroom.staff_name}</p>
            </div>
          </div>
        </div>
        
        {classroom.isMember && (
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg self-start sm:self-auto">
            <button 
              onClick={() => setActiveTab('resources')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'resources' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <FileText className="w-4 h-4" /> <span className="hidden sm:inline">Resources</span>
            </button>
            <button 
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'chat' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <MessageSquare className="w-4 h-4" /> <span className="hidden sm:inline">Chat</span>
            </button>
            <button 
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'members' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <Users className="w-4 h-4" /> <span className="hidden sm:inline">Members</span>
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-900/50">
        {!classroom.isMember ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <ShieldAlert className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Access Restricted</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md">
              {classroom.myStatus === 'pending' 
                ? 'Your request to join this classroom is pending approval from the instructor.'
                : 'You are not a member of this classroom.'}
            </p>
          </div>
        ) : (
          <>
            {/* RESOURCES TAB */}
            {activeTab === 'resources' && (
              <div className="space-y-6 max-w-4xl mx-auto">
                {classroom.isStaff && (
                  <form onSubmit={handleUpload} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="font-medium text-slate-900 dark:text-white mb-4">Upload Resource</h3>
                    <div className="flex flex-col gap-4">
                      <input 
                        type="text"
                        placeholder="Resource Title (optional)"
                        value={resourceTitle}
                        onChange={(e) => setResourceTitle(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
                      />
                      <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <input 
                          type="file" 
                          required
                          onChange={(e) => setFile(e.target.files[0])}
                          className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-slate-700 dark:file:text-brand-400"
                        />
                        <button 
                          type="submit" 
                          disabled={uploading || !file}
                          className="w-full sm:w-auto px-6 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg flex items-center justify-center gap-2 font-medium transition-colors whitespace-nowrap"
                        >
                          {uploading ? 'Uploading...' : <><Upload className="w-4 h-4" /> Upload</>}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                <div className="grid gap-3">
                  {resources.length === 0 ? (
                    <p className="text-center text-slate-500 py-10">No resources available yet.</p>
                  ) : (
                    resources.map(res => (
                      <a 
                        key={res.id} 
                        href={`${import.meta.env.VITE_API_URL || ''}${res.file_url}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700 transition-colors group"
                      >
                        <div className="p-3 bg-brand-50 dark:bg-slate-700 text-brand-600 dark:text-brand-400 rounded-lg group-hover:scale-105 transition-transform">
                          <FileIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-900 dark:text-white truncate">{res.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Uploaded on {new Date(res.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </a>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* CHAT TAB */}
            {activeTab === 'chat' && (
              <div className="h-full flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-slate-500 mt-10">Start the conversation!</div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMe = msg.sender_id === user.id;
                      const showAvatar = idx === 0 || messages[idx-1].sender_id !== msg.sender_id;
                      
                      return (
                        <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
                          <div className={`flex max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                            {!isMe && showAvatar ? (
                              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 overflow-hidden">
                                {msg.avatar_url ? (
                                  <img src={msg.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                                    {msg.sender_name?.charAt(0)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-8 flex-shrink-0"></div>
                            )}
                            
                            <div className="flex flex-col">
                              {!isMe && showAvatar && (
                                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1 mb-1 flex items-center gap-1">
                                  {msg.sender_name}
                                  {(msg.role === 'staff' || msg.role === 'admin') && (
                                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                  )}
                                </span>
                              )}
                              <div 
                                className={`px-4 py-2 rounded-2xl ${
                                  isMe 
                                    ? 'bg-brand-600 text-white rounded-br-sm' 
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm'
                                } shadow-sm`}
                              >
                                {msg.message}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                <form onSubmit={sendMessage} className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={classroomBlocks.includes(user.id) ? "You are restricted from messaging by staff" : "Type a message to the classroom..."}
                    disabled={classroomBlocks.includes(user.id)}
                    className={`flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white ${classroomBlocks.includes(user.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <button 
                    type="submit"
                    disabled={!newMessage.trim() || classroomBlocks.includes(user.id)}
                    className="p-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-full transition-colors shadow-sm shadow-brand-500/20 flex-shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            )}

            {/* MEMBERS TAB */}
            {activeTab === 'members' && (
              <div className="max-w-4xl mx-auto space-y-6">
                
                {classroom.isStaff && members.some(m => m.status === 'pending') && (
                  <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-5 shadow-sm">
                    <h3 className="text-amber-800 dark:text-amber-400 font-medium mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5" /> Pending Requests
                    </h3>
                    <div className="grid gap-2 text-sm">
                      {members.filter(m => m.status === 'pending').map(m => (
                        <div key={m.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg border border-amber-100 dark:border-amber-500/10">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                              {m.avatar_url ? <img src={m.avatar_url} className="rounded-full" /> : m.name.charAt(0)}
                            </div>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{m.name}</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleRequest(m.id, 'approved')} className="p-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-md transition-colors"><Check className="w-4 h-4"/></button>
                            <button onClick={() => handleRequest(m.id, 'rejected')} className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-md transition-colors"><X className="w-4 h-4"/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                    <h3 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-brand-500" /> Class Roster
                    </h3>
                    {classroom.isStaff && (
                      <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm shadow-brand-500/20 active:scale-95"
                      >
                        <Plus className="w-4 h-4" /> Add Students
                      </button>
                    )}
                  </div>
                  <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                    {members.filter(m => m.status === 'approved').map(m => (
                      <li key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-brand-100 to-indigo-100 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center font-bold text-brand-700 dark:text-brand-300 shadow-inner">
                            {m.avatar_url ? <img src={m.avatar_url} className="rounded-full w-full h-full object-cover" /> : m.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                              {m.name}
                              {m.role === 'staff' && <span className="text-[10px] uppercase bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-400 px-2 py-0.5 rounded-full font-bold">Staff</span>}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{m.email}</p>
                          </div>
                        </div>
                        
                        {m.id !== user.id && (
                          <div className="flex items-center gap-2">
                            {/* Message button */}
                            <button 
                              onClick={() => {
                                setDmReceiver(m);
                                setUnreadCounts(prev => ({ ...prev, [m.id]: 0 }));
                              }}
                              className="p-2 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors relative"
                              title="Direct message"
                            >
                              <MessageSquare className="w-4 h-4" />
                              {unreadCounts[m.id] > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></span>
                              )}
                            </button>

                            {/* Staff actions */}
                            {classroom.isStaff && m.role !== 'staff' && (
                              <>
                                <button 
                                  onClick={() => toggleClassroomBlock(m.id)}
                                  className={`p-2 rounded-lg transition-colors ${classroomBlocks.includes(m.id) ? 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'}`}
                                  title={classroomBlocks.includes(m.id) ? "Unblock from group chat" : "Restrict from group chat"}
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => removeMember(m.id)}
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                  title="Remove student"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            
                            {/* Block action */}
                            {m.role !== 'staff' && (
                              <button 
                                onClick={() => toggleBlock(m.id)}
                                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                                  blockedUsers.includes(m.id)
                                    ? 'border-red-200 bg-red-50 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400'
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
                                }`}
                              >
                                {blockedUsers.includes(m.id) ? 'Unblock' : 'Block'}
                              </button>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            )}
          </>
        )}
      </div>

      <AddStudentModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        classroomId={id}
        existingMemberIds={members.map(m => m.id)}
        onStudentAdded={() => {
          fetchMembers();
        }}
      />
      <DirectMessageModal 
        isOpen={!!dmReceiver}
        onClose={() => setDmReceiver(null)}
        receiver={dmReceiver}
        myUser={user}
        classroomId={id}
      />
      <EditClassroomModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        classroom={classroom}
        onUpdate={(updated) => {
          setClassroom(prev => ({ ...prev, ...updated }));
        }}
        onDelete={() => {
          navigate('/classrooms');
        }}
      />
    </div>
  );
};

export default ClassroomDetail;
