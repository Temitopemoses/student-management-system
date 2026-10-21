import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, BookOpen, CalendarCheck, LayoutDashboard, GraduationCap } from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {

  const navItems = [
    { label: 'Students', path: '/students', icon: Users },
    { label: 'Courses', path: '/courses', icon: BookOpen },
    { label: 'Attendance', path: '/attendance', icon: CalendarCheck },
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900 text-slate-300 z-50 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white tracking-tight">EduSMS</h1>
            <p className="text-[10px] text-slate-400">Academy Portal</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* System Info */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500">
          <div className="flex items-center justify-between">
            <span>Status</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Online
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
