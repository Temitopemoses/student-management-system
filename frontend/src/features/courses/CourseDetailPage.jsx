import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Users,
  UserPlus,
  UserX,
  AlertCircle,
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../auth/AuthContext';
import EnrolStudentModal from '../enrolments/EnrolStudentModal';

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolModalOpen, setIsEnrolModalOpen] = useState(false);

  const fetchCourse = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/courses/${id}`);
      setCourse(response.data.data);
    } catch (err) {
      setError(err.message || 'Failed to load course details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const handleWithdraw = async (enrolment) => {
    const reason = window.prompt(
      `Please provide a withdrawal reason for student ${enrolment.student.firstName} ${enrolment.student.lastName}:`,
      'Student request'
    );
    if (reason === null) return; // Cancelled

    try {
      await api.post(`/enrolments/${enrolment.id}/withdraw`, { notes: reason });
      fetchCourse();
    } catch (err) {
      alert(err.message || 'Failed to withdraw student.');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 animate-pulse text-sm">
        Loading course roster...
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
        <span>{error || 'Course not found.'}</span>
      </div>
    );
  }

  const capacity = course.capacity;
  const activeCount = course.activeEnrolmentsCount || 0;
  const percentFilled = capacity ? Math.min(100, Math.round((activeCount / capacity) * 100)) : null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back link */}
      <button
        onClick={() => navigate('/courses')}
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Courses
      </button>

      {/* Header Course Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              {course.code}
            </span>
            <h1 className="text-xl font-bold text-slate-900">{course.title}</h1>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                course.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {course.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">{course.description || 'No description provided.'}</p>
        </div>

        {isAdmin && course.status === 'ACTIVE' && (
          <button
            onClick={() => setIsEnrolModalOpen(true)}
            disabled={course.isFull}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            Enrol Student
          </button>
        )}
      </div>

      {/* Metadata & Capacity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Instructor</div>
          {course.instructor ? (
            <div>
              <div className="text-sm font-bold text-slate-900">
                {course.instructor.firstName} {course.instructor.lastName}
              </div>
              <div className="text-xs text-slate-500">{course.instructor.email}</div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">No instructor currently assigned.</div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Schedule Period</div>
          <div className="text-xs text-slate-700 space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Starts: {new Date(course.startDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Ends: {course.endDate ? new Date(course.endDate).toLocaleDateString() : 'Ongoing'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Enrolment Roster</span>
            <span className="font-mono text-slate-800">{activeCount} / {capacity || '∞'}</span>
          </div>
          {capacity ? (
            <div className="space-y-1.5 pt-1">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    percentFilled >= 90 ? 'bg-amber-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${percentFilled}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                {course.availableSeats} seat(s) remaining ({percentFilled}% full)
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-600 pt-1">Open capacity (No seat limit configured)</p>
          )}
        </div>
      </div>

      {/* Enrolled Students Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Class Roster ({course.enrolments?.length ?? 0} students)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Enrolled Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {course.enrolments?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No students currently enrolled in this course.
                  </td>
                </tr>
              ) : (
                course.enrolments?.map((enrol) => (
                  <tr key={enrol.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {enrol.student.firstName} {enrol.student.lastName}
                      </div>
                      <div className="font-mono text-[11px] text-indigo-600">
                        {enrol.student.studentNumber}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{enrol.student.email || '—'}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(enrol.enrolledAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          enrol.status === 'ENROLLED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : enrol.status === 'COMPLETED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {enrol.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {enrol.notes || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isAdmin && enrol.status === 'ENROLLED' && (
                        <button
                          onClick={() => handleWithdraw(enrol)}
                          title="Withdraw Student"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 rounded-md transition"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          Withdraw
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enrol Student Modal */}
      <EnrolStudentModal
        isOpen={isEnrolModalOpen}
        onClose={() => setIsEnrolModalOpen(false)}
        course={course}
        onEnrolled={fetchCourse}
      />
    </div>
  );
}
