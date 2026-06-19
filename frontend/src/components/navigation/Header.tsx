'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface HeaderProps {
  currency: 'USD' | 'INR';
  setCurrency: (currency: 'USD' | 'INR') => void;
}

export default function Header({ currency, setCurrency }: HeaderProps) {
  const [userEmail, setUserEmail] = useState('Traveler');

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (email) setUserEmail(email);
  }, []);

  return (
    <header className="border-b border-gray-100 bg-white/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
      <Link href="/dashboard" className="flex items-center gap-3 group">
        <span className="text-2xl group-hover:rotate-12 transition-transform duration-300">✈️</span>
        <div>
          <h1 className="text-base md:text-lg font-black tracking-tight text-gray-900">
            Trao AI Travel Planner
          </h1>
          <p className="text-[9px] text-gray-500 font-mono tracking-wider uppercase">Enterprise SaaS Edition</p>
        </div>
      </Link>

      <div className="flex items-center gap-4">
        {/* Global Currency Conversion Toggle */}
        <div className="flex items-center gap-0.5 bg-gray-50 border border-gray-200 p-1 rounded-xl shadow-inner">
          <button
            onClick={() => setCurrency('USD')}
            className={`px-3 py-1 rounded-lg text-[10px] md:text-xs font-bold transition duration-200 ${
              currency === 'USD' 
                ? 'bg-black text-white shadow-md' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            USD ($)
          </button>
          <button
            onClick={() => setCurrency('INR')}
            className={`px-3 py-1 rounded-lg text-[10px] md:text-xs font-bold transition duration-200 ${
              currency === 'INR' 
                ? 'bg-black text-white shadow-md' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            INR (₹)
          </button>
        </div>

        {/* User Info Capsule */}
        <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-mono text-gray-500 max-w-[150px] truncate">{userEmail}</span>
        </div>
      </div>
    </header>
  );
}
