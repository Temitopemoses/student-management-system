import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import api from '../../api/client';

export default function CourseModal({ isOpen, onClose, course, onSaved }) {
  const isEdit = !!course;

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    instructorId: '',
    startDate: '',
    endDate: '',
    capacity: '',
    status: 'DRAFT',
  });

  const [instructors, setInstructors] = useState([]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const response = await api.get('/users/instructors');
        setInstructors(response.data.data);
      } catch {
        // Soft fail if instructors cannot be fetched
      }
    };
    if (isOpen) {
      fetchInstructors();
    }
  }, [isOpen]);

  useEffect(() => {
    if (course) {
      setFormData({
        code: course.code || '',
        title: course.title || '',
        description: course.description || '',
        instructorId: course.instructorId || '',
        startDate: course.startDate ? course.startDate.split('T')[0] : '',
        endDate: course.endDate ? course.endDate.split('T')[0] : '',
        capacity: course.capacity !== null && course.capacity !== undefined ? String(course.capacity) : '',
        status: course.status || 'DRAFT',
      });
    } else {
      setFormData({
        code: '',
        title: '',
        description: '',
        instructorId: '',
        startDate: '',
        endDate: '',
        capacity: '',
        status: 'DRAFT',
      });
    }
    setError(null);
  }, [course, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      setError('End date cannot be earlier than start date.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        code: formData.code.trim().toUpperCase(),
        capacity: formData.capacity ? parseInt(formData.capacity, 10) : undefined,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        instructorId: formData.instructorId || undefined,
      };

      if (isEdit) {
        await api.patch(`/courses/${course.id}`, payload);
      } else {
        await api.post('/courses', payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save course.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {isEdit ? 'Edit Course' : 'Create New Course'}
            </h2>
            <p className="text-xs text-slate-500">
              {isEdit ? `Updating: ${course.code}` : 'Define course details, instructor, and capacity.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="code">
                Code *
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g. CS-101"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="title">
                Course Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Modern Full-Stack Development"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Outline syllabus, prerequisites, and learning objectives..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="instructorId">
                Assigned Instructor
              </label>
              <select
                id="instructorId"
                name="instructorId"
                value={formData.instructorId}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">No Instructor Assigned</option>
                {instructors.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.firstName} {inst.lastName} ({inst.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="capacity">
                Capacity Limit (Seats)
              </label>
              <input
                id="capacity"
                name="capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={handleChange}
                placeholder="e.g. 25 (Blank for unlimited)"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="startDate">
                Start Date *
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                required
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="endDate">
                End Date
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="status">
              Course Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEdit ? 'Update Course' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
