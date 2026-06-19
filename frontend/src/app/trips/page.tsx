'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../../components/navigation/Sidebar';
import Header from '../../components/navigation/Header';
import { useTrips, useDeleteTrip } from '../../hooks/useTrip';

export default function TripsList() {
  const router = useRouter();
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [search, setSearch] = useState('');
  const [budgetFilter, setBudgetFilter] = useState('');

  const { data: trips, isLoading, refetch } = useTrips(search, budgetFilter);
  const deleteTripMutation = useDeleteTrip();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Handle live search refetching
  useEffect(() => {
    refetch();
  }, [search, budgetFilter, refetch]);

  const formatCost = (usdAmount: number) => {
    if (currency === 'INR') {
      return `₹${Math.round(usdAmount * 83.5).toLocaleString('en-IN')}`;
    }
    return `$${usdAmount.toLocaleString('en-US')}`;
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this itinerary?')) return;
    
    await deleteTripMutation.mutateAsync(id);
    refetch();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header currency={currency} setCurrency={setCurrency} />

      <div className="flex-1 flex flex-col lg:flex-row">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white">Your Saved Trips</h2>
              <p className="text-xs text-slate-400 mt-1">Search, filter, and review planned itineraries</p>
            </div>
            <Link
              href="/trips/create"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-3 rounded-xl shadow-lg transition duration-200"
            >
              Plan New Trip
            </Link>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow">
            {/* Search Input */}
            <div className="w-full md:w-1/2 relative">
              <input
                type="text"
                placeholder="Search by destination name (e.g., London)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs px-4 py-3 rounded-xl text-white outline-none focus:border-indigo-500 transition"
              />
            </div>
            
            {/* Budget Filters */}
            <div className="w-full md:w-auto flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium shrink-0">Budget:</span>
              <select
                value={budgetFilter}
                onChange={(e) => setBudgetFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs px-4 py-3 rounded-xl text-slate-300 outline-none focus:border-indigo-500 transition w-full md:w-auto"
              >
                <option value="">All Tiers</option>
                <option value="Low">Low Budget</option>
                <option value="Medium">Medium Budget</option>
                <option value="High">High Budget</option>
              </select>
            </div>
          </div>

          {/* Trips Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-44 bg-slate-900 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : !trips || trips.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-850 py-16 rounded-2xl text-center">
              <span className="text-5xl">🗺️</span>
              <h4 className="text-slate-205 font-bold mt-4">No matching travel plans found</h4>
              <p className="text-xs text-slate-500 mt-2">Modify your query filters or create a new trip preference.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <Link
                  key={trip._id}
                  href={`/trips/${trip._id}`}
                  className="bg-slate-900/50 border border-slate-850 hover:border-slate-750 hover:bg-slate-900 hover:shadow-xl rounded-2xl p-5 flex flex-col justify-between space-y-4 transition duration-300 relative group"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-2xl" />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-white text-base md:text-lg line-clamp-1 group-hover:text-indigo-400 transition">
                        {trip.destination}
                      </h4>
                      <button
                        onClick={(e) => handleDelete(e, trip._id)}
                        className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-950/80 transition shrink-0"
                        title="Delete Trip"
                      >
                        🗑️
                      </button>
                    </div>
                    
                    <p className="text-xs text-slate-400 font-medium">
                      {trip.durationDays} Days • {trip.budgetTier === 'Low' ? 'Budget' : trip.budgetTier === 'High' ? 'Luxury' : 'Mid-Range'} Budget
                    </p>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {trip.interests.slice(0, 3).map((interest, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] bg-slate-950 px-2 py-0.5 rounded text-slate-400 font-medium"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-850 pt-3 flex justify-between items-end">
                    <div className="text-left">
                      <p className="text-[9px] text-slate-500 uppercase font-semibold">Total cost</p>
                      <p className="font-bold font-mono text-sm text-white mt-0.5">
                        {formatCost(trip.estimatedBudget?.total || 0)}
                      </p>
                    </div>
                    
                    <span className="text-[10px] text-indigo-400 font-bold group-hover:translate-x-1 transition-transform duration-200">
                      Explore Route →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
