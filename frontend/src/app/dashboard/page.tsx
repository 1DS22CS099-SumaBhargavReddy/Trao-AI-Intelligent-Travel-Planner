'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../../components/navigation/Sidebar';
import Header from '../../components/navigation/Header';
import { useTrips } from '../../hooks/useTrip';

export default function Dashboard() {
  const router = useRouter();
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const { data: trips, isLoading } = useTrips();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Conversion math
  const formatCost = (usdAmount: number) => {
    if (currency === 'INR') {
      return `₹${Math.round(usdAmount * 83.5).toLocaleString('en-IN')}`;
    }
    return `$${usdAmount.toLocaleString('en-US')}`;
  };

  // Compute statistics
  const totalTrips = trips?.length || 0;
  const totalDays = trips?.reduce((sum, t) => sum + (t.durationDays || 0), 0) || 0;
  const totalBudgetUSD = trips?.reduce((sum, t) => sum + (t.estimatedBudget?.total || 0), 0) || 0;
  const totalItemsPacked = trips?.reduce((sum, t) => sum + (t.packingList?.filter(i => i.isPacked).length || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      <Header currency={currency} setCurrency={setCurrency} />

      <div className="flex-1 flex flex-col lg:flex-row">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-8 max-w-6xl w-full mx-auto">
          {/* Welcome Intro */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900">Dashboard Overview</h2>
              <p className="text-xs text-gray-500 mt-1">SaaS metrics & rapid planning shortcuts</p>
            </div>
            <Link
              href="/trips/create"
              className="bg-black hover:bg-gray-800 text-white font-semibold text-xs px-5 py-3 rounded-xl shadow-sm transition duration-200 self-start md:self-auto"
            >
              ✨ Plan New Adventure
            </Link>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Trips Planned', value: totalTrips, color: 'border-gray-200 text-gray-900', icon: '🗺️' },
              { label: 'Cumulative Days', value: totalDays, color: 'border-gray-200 text-gray-900', icon: '📅' },
              { label: 'Estimated Expenditures', value: formatCost(totalBudgetUSD), color: 'border-gray-200 text-gray-900', icon: '💰' },
              { label: 'Checklist Items Packed', value: totalItemsPacked, color: 'border-gray-200 text-gray-900', icon: '⛈️' }
            ].map((item, idx) => (
              <div
                key={idx}
                className={`bg-white border ${item.color} rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-3 relative overflow-hidden`}
              >
                <div className="text-lg md:text-2xl font-black text-gray-900">{item.value}</div>
                <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider leading-tight">{item.label}</div>
                <span className="absolute top-3 right-4 opacity-15 text-xl">{item.icon}</span>
              </div>
            ))}
          </div>

          {/* Main workspace layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Recent Trips lists */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2">
                Recent Itineraries
              </h3>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((n) => (
                    <div key={n} className="h-28 bg-white border border-gray-100 animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : !trips || trips.length === 0 ? (
                <div className="bg-white border border-gray-200 p-8 rounded-2xl text-center shadow-sm">
                  <p className="text-xs text-gray-500 mb-4">No trips planned yet.</p>
                  <Link
                    href="/trips/create"
                    className="inline-block bg-white border border-gray-300 hover:border-gray-400 text-xs text-gray-900 px-4 py-2.5 rounded-xl transition"
                  >
                    Generate Your First Itinerary
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {trips.slice(0, 3).map((trip) => (
                    <Link
                      key={trip._id}
                      href={`/trips/${trip._id}`}
                      className="block bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-2xl p-5 shadow-sm hover:shadow transition duration-200 group relative"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-gray-900 group-hover:text-black transition-colors text-base truncate">
                            {trip.destination}
                          </h4>
                          <p className="text-xs text-gray-500 font-medium">
                            {trip.durationDays} Days • {trip.budgetTier === 'Low' ? 'Budget' : trip.budgetTier === 'High' ? 'Luxury' : 'Mid-Range'} Budget
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-mono text-gray-400">Total Cost</p>
                          <p className="text-sm font-bold font-mono text-gray-900 mt-0.5">
                            {formatCost(trip.estimatedBudget?.total || 0)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions sidebar */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2">
                Quick Shortcuts
              </h3>
              <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 shadow-sm">
                <Link
                  href="/trips"
                  className="block text-center bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs text-gray-700 py-3 rounded-xl transition font-semibold"
                >
                  📁 Browse All Saved Trips
                </Link>
                <Link
                  href="/profile"
                  className="block text-center bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs text-gray-700 py-3 rounded-xl transition font-semibold"
                >
                  👤 Manage User Profile
                </Link>
                <Link
                  href="/settings"
                  className="block text-center bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs text-gray-700 py-3 rounded-xl transition font-semibold"
                >
                  ⚙️ System Configurations
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
