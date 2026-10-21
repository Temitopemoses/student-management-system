import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import StudentListPage from './features/students/StudentListPage';
import StudentDetailPage from './features/students/StudentDetailPage';
import CourseListPage from './features/courses/CourseListPage';
import CourseDetailPage from './features/courses/CourseDetailPage';
import AttendanceSheetPage from './features/attendance/AttendanceSheetPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="students" element={<StudentListPage />} />
            <Route path="students/:id" element={<StudentDetailPage />} />
            <Route path="courses" element={<CourseListPage />} />
            <Route path="courses/:id" element={<CourseDetailPage />} />
            <Route path="attendance" element={<AttendanceSheetPage />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
