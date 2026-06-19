'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/navigation/Sidebar';
import Header from '../../components/navigation/Header';

export default function SettingsPage() {
  const router = useRouter();
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header currency={currency} setCurrency={setCurrency} />

      <div className="flex-1 flex flex-col lg:flex-row">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-8 max-w-4xl w-full mx-auto">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white">System Settings</h2>
            <p className="text-xs text-slate-400 mt-1">Configure global preferences, weather sensors, and database index options</p>
          </div>

          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 max-w-xl">
            <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
              <div className="w-14 h-14 bg-indigo-600/20 text-indigo-400 text-2xl flex items-center justify-center rounded-2xl font-bold border border-indigo-500/20">
                ⚙️
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Application Preferences</h3>
                <p className="text-xs text-slate-400">Configure parameters for offline testing & mock fallbacks</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-slate-950 border border-slate-850 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-slate-200">Default Currency</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Primary currency for itinerary generation calculations</p>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                  USD ($)
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-slate-950 border border-slate-850 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-slate-200">Database Fallback Option</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Use MongoDB memory server if MONGO_URI is omitted</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                  Active
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
