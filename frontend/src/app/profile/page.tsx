'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/navigation/Sidebar';
import Header from '../../components/navigation/Header';

export default function ProfilePage() {
  const router = useRouter();
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [userEmail, setUserEmail] = useState('Traveler');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
    const email = localStorage.getItem('userEmail');
    if (email) setUserEmail(email);
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header currency={currency} setCurrency={setCurrency} />

      <div className="flex-1 flex flex-col lg:flex-row">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-8 max-w-4xl w-full mx-auto">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white">User Profile</h2>
            <p className="text-xs text-slate-400 mt-1">Manage your subscriber credentials and flight preferences</p>
          </div>

          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 max-w-xl">
            <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
              <div className="w-14 h-14 bg-indigo-600/20 text-indigo-400 text-2xl flex items-center justify-center rounded-2xl font-bold border border-indigo-500/20">
                👤
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Registered Account</h3>
                <p className="text-xs text-slate-400">Authenticated via JWT secure token keys</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Email Address</label>
                <p className="text-sm font-semibold text-slate-200 bg-slate-950 border border-slate-850 px-4 py-3 rounded-xl">{userEmail}</p>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Account Tier</label>
                <p className="text-sm font-semibold text-slate-200 bg-slate-950 border border-slate-850 px-4 py-3 rounded-xl">Premium SaaS Enterprise Member</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
