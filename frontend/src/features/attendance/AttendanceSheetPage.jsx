import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  Users,
} from 'lucide-react';
import api from '../../api/client';

export default function AttendanceSheetPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [roster, setRoster] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  // 1. Fetch active courses for dropdown
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const response = await api.get('/courses', { params: { status: 'ACTIVE', limit: 50 } });
        setCourses(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedCourseId(response.data.data[0].id);
        }
      } catch (err) {
        setFeedback({ type: 'error', message: err.message || 'Failed to load courses.' });
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  // 2. Fetch attendance roster when course or date changes
  const fetchRoster = useCallback(async () => {
    if (!selectedCourseId) return;

    setLoadingRoster(true);
    setFeedback(null);
    try {
      const response = await api.get(`/attendance/course/${selectedCourseId}`, {
        params: { date: selectedDate },
      });
      // Initialize roster with default 'PRESENT' if no previous record exists
      const initialRoster = response.data.data.roster.map((item) => ({
        ...item,
        status: item.status || 'PRESENT',
      }));
      setRoster(initialRoster);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load attendance roster.' });
    } finally {
      setLoadingRoster(false);
    }
  }, [selectedCourseId, selectedDate]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  const handleStatusChange = (studentId, status) => {
    setRoster((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, status } : item))
    );
  };

  const handleNotesChange = (studentId, notes) => {
    setRoster((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, notes } : item))
    );
  };

  const handleMarkAll = (status) => {
    setRoster((prev) => prev.map((item) => ({ ...item, status })));
  };

  const handleSaveAttendance = async () => {
    if (!selectedCourseId || roster.length === 0) return;

    setSaving(true);
    setFeedback(null);
    try {
      const records = roster.map((item) => ({
        studentId: item.studentId,
        status: item.status,
        notes: item.notes ? item.notes.trim() : undefined,
      }));

      await api.post('/attendance', {
        courseId: selectedCourseId,
        date: selectedDate,
        records,
      });

      setFeedback({
        type: 'success',
        message: `Attendance for ${records.length} student(s) on ${selectedDate} saved successfully!`,
      });
      fetchRoster();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to save attendance records.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Attendance Management</h1>
        <p className="text-xs text-slate-500">Record, review, and adjust daily student attendance</p>
      </div>

      {/* Control Bar: Select Course & Date */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="w-full sm:w-64">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              disabled={loadingCourses}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-44">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Session Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Quick Batch Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-4">
          <button
            type="button"
            onClick={() => handleMarkAll('PRESENT')}
            disabled={roster.length === 0 || loadingRoster}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition disabled:opacity-50"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
            Mark All Present
          </button>
          <button
            type="button"
            onClick={handleSaveAttendance}
            disabled={roster.length === 0 || saving || loadingRoster}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Sheet'}
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Roster Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Enrolled Students ({roster.length})
          </h2>
          <span className="text-xs text-slate-400">Date: {selectedDate}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4 text-center">Status Selection</th>
                <th className="py-3 px-4">Session Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loadingRoster ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-36"></div></td>
                    <td className="py-3.5 px-4 text-center"><div className="h-6 bg-slate-200 rounded w-48 mx-auto"></div></td>
                    <td className="py-3.5 px-4"><div className="h-6 bg-slate-200 rounded w-40"></div></td>
                  </tr>
                ))
              ) : roster.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-400">
                    <CalendarCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No active students enrolled in this course</p>
                    <p className="text-xs text-slate-400 mt-0.5">Enrol students in the course roster first.</p>
                  </td>
                </tr>
              ) : (
                roster.map((student) => (
                  <tr key={student.studentId} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="font-mono text-[11px] text-indigo-600">
                        {student.studentNumber}
                      </div>
                    </td>

                    {/* Status Pill Toggle Buttons */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {[
                          { key: 'PRESENT', label: 'Present', color: 'emerald' },
                          { key: 'LATE', label: 'Late', color: 'amber' },
                          { key: 'ABSENT', label: 'Absent', color: 'red' },
                          { key: 'EXCUSED', label: 'Excused', color: 'slate' },
                        ].map((opt) => {
                          const isActive = student.status === opt.key;
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => handleStatusChange(student.studentId, opt.key)}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition border ${
                                isActive
                                  ? opt.key === 'PRESENT'
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                    : opt.key === 'LATE'
                                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                    : opt.key === 'ABSENT'
                                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                                    : 'bg-slate-700 text-white border-slate-700 shadow-xs'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    {/* Notes input */}
                    <td className="py-3.5 px-4">
                      <input
                        type="text"
                        value={student.notes || ''}
                        onChange={(e) => handleNotesChange(student.studentId, e.target.value)}
                        placeholder="Optional note..."
                        className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white bg-slate-50"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
