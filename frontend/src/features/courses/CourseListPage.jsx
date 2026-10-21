import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Archive,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../auth/AuthContext';
import CourseModal from './CourseModal';

export default function CourseListPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Query state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('startDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10,
        sortBy,
        sortOrder,
      };
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;

      const response = await api.get('/courses', { params });
      setCourses(response.data.data);
      setMeta(response.data.meta);
    } catch (err) {
      setError(err.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, sortBy, sortOrder]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    setPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleOpenCreateModal = () => {
    setSelectedCourse(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  const handleArchive = async (course) => {
    const confirmed = window.confirm(
      `Are you sure you want to archive course ${course.code} - ${course.title}? Archiving is only allowed if there are no active enrolments.`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/courses/${course.id}`);
      fetchCourses();
    } catch (err) {
      alert(err.message || 'Failed to archive course.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Courses & Curriculum</h1>
          <p className="text-xs text-slate-500">Manage institutional courses, instructors, and enrolments</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Create Course
          </button>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search code or title..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={status}
            onChange={handleStatusChange}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Course Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th
                  onClick={() => handleSort('code')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-800"
                >
                  Code {sortBy === 'code' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th
                  onClick={() => handleSort('title')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-800"
                >
                  Title {sortBy === 'title' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="py-3 px-4">Instructor</th>
                <th
                  onClick={() => handleSort('startDate')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-800"
                >
                  Dates {sortBy === 'startDate' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="py-3 px-4">Enrolment Capacity</th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-800"
                >
                  Status {sortBy === 'status' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-48"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-28"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-28"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No courses found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try adjusting your filters or search keywords.</p>
                  </td>
                </tr>
              ) : (
                courses.map((course) => {
                  const enrolledCount = course._count?.enrolments ?? 0;
                  const capacity = course.capacity;
                  const isFull = capacity ? enrolledCount >= capacity : false;

                  return (
                    <tr key={course.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-medium text-indigo-600">
                        {course.code}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate">
                        {course.title}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {course.instructor ? (
                          <span>{course.instructor.firstName} {course.instructor.lastName}</span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <div>{new Date(course.startDate).toLocaleDateString()}</div>
                        <div className="text-[11px] text-slate-400">
                          to {course.endDate ? new Date(course.endDate).toLocaleDateString() : 'Ongoing'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${isFull ? 'text-amber-600' : 'text-slate-800'}`}>
                            {enrolledCount} {capacity ? `/ ${capacity}` : 'enrolled'}
                          </span>
                          {isFull && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                              FULL
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            course.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : course.status === 'DRAFT'
                              ? 'bg-slate-100 text-slate-600 border border-slate-200'
                              : course.status === 'COMPLETED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {course.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => navigate(`/courses/${course.id}`)}
                            title="View Roster"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(course)}
                                title="Edit Course"
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {course.status !== 'ARCHIVED' && (
                                <button
                                  onClick={() => handleArchive(course)}
                                  title="Archive Course"
                                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{courses.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{meta.total}</span> courses
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!meta.hasPrevPage || loading}
              className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page {meta.page} of {meta.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!meta.hasNextPage || loading}
              className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Course Create / Edit Modal */}
      <CourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        course={selectedCourse}
        onSaved={fetchCourses}
      />
    </div>
  );
}
