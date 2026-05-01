import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { X, Camera, Save, User, Phone, MapPin, Calendar, BookOpen, GraduationCap, Plus, Trash2, Code } from 'lucide-react';
import api from '../services/api';

const EditProfileModal = ({ onClose }) => {
  const { user, updateUser } = useContext(AuthContext); 
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    department: user.role === 'admin' ? (user.admin_department || user.department || '') : (user.department || ''),
    year: user?.year || 1,
    avatar_url: user?.avatar_url || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allSubjects, setAllSubjects] = useState([]);
  const [staffSubjects, setStaffSubjects] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [showAddQual, setShowAddQual] = useState(false);
  const [newQual, setNewQual] = useState({ degree: '', major: '', college: '' });

  useEffect(() => {
    if (user?.role === 'staff') {
      fetchStaffData();
    }
  }, [user]);

  const fetchStaffData = async () => {
    try {
      const [subsRes, staffSubsRes, qualsRes] = await Promise.all([
        api.get('/academic/subjects'),
        api.get(`/academic/staff/subjects/${user.id}`),
        api.get(`/academic/staff/qualifications/${user.id}`)
      ]);
      setAllSubjects(subsRes.data);
      setStaffSubjects(staffSubsRes.data);
      setQualifications(qualsRes.data);
    } catch (err) {
      console.error('Failed to fetch staff data', err);
    }
  };

  const handleAddSubject = async (subjectId) => {
    try {
      await api.post('/academic/staff/subjects', { staff_id: user.id, subject_id: subjectId });
      fetchStaffData();
    } catch (err) {
      alert('Failed to add subject');
    }
  };

  const handleRemoveSubject = async (subjectId) => {
    try {
      await api.delete('/academic/staff/subjects', { data: { staff_id: user.id, subject_id: subjectId } });
      fetchStaffData();
    } catch (err) {
      alert('Failed to remove subject');
    }
  };

  const handleAddQualification = async (e) => {
    e.preventDefault();
    try {
      await api.post('/academic/staff/qualifications', { ...newQual, staff_id: user.id });
      setNewQual({ degree: '', major: '', college: '' });
      setShowAddQual(false);
      fetchStaffData();
    } catch (err) {
      alert('Failed to add qualification');
    }
  };

  const handleDeleteQualification = async (id) => {
    try {
      await api.delete(`/academic/staff/qualifications/${id}`);
      fetchStaffData();
    } catch (err) {
      alert('Failed to delete qualification');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.put('/users/profile', formData);
      // Update context directly
      updateUser(res.data.user); 
      onClose();
    } catch (err) {
      alert('Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarChange = () => {
    const url = prompt('Enter image URL for avatar:', formData.avatar_url);
    if (url !== null) {
      setFormData({ ...formData, avatar_url: url });
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-zoom-in transition-colors duration-300 no-scrollbar">
        <div className="flex items-center justify-between p-6 border-b border-slate-50 dark:border-slate-700/50">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Edit Profile</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <div className="h-24 w-24 rounded-full bg-brand-50 dark:bg-brand-900/40 border-4 border-white dark:border-slate-700 shadow-xl flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-3xl overflow-hidden">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  formData.name.charAt(0).toUpperCase()
                )}
              </div>
              <button 
                type="button"
                onClick={handleAvatarChange}
                className="absolute bottom-0 right-0 p-2 bg-brand-600 text-white rounded-full shadow-lg hover:bg-brand-700 transition-all border-2 border-white dark:border-slate-700"
              >
                <Camera size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 font-medium">Click the camera icon to update photo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider flex items-center">
                <User size={12} className="mr-1" /> Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-medium text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider flex items-center">
                <Phone size={12} className="mr-1" /> Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-medium text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider flex items-center">
                <MapPin size={12} className="mr-1" /> Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Computer Science"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>

            {user?.role === 'student' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider flex items-center">
                  <Calendar size={12} className="mr-1" /> Year of Study
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent focus:border-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  {[1,2,3,4].map(y => <option key={y} value={y} className="dark:bg-slate-800">Year {y}</option>)}
                </select>
              </div>
            )}
          </div>

          {user?.role === 'staff' && (
            <div className="mt-8 space-y-8 animate-fade-in">
              {/* Subjects Section */}
              <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl space-y-4 border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    <BookOpen size={18} className="text-brand-600" /> Handled Subjects
                  </h4>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {staffSubjects.map(sub => (
                    <div key={sub.id} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 group transition-all hover:border-red-200 dark:hover:border-red-900/30">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{sub.code}: {sub.name}</span>
                      <button 
                        type="button"
                        onClick={() => handleRemoveSubject(sub.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <select 
                    onChange={(e) => { if(e.target.value) handleAddSubject(e.target.value); e.target.value = ''; }}
                    className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 outline-none focus:border-brand-500 transition-all"
                  >
                    <option value="">+ Add Subject</option>
                    {allSubjects.filter(as => !staffSubjects.find(ss => ss.id === as.id)).map(s => (
                      <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Qualifications Section */}
              <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl space-y-4 border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    <GraduationCap size={18} className="text-brand-600" /> Qualifications
                  </h4>
                  <button 
                    type="button"
                    onClick={() => setShowAddQual(!showAddQual)}
                    className="p-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-all shadow-sm"
                  >
                    {showAddQual ? <X size={14} /> : <Plus size={14} />}
                  </button>
                </div>

                {showAddQual && (
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-brand-100 dark:border-brand-900/30 space-y-3 animate-zoom-in">
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        placeholder="Degree (e.g. B.E)"
                        className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs outline-none border border-transparent focus:border-brand-500"
                        value={newQual.degree}
                        onChange={e => setNewQual({...newQual, degree: e.target.value})}
                      />
                      <input 
                        placeholder="Major (e.g. CSE)"
                        className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs outline-none border border-transparent focus:border-brand-500"
                        value={newQual.major}
                        onChange={e => setNewQual({...newQual, major: e.target.value})}
                      />
                    </div>
                    <input 
                      placeholder="College / University"
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs outline-none border border-transparent focus:border-brand-500"
                      value={newQual.college}
                      onChange={e => setNewQual({...newQual, college: e.target.value})}
                    />
                    <button 
                      type="button"
                      onClick={handleAddQualification}
                      className="w-full py-3 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-100 dark:shadow-none"
                    >
                      Save Qualification
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {qualifications.map(q => (
                    <div key={q.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all hover:shadow-sm">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{q.degree} {q.major && `in ${q.major}`}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{q.college}</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleDeleteQualification(q.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-700/50 flex gap-3 transition-colors">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-lg shadow-brand-100 dark:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={18} />
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
