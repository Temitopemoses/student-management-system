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
  Users,
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../auth/AuthContext';
import StudentModal from './StudentModal';

export default function StudentListPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Query state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchStudents = useCallback(async () => {
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

      const response = await api.get('/students', { params });
      setStudents(response.data.data);
      setMeta(response.data.meta);
    } catch (err) {
      setError(err.message || 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, sortBy, sortOrder]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to page 1 on search
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
    setSelectedStudent(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleArchive = async (student) => {
    const confirmed = window.confirm(
      `Are you sure you want to archive student ${student.firstName} ${student.lastName} (${student.studentNumber})? This will mark them as ARCHIVED.`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/students/${student.id}`);
      fetchStudents();
    } catch (err) {
      alert(err.message || 'Failed to archive student.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Student Directory</h1>
          <p className="text-xs text-slate-500">Manage admissions, academic records, and status</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Register Student
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
            placeholder="Search name, ID, or email..."
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
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th
                  onClick={() => handleSort('studentNumber')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-800"
                >
                  Student Number {sortBy === 'studentNumber' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th
                  onClick={() => handleSort('firstName')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-800"
                >
                  Name {sortBy === 'firstName' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="py-3 px-4">Contact</th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-800"
                >
                  Status {sortBy === 'status' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="py-3 px-4">Enrolments</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                // Loading Skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-40"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-200 rounded w-10"></div></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : students.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No students found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try refining your search terms or filters.</p>
                  </td>
                </tr>
              ) : (
                students.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-indigo-600">
                      {stu.studentNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {stu.firstName} {stu.lastName}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800">{stu.email || '—'}</div>
                      <div className="text-[11px] text-slate-400">{stu.phone || 'No phone'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          stu.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : stu.status === 'INACTIVE'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {stu.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {stu._count?.enrolments ?? 0} courses
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => navigate(`/students/${stu.id}`)}
                          title="View Profile"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(stu)}
                              title="Edit Record"
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {stu.status !== 'ARCHIVED' && (
                              <button
                                onClick={() => handleArchive(stu)}
                                title="Archive Student"
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{students.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{meta.total}</span> records
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

      {/* Create / Edit Modal */}
      <StudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        student={selectedStudent}
        onSaved={fetchStudents}
      />
    </div>
  );
}
