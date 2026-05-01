import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, Award, Calendar, Loader2, 
  Save, CheckCircle, AlertCircle, ChevronRight,
  BookOpen, BarChart2, Edit3, X
} from 'lucide-react';

const ManageClass = () => {
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [activeMode, setActiveMode] = useState('markbook'); // 'markbook' | 'entry' | 'timetable'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  // --- Markbook (pivot) state ---
  const [matrixData, setMatrixData] = useState(null); // { students, subjects, marks }
  const [matrixLoading, setMatrixLoading] = useState(false);

  // --- Mark Entry state ---
  const [selectedSubject, setSelectedSubject] = useState('');
  const [marksData, setMarksData] = useState({}); // { studentId: { int1, int2, ass } }
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [secRes, subRes] = await Promise.all([
        api.get('/myclass/staff/sections'),
        api.get('/academic/subjects')
      ]);
      setSections(secRes.data);
      setSubjects(subRes.data);
    } catch (err) {
      setError('Failed to load your assigned sections');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionSelect = async (section) => {
    setSelectedSection(section);
    setActiveMode('markbook');
    setMatrixData(null);
    setMarksData({});
    setSelectedSubject('');
    await fetchMarksMatrix(section.id);
    // Also fetch students for mark entry mode
    try {
      const res = await api.get(`/myclass/staff/section/${section.id}/students`);
      setStudents(res.data);
    } catch (err) {
      // non-critical
    }
  };

  const fetchMarksMatrix = async (sectionId) => {
    try {
      setMatrixLoading(true);
      const res = await api.get(`/myclass/staff/section/${sectionId}/marks-matrix`);
      setMatrixData(res.data);
    } catch (err) {
      setError('Failed to load marks data');
    } finally {
      setMatrixLoading(false);
    }
  };

  const handleMarkChange = (studentId, field, value) => {
    setMarksData(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { internal1: 0, internal2: 0, assignment: 0 }),
        [field]: parseInt(value) || 0
      }
    }));
  };

  const saveMarks = async () => {
    if (!selectedSubject) return setError('Please select a subject first');
    if (Object.keys(marksData).length === 0) return setError('No marks entered');
    try {
      setIsSaving(true);
      setError(null);
      const promises = Object.entries(marksData).map(([studentId, marks]) =>
        api.post('/myclass/staff/marks', {
          student_id: studentId,
          subject_id: selectedSubject,
          ...marks
        })
      );
      await Promise.all(promises);
      setSuccess('Marks saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      // Refresh matrix
      await fetchMarksMatrix(selectedSection.id);
      setMarksData({});
    } catch (err) {
      setError('Failed to save marks. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && sections.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 animate-spin text-brand-600 mb-4" />
      <p className="text-slate-500 font-medium">Loading your sections...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Class Management</h1>
        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-100 dark:border-emerald-800 animate-in fade-in slide-in-from-top-4">
            <CheckCircle size={18} /> {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl text-sm font-bold border border-red-100 dark:border-red-800">
            <AlertCircle size={18} /> {error}
            <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600"><X size={14} /></button>
          </div>
        )}
      </div>

      {!selectedSection ? (
        /* Section Selection Grid */
        <div>
          {sections.length === 0 ? (
            <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">You are not assigned as Class Teacher for any section.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sections.map(sec => (
                <button
                  key={sec.id}
                  onClick={() => handleSectionSelect(sec)}
                  className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 text-left hover:shadow-xl hover:border-brand-500 dark:hover:border-brand-500 transition-all group"
                >
                  <div className="h-14 w-14 rounded-2xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users size={28} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Section {sec.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">{sec.department} &bull; Year {sec.year}</p>
                  <div className="mt-4 flex items-center text-brand-600 dark:text-brand-400 font-bold text-sm">
                    Manage Section <ChevronRight size={16} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section Header + Mode Switcher */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedSection(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <ChevronRight size={24} className="rotate-180" />
              </button>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Section {selectedSection.name}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedSection.department} &bull; Year {selectedSection.year}
                </p>
              </div>
            </div>

            <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-2xl gap-1">
              <button
                onClick={() => setActiveMode('markbook')}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeMode === 'markbook' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <BarChart2 size={16} /> Markbook
              </button>
              <button
                onClick={() => setActiveMode('entry')}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeMode === 'entry' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Edit3 size={16} /> Enter Marks
              </button>
              <button
                onClick={() => setActiveMode('timetable')}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeMode === 'timetable' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Calendar size={16} /> Timetable
              </button>
            </div>
          </div>

          {/* ===== MARKBOOK MODE (Pivot Table) ===== */}
          {activeMode === 'markbook' && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
                <BarChart2 className="text-brand-600 dark:text-brand-400" size={20} />
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">Subject-Wise Markbook</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Internal marks for all students across all subjects</p>
                </div>
              </div>

              {matrixLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
                </div>
              ) : !matrixData || matrixData.students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <BookOpen className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No marks recorded yet</p>
                  <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Switch to "Enter Marks" to start adding marks for this section.</p>
                </div>
              ) : matrixData.subjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <Award className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No marks entered yet</p>
                  <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Use "Enter Marks" tab to record marks per subject.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/60">
                        <th className="sticky left-0 bg-slate-50 dark:bg-slate-900/60 px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest min-w-[180px] z-10">
                          Student
                        </th>
                        {matrixData.subjects.map(sub => (
                          <th
                            key={sub.id}
                            className="px-4 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center"
                            colSpan={4}
                          >
                            <div className="font-black text-brand-600 dark:text-brand-400">{sub.code}</div>
                            <div className="text-[10px] text-slate-400 font-medium normal-case truncate max-w-[120px]">{sub.name}</div>
                          </th>
                        ))}
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">
                          Grand Total
                        </th>
                      </tr>
                      {/* Sub-headers */}
                      <tr className="bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800">
                        <th className="sticky left-0 bg-slate-50/50 dark:bg-slate-900/30 px-6 py-2 z-10" />
                        {matrixData.subjects.map(sub => (
                          <React.Fragment key={`sh-${sub.id}`}>
                            <th className="px-2 py-2 text-[9px] font-bold text-slate-400 uppercase text-center w-14">Int 1<br/>/25</th>
                            <th className="px-2 py-2 text-[9px] font-bold text-slate-400 uppercase text-center w-14">Int 2<br/>/25</th>
                            <th className="px-2 py-2 text-[9px] font-bold text-slate-400 uppercase text-center w-14">Asgn<br/>/10</th>
                            <th className="px-2 py-2 text-[9px] font-bold text-brand-500 uppercase text-center w-16">Total<br/>/60</th>
                          </React.Fragment>
                        ))}
                        <th className="px-6 py-2 text-[9px] font-bold text-slate-400 uppercase text-center" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {matrixData.students.map((student, si) => {
                        const studentMarks = matrixData.marks[student.id] || {};
                        let grandTotal = 0;
                        const maxTotal = matrixData.subjects.length * 60;
                        return (
                          <tr key={student.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors ${si % 2 === 0 ? '' : 'bg-slate-50/30 dark:bg-slate-900/10'}`}>
                            <td className="sticky left-0 bg-white dark:bg-slate-800 px-6 py-4 z-10">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center font-black text-sm flex-shrink-0">
                                  {student.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{student.name}</p>
                                  <p className="text-[10px] text-slate-400 truncate">{student.email}</p>
                                </div>
                              </div>
                            </td>
                            {matrixData.subjects.map(sub => {
                              const m = studentMarks[sub.id];
                              const subTotal = m ? m.total : null;
                              if (subTotal !== null) grandTotal += subTotal;
                              return (
                                <React.Fragment key={`m-${student.id}-${sub.id}`}>
                                  <td className="px-2 py-4 text-center">
                                    {m ? (
                                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{m.internal1}</span>
                                    ) : (
                                      <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                                    )}
                                  </td>
                                  <td className="px-2 py-4 text-center">
                                    {m ? (
                                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{m.internal2}</span>
                                    ) : (
                                      <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                                    )}
                                  </td>
                                  <td className="px-2 py-4 text-center">
                                    {m ? (
                                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{m.assignment}</span>
                                    ) : (
                                      <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                                    )}
                                  </td>
                                  <td className="px-2 py-4 text-center">
                                    {m ? (
                                      <span className={`inline-flex items-center justify-center h-7 w-12 rounded-lg text-xs font-black ${
                                        subTotal >= 48 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' :
                                        subTotal >= 36 ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-400' :
                                        'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                                      }`}>
                                        {subTotal}
                                      </span>
                                    ) : (
                                      <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                                    )}
                                  </td>
                                </React.Fragment>
                              );
                            })}
                            <td className="px-6 py-4 text-center">
                              {grandTotal > 0 ? (
                                <div>
                                  <span className="text-base font-black text-slate-900 dark:text-white">{grandTotal}</span>
                                  <span className="text-xs text-slate-400">/{maxTotal}</span>
                                </div>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ===== ENTER MARKS MODE ===== */}
          {activeMode === 'entry' && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Edit3 className="text-brand-600 dark:text-brand-400" size={20} />
                  <h3 className="font-bold text-slate-800 dark:text-white">Internal Assessment Entry</h3>
                </div>
                <select
                  value={selectedSubject}
                  onChange={e => { setSelectedSubject(e.target.value); setMarksData({}); }}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              {!selectedSubject ? (
                <div className="py-16 text-center">
                  <BookOpen className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Select a subject above to start entering marks</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50">
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Student</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Internal 1 <span className="text-brand-400">/25</span></th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Internal 2 <span className="text-brand-400">/25</span></th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Assignment <span className="text-brand-400">/10</span></th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {students.map(student => {
                          const m = marksData[student.id] || { internal1: 0, internal2: 0, assignment: 0 };
                          const total = (m.internal1 || 0) + (m.internal2 || 0) + (m.assignment || 0);
                          return (
                            <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center font-black text-sm">
                                    {student.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{student.name}</p>
                                    <p className="text-[10px] text-slate-500">{student.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <input
                                  type="number" min="0" max="25" placeholder="0"
                                  value={m.internal1 || ''}
                                  onChange={e => handleMarkChange(student.id, 'internal1', e.target.value)}
                                  className="w-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-slate-100"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <input
                                  type="number" min="0" max="25" placeholder="0"
                                  value={m.internal2 || ''}
                                  onChange={e => handleMarkChange(student.id, 'internal2', e.target.value)}
                                  className="w-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-slate-100"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <input
                                  type="number" min="0" max="10" placeholder="0"
                                  value={m.assignment || ''}
                                  onChange={e => handleMarkChange(student.id, 'assignment', e.target.value)}
                                  className="w-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-slate-100"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <span className={`font-black text-lg ${
                                  total >= 48 ? 'text-emerald-600 dark:text-emerald-400' :
                                  total >= 36 ? 'text-brand-600 dark:text-brand-400' :
                                  total > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-300 dark:text-slate-600'
                                }`}>
                                  {total > 0 ? total : '—'}
                                  {total > 0 && <span className="text-xs font-medium text-slate-400">/60</span>}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {students.length === 0 && (
                          <tr>
                            <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                              No students in this section.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                    <button
                      onClick={saveMarks}
                      disabled={isSaving || !selectedSubject}
                      className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-8 py-3 rounded-2xl font-black transition-all shadow-lg shadow-brand-500/20"
                    >
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={20} />}
                      Save All Marks
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ===== TIMETABLE MODE ===== */}
          {activeMode === 'timetable' && (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 text-center py-20">
              <Calendar size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Timetable Editor</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                This feature is coming soon — allowing visual scheduling of subjects into time slots for your section.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageClass;
