import React, { useState, useEffect } from 'react';
import { X, AlertCircle, UserCheck } from 'lucide-react';
import api from '../../api/client';

export default function EnrolStudentModal({ isOpen, onClose, course, onEnrolled }) {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchActiveStudents = async () => {
      setLoadingStudents(true);
      try {
        const response = await api.get('/students', {
          params: { status: 'ACTIVE', limit: 50, search: search.trim() || undefined },
        });
        setStudents(response.data.data);
      } catch {
        // Soft fail
      } finally {
        setLoadingStudents(false);
      }
    };

    if (isOpen) {
      fetchActiveStudents();
      setSelectedStudentId('');
      setNotes('');
      setError(null);
    }
  }, [isOpen, search]);

  if (!isOpen || !course) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setError('Please select an active student to enrol.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.post('/enrolments', {
        studentId: selectedStudentId,
        courseId: course.id,
        notes: notes.trim() || undefined,
      });

      onEnrolled();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to enrol student in course.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Enrol Student</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{course.code} • {course.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Course Capacity Alert */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
            <span>Enrolment Capacity:</span>
            <span className="font-semibold text-slate-800">
              {course.capacity ? `${course.activeEnrolmentsCount || 0} / ${course.capacity} seats taken` : 'Unlimited'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Search & Select Active Student *
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or student number..."
              className="w-full px-3 py-1.5 mb-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose active student --</option>
              {students.map((stu) => (
                <option key={stu.id} value={stu.id}>
                  {stu.studentNumber} - {stu.firstName} {stu.lastName} ({stu.email || 'No email'})
                </option>
              ))}
            </select>
            {loadingStudents && <p className="text-[11px] text-slate-400 mt-1">Filtering students...</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="notes">
              Enrolment Notes (Optional)
            </label>
            <textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Scholarship recipient, prerequisite verified..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (course.capacity && course.activeEnrolmentsCount >= course.capacity)}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              {submitting ? 'Enrolling...' : 'Confirm Enrolment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
