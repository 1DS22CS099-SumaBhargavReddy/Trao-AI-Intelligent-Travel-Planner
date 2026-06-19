'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: '📊 Dashboard Overview', path: '/dashboard' },
    { name: '✈️ Saved Itineraries', path: '/trips' },
    { name: '✨ Plan New Escape', path: '/trips/create' },
    { name: '👤 Personal Profile', path: '/profile' },
    { name: '⚙️ Account Settings', path: '/settings' },
    { name: '🛠️ API Diagnostics', path: '/admin/api-health' }
  ];

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    router.push('/login');
  };

  return (
    <aside className="w-full lg:w-64 bg-white border-r border-gray-100 shrink-0 lg:min-h-[calc(100vh-65px)] p-6 flex flex-col justify-between gap-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500 mb-3">Navigation Workspace</h3>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-black text-white shadow-md'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 border border-transparent transition-all duration-200"
        >
          👋 Sign Out Session
        </button>
      </div>
    </aside>
  );
}
