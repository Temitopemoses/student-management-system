import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import api from '../../api/client';

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudent = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/students/${id}`);
        setStudent(response.data.data);
      } catch (err) {
        setError(err.message || 'Failed to load student profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 animate-pulse text-sm">
        Loading student profile...
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
        <span>{error || 'Student not found.'}</span>
      </div>
    );
  }

  const { attendanceStats } = student;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back Navigation */}
      <button
        onClick={() => navigate('/students')}
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Student Directory
      </button>

      {/* Header Profile Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
            {student.firstName[0]}
            {student.lastName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">
                {student.firstName} {student.lastName}
              </h1>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  student.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {student.status}
              </span>
            </div>
            <p className="text-xs font-mono text-indigo-600 mt-0.5">{student.studentNumber}</p>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Enrolled since: <span className="text-slate-600 font-medium">{new Date(student.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Grid: Details & Attendance KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Personal Details */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
            Demographic & Contact Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex items-center gap-2.5 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{student.email || 'No email registered'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{student.phone || 'No phone registered'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                DOB: {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'Unspecified'}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <span className="w-4 h-4 text-center font-bold text-slate-400 shrink-0">⚥</span>
              <span>Gender: {student.gender || 'Unspecified'}</span>
            </div>
            <div className="sm:col-span-2 flex items-center gap-2.5 text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Address: {student.address || 'No address provided'}</span>
            </div>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
              Attendance Performance
            </h2>
            <div className="py-4 text-center">
              <div className="text-3xl font-extrabold text-slate-900">
                {attendanceStats?.attendancePercentage ?? 100}%
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Calculated attendance rate</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-800 flex items-center justify-between">
              <span className="flex items-center gap-1 font-medium"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Present</span>
              <span className="font-bold">{attendanceStats?.present ?? 0}</span>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-800 flex items-center justify-between">
              <span className="flex items-center gap-1 font-medium"><Clock className="w-3.5 h-3.5 text-amber-600" /> Late</span>
              <span className="font-bold">{attendanceStats?.late ?? 0}</span>
            </div>
            <div className="p-2 bg-red-50 rounded-lg text-red-800 flex items-center justify-between">
              <span className="flex items-center gap-1 font-medium"><XCircle className="w-3.5 h-3.5 text-red-600" /> Absent</span>
              <span className="font-bold">{attendanceStats?.absent ?? 0}</span>
            </div>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1 font-medium"><AlertCircle className="w-3.5 h-3.5 text-slate-500" /> Excused</span>
              <span className="font-bold">{attendanceStats?.excused ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enrolled Courses */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          Enrolled Courses ({student.enrolments?.length ?? 0})
        </h2>

        {student.enrolments?.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No courses currently enrolled.</p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {student.enrolments?.map((enrol) => (
              <div key={enrol.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-mono font-semibold text-indigo-600">{enrol.course.code}</span>
                  <span className="mx-2 text-slate-300">•</span>
                  <span className="font-medium text-slate-800">{enrol.course.title}</span>
                  {enrol.course.instructor && (
                    <span className="block text-[11px] text-slate-400 mt-0.5">
                      Instructor: {enrol.course.instructor.firstName} {enrol.course.instructor.lastName}
                    </span>
                  )}
                </div>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                  {enrol.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
