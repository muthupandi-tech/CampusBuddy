import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { 
  Users, Shield, CheckCircle, AlertCircle, 
  Loader2, Search, Plus, Trash2, LayoutGrid,
  Filter, Building2, Layers, X
} from 'lucide-react';

const AssignClass = () => {
  const { user } = useContext(AuthContext);
  const [classes, setClasses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modals
  const [selectedClass, setSelectedClass] = useState(null);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState(null);

  // Form States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [newDeptName, setNewDeptName] = useState('');
  const [newSection, setNewSection] = useState({ year: 'I', name: '', department: '' });
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    if (user?.admin_department) {
      setSelectedDept(user.admin_department);
    }
  }, [user]);

  useEffect(() => {
    fetchData(selectedDept);
  }, [selectedDept]);

  const fetchData = async (dept) => {
    try {
      setLoading(true);
      const [classRes, staffRes, deptRes] = await Promise.all([
        api.get(`/admin/classes?department=${dept}`),
        api.get(`/admin/staff?department=${dept}`),
        api.get('/admin/departments')
      ]);
      setClasses(classRes.data);
      setStaff(staffRes.data);
      setDepartments(deptRes.data);
      
      // Update newSection default department
      if (dept !== 'all') {
        setNewSection(prev => ({ ...prev, department: dept }));
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (staffId) => {
    if (!selectedClass) return;
    try {
      setLoading(true);
      await api.post('/admin/assign-class', {
        department: selectedClass.department,
        year: selectedClass.year,
        section: selectedClass.name,
        staff_id: staffId
      });
      setSuccess(`Assigned to ${staff.find(s => s.id === staffId)?.name}`);
      setSelectedClass(null);
      fetchData(selectedDept);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign class');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDept = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/admin/departments', { name: newDeptName });
      setSuccess('Department added');
      setNewDeptName('');
      setShowDeptModal(false);
      fetchData(selectedDept);
    } catch (err) {
      setError('Failed to add department');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/admin/sections', {
        department: newSection.department || selectedDept,
        year: newSection.year,
        section: newSection.name
      });
      setSuccess('Section created');
      setNewSection({ ...newSection, name: '' });
      setShowSectionModal(false);
      fetchData(selectedDept);
    } catch (err) {
      setError('Failed to create section');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async (cls) => {
    if (!window.confirm('Remove this assignment?')) return;
    try {
      setLoading(true);
      await api.post('/admin/unassign-class', {
        department: cls.department,
        year: cls.year,
        section: cls.name
      });
      setSuccess('Assignment removed');
      fetchData(selectedDept);
    } catch (err) {
      setError('Failed to unassign');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (e) => {
    e.preventDefault();
    if (!sectionToDelete) return;
    try {
      setLoading(true);
      await api.post(`/admin/sections/${sectionToDelete.id}/delete`, {
        password: deletePassword
      });
      setSuccess('Section deleted successfully');
      setDeletePassword('');
      setShowDeleteModal(false);
      setSectionToDelete(null);
      fetchData(selectedDept);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete section');
    } finally {
      setLoading(false);
    }
  };

  const years = ['I', 'II', 'III', 'IV'];

  if (loading && classes.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 animate-spin text-brand-600 mb-4" />
      <p className="text-slate-500 font-medium">Loading Department Workspace...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="text-brand-600" /> 
            {selectedDept === 'all' ? 'All Departments' : `${selectedDept} Department`}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">View and manage sections across the institution</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 px-3 rounded-xl border border-slate-100 dark:border-slate-700">
            <Filter size={14} className="text-slate-400" />
            <select 
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-600 dark:text-slate-300 outline-none pr-2"
            >
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          
          {user?.admin_department && selectedDept !== user.admin_department && (
            <button 
              onClick={() => setSelectedDept(user.admin_department)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black border border-emerald-100 dark:border-emerald-800 transition-all hover:bg-emerald-100"
            >
              <Building2 size={14} /> My Dept
            </button>
          )}

          <button 
            onClick={() => setShowDeptModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
          >
            <Plus size={16} /> Dept
          </button>
          <button 
            onClick={() => {
              if (selectedDept !== 'all') {
                setNewSection(prev => ({ ...prev, department: selectedDept }));
              }
              setShowSectionModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20"
          >
            <Layers size={16} /> New Section
          </button>
        </div>
      </div>

      {(success || error) && (
        <div className={`p-4 rounded-2xl border flex items-center gap-2 text-sm font-bold animate-in slide-in-from-top-2 ${
          success ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
        }`}>
          {success ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {success || error}
        </div>
      )}

      {/* Class Grid */}
      <div className="grid grid-cols-1 gap-10">
        {years.map(year => {
          const yearClasses = classes.filter(c => c.year === year);
          return (
            <div key={year} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></span>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Year {year}</h3>
                <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {yearClasses.map(cls => (
                  <div 
                    key={`${cls.year}-${cls.name}`}
                    onClick={() => setSelectedClass(cls)}
                    className={`relative p-5 rounded-3xl border-2 transition-all cursor-pointer group ${
                      cls.staff_id 
                        ? 'bg-emerald-50/30 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20' 
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-brand-500'
                    } ${selectedClass === cls ? 'ring-4 ring-brand-500/20 border-brand-500' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className={`h-10 px-3 rounded-xl flex items-center justify-center font-black gap-2 ${
                        cls.staff_id ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                      }`}>
                        <span className="text-[10px] opacity-60">{cls.department}</span>
                        <span className="border-l border-current h-4 opacity-20"></span>
                        {cls.name}
                      </div>
                      {cls.staff_id && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleUnassign(cls); }}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                          title="Unassign Teacher"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      {!cls.staff_id && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSectionToDelete(cls);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete Section"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-tight">Section Teacher</p>
                    <h4 className="font-bold text-slate-900 dark:text-white truncate">
                      {cls.staff_id ? cls.staff_name : 'Unassigned'}
                    </h4>
                  </div>
                ))}
                {yearClasses.length === 0 && (
                  <div className="col-span-full py-6 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl text-slate-400 text-sm">
                    No sections created for Year {year}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- Modals --- */}

      {/* 1. Assign Staff Modal */}
      {selectedClass && (
        <Modal title="Assign Class Teacher" onClose={() => setSelectedClass(null)}>
           <p className="text-sm text-slate-500 mb-6">
             Selected Section: <span className="font-black text-brand-600">{selectedClass.year} - {selectedClass.name}</span>
           </p>
           <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500"
              />
           </div>
           <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {staff
                .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .filter(s => s.department === selectedClass.department)
                .map(s => (
                <button 
                  key={s.id}
                  onClick={() => handleAssign(s.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold">{s.name.charAt(0)}</div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{s.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{s.assigned_classes} Classes Assigned</p>
                    </div>
                  </div>
                  <Plus className="text-brand-600" />
                </button>
              ))}
           </div>
        </Modal>
      )}

      {/* 2. Add Dept Modal */}
      {showDeptModal && (
        <Modal title="Add New Department" onClose={() => setShowDeptModal(false)}>
          <form onSubmit={handleAddDept} className="space-y-4">
            <input 
              type="text"
              placeholder="e.g. AI & ML"
              required
              value={newDeptName}
              onChange={e => setNewDeptName(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all">
              Save Department
            </button>
          </form>
        </Modal>
      )}

      {/* 3. Add Section Modal */}
      {showSectionModal && (
        <Modal title="Create New Section" onClose={() => setShowSectionModal(false)}>
          <form onSubmit={handleAddSection} className="space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase ml-2">Department</label>
              <select 
                value={newSection.department}
                onChange={e => setNewSection({...newSection, department: e.target.value})}
                required
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-2">Academic Year</label>
                <select 
                  value={newSection.year}
                  onChange={e => setNewSection({...newSection, year: e.target.value})}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {years.map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-2">Section Name</label>
                <input 
                  type="text"
                  placeholder="e.g. A"
                  required
                  value={newSection.name}
                  onChange={e => setNewSection({...newSection, name: e.target.value})}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            <button className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all">
              Create Section
            </button>
          </form>
        </Modal>
      )}

      {/* 4. Delete Section Modal */}
      {showDeleteModal && (
        <Modal title="Confirm Deletion" onClose={() => setShowDeleteModal(false)}>
           <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl mb-6 flex items-start gap-3">
              <AlertCircle className="text-red-600 mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm font-bold text-red-600">This action is permanent!</p>
                <p className="text-xs text-red-500/80">Deleting section <span className="font-bold">{sectionToDelete.department} - {sectionToDelete.year} - {sectionToDelete.name}</span>. This will remove all associated data.</p>
              </div>
           </div>

           <form onSubmit={handleDeleteSection} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-2">Confirm with Password</label>
                <input 
                  type="password"
                  placeholder="Your admin password"
                  required
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black transition-all"
                >
                  Cancel
                </button>
                <button className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all">
                  Delete Permanently
                </button>
              </div>
           </form>
        </Modal>
      )}
    </div>
  );
};

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
    <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200">
      <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all"><X size={20} /></button>
      </div>
      <div className="p-8">{children}</div>
    </div>
  </div>
);

export default AssignClass;
