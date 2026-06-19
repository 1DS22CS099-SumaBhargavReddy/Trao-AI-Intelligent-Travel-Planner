'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../../../components/navigation/Sidebar';
import Header from '../../../components/navigation/Header';
import { useTrip, useUpdateTrip, useRegenerateDay } from '../../../hooks/useTrip';
import { Trip } from '../../../types';

interface TripContextProps {
  trip: Trip;
  currency: 'USD' | 'INR';
  setCurrency: (c: 'USD' | 'INR') => void;
  updateTrip: (updates: Partial<Trip>) => Promise<any>;
  regenerateDay: (dayNumber: number, promptText: string) => Promise<any>;
  isUpdating: boolean;
  isRegenerating: boolean;
  refetch: () => void;
}

const TripContext = createContext<TripContextProps | undefined>(undefined);

export function useTripContext() {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTripContext must be used within a TripProvider');
  }
  return context;
}

export default function TripLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;

  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const { data: trip, isLoading, error, refetch } = useTrip(id);
  const updateMutation = useUpdateTrip(id);
  const regenerateMutation = useRegenerateDay(id);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Header currency={currency} setCurrency={setCurrency} />
        <div className="flex-1 flex flex-col lg:flex-row">
          <Sidebar />
          <main className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="flex flex-col items-center gap-4">
              <svg className="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm text-slate-400 font-medium">Fetching adventure specifications...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Header currency={currency} setCurrency={setCurrency} />
        <div className="flex-1 flex flex-col lg:flex-row">
          <Sidebar />
          <main className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="bg-slate-900 border border-red-500/20 p-8 rounded-2xl text-center max-w-md w-full space-y-4">
              <span className="text-4xl">⚠️</span>
              <h3 className="text-lg font-bold text-white">Itinerary Load Failure</h3>
              <p className="text-xs text-slate-400">
                {(error as any)?.message || 'The requested trip itinerary does not exist or you lack sufficient access permissions.'}
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition"
              >
                Return to Dashboard
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const tabItems = [
    { name: '📋 Overview', path: `/trips/${id}` },
    { name: '📅 Itinerary', path: `/trips/${id}/itinerary` },
    { name: '🏨 Real Hotels', path: `/trips/${id}/hotels` },
    { name: '🗺️ Route Map', path: `/trips/${id}/map` },
    { name: '⛈️ Weather Packing', path: `/trips/${id}/packing` },
    { name: '📖 Memory Vault', path: `/trips/${id}/journal` },
    { name: '💰 Expense Budget', path: `/trips/${id}/budget` }
  ];

  const handleUpdateTrip = async (updates: Partial<Trip>) => {
    return updateMutation.mutateAsync(updates);
  };

  const handleRegenerateDay = async (dayNumber: number, promptText: string) => {
    return regenerateMutation.mutateAsync({ dayNumber, promptText });
  };

  return (
    <TripContext.Provider
      value={{
        trip,
        currency,
        setCurrency,
        updateTrip: handleUpdateTrip,
        regenerateDay: handleRegenerateDay,
        isUpdating: updateMutation.isPending,
        isRegenerating: regenerateMutation.isPending,
        refetch
      }}
    >
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Header currency={currency} setCurrency={setCurrency} />

        <div className="flex-1 flex flex-col lg:flex-row">
          <Sidebar />

          <main className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl w-full mx-auto">
            {/* Context Header */}
            <div className="border-b border-slate-900 pb-5 space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 font-bold uppercase">
                  <span>Itinerary Overview</span>
                  <span>•</span>
                  <span>{trip.budgetTier === 'Low' ? 'Budget' : trip.budgetTier === 'High' ? 'Luxury' : 'Mid-Range'} Budget</span>
                  <span>•</span>
                  <span>{trip.travelers || 1} {(trip.travelers || 1) === 1 ? 'Traveler' : 'Travelers'}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
                  Adventure to {trip.destination}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Planned for {trip.durationDays} Days starting from your custom date selector
                </p>
              </div>

              {/* Sub Route Tabs */}
              <div className="flex overflow-x-auto gap-2 border-b border-slate-900 pb-1 -mx-6 px-6 lg:mx-0 lg:px-0 scrollbar-none">
                {tabItems.map((tab) => {
                  const isActive = pathname === tab.path;
                  return (
                    <Link
                      key={tab.path}
                      href={tab.path}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border transition duration-200 ${
                        isActive
                          ? 'bg-slate-900 border-slate-800 text-indigo-400 shadow shadow-indigo-500/5'
                          : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                      }`}
                    >
                      {tab.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Child Tab Views */}
            <div>{children}</div>
          </main>
        </div>
      </div>
    </TripContext.Provider>
  );
}
