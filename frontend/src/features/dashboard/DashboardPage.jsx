import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  BookOpen,
  UserCheck,
  GraduationCap,
  Percent,
  Clock,
  ArrowRight,
  AlertCircle,
  Activity,
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../auth/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, activityRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/recent-activity', { params: { limit: 8 } }),
        ]);
        setStats(statsRes.data.data);
        setActivities(activityRes.data.data);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const kpis = stats?.kpis;

  const statCards = [
    {
      title: 'Active Students',
      value: kpis?.activeStudents ?? 0,
      icon: Users,
      color: 'indigo',
      link: '/students',
    },
    {
      title: 'Active Courses',
      value: kpis?.activeCourses ?? 0,
      icon: BookOpen,
      color: 'blue',
      link: '/courses',
    },
    {
      title: 'Active Instructors',
      value: kpis?.activeInstructors ?? 0,
      icon: UserCheck,
      color: 'emerald',
    },
    {
      title: 'Current Enrolments',
      value: kpis?.currentEnrolments ?? 0,
      icon: GraduationCap,
      color: 'purple',
    },
    {
      title: '30-Day Attendance Rate',
      value: `${kpis?.attendanceRate30Days ?? 100}%`,
      subtitle: `${kpis?.attendanceSessionsCount ?? 0} sessions tracked`,
      icon: Percent,
      color: 'amber',
      link: '/attendance',
    },
  ];

  const formatAction = (action) => {
    switch (action) {
      case 'STUDENT_CREATE': return { label: 'Student Registered', color: 'bg-emerald-50 text-emerald-700' };
      case 'STUDENT_UPDATE': return { label: 'Student Updated', color: 'bg-blue-50 text-blue-700' };
      case 'STUDENT_ARCHIVE': return { label: 'Student Archived', color: 'bg-red-50 text-red-700' };
      case 'COURSE_CREATE': return { label: 'Course Created', color: 'bg-indigo-50 text-indigo-700' };
      case 'COURSE_UPDATE': return { label: 'Course Updated', color: 'bg-blue-50 text-blue-700' };
      case 'COURSE_ARCHIVE': return { label: 'Course Archived', color: 'bg-red-50 text-red-700' };
      case 'ENROLMENT_CREATE': return { label: 'Student Enrolled', color: 'bg-purple-50 text-purple-700' };
      case 'ENROLMENT_WITHDRAW': return { label: 'Student Withdrawn', color: 'bg-amber-50 text-amber-700' };
      case 'ATTENDANCE_RECORD': return { label: 'Attendance Sheet', color: 'bg-emerald-50 text-emerald-700' };
      case 'ATTENDANCE_CORRECT': return { label: 'Attendance Amended', color: 'bg-amber-50 text-amber-700' };
      default: return { label: action.replace(/_/g, ' '), color: 'bg-slate-100 text-slate-700' };
    }
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Welcome Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Welcome back, {user?.firstName} {user?.lastName}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Academic Administration Dashboard • Role: <span className="font-semibold text-indigo-600">{user?.role}</span>
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              onClick={() => card.link && navigate(card.link)}
              className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-xs transition ${
                card.link ? 'cursor-pointer hover:border-indigo-300 hover:shadow-sm' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{card.title}</span>
                <div className="p-2 rounded-xl bg-slate-50 text-indigo-600">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-extrabold text-slate-900">
                  {loading ? <div className="h-7 bg-slate-200 rounded w-16 animate-pulse"></div> : card.value}
                </div>
                {card.subtitle && (
                  <p className="text-[11px] text-slate-400 mt-0.5">{card.subtitle}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Grid: Recently Registered Students & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recently Registered Students */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Recently Registered Students
              </h2>
              <button
                onClick={() => navigate('/students')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 animate-pulse flex items-center justify-between">
                    <div className="h-4 bg-slate-200 rounded w-32"></div>
                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                  </div>
                ))
              ) : stats?.recentlyRegisteredStudents?.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No recently registered students.</div>
              ) : (
                stats?.recentlyRegisteredStudents?.map((stu) => (
                  <div
                    key={stu.id}
                    onClick={() => navigate(`/students/${stu.id}`)}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {stu.firstName} {stu.lastName}
                      </div>
                      <div className="font-mono text-[11px] text-indigo-600">{stu.studentNumber}</div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {stu.status}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {new Date(stu.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent System Activity History */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                Recent System Activity
              </h2>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 animate-pulse flex items-center justify-between">
                    <div className="h-4 bg-slate-200 rounded w-48"></div>
                    <div className="h-4 bg-slate-200 rounded w-16"></div>
                  </div>
                ))
              ) : activities.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No activity recorded yet.</div>
              ) : (
                activities.map((act) => {
                  const badge = formatAction(act.action);
                  return (
                    <div key={act.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.color}`}>
                          {badge.label}
                        </span>
                        <div>
                          <div className="font-medium text-slate-800">
                            {act.user ? `${act.user.firstName} ${act.user.lastName}` : 'System'}
                          </div>
                          {act.metadata && (
                            <div className="text-[11px] text-slate-400">
                              {act.metadata.code || act.metadata.studentNumber || act.metadata.fullName || act.metadata.description || act.entityType}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
