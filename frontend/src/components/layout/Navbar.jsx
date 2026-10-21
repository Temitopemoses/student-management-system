import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          aria-label="Toggle navigation menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="hidden sm:inline-block text-xs font-medium text-slate-500 uppercase tracking-wider">
          Student Management System
        </span>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-medium text-xs">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-800">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-600">
                {user.role}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          title="Sign out"
          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
