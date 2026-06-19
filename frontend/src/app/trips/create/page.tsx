'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/navigation/Sidebar';
import Header from '../../../components/navigation/Header';
import CreateTripForm from '../../../components/CreateTripForm';
import { useCreateTrip } from '../../../hooks/useTrip';

export default function CreateTripPage() {
  const router = useRouter();
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const createTripMutation = useCreateTrip();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleCreateTrip = async (formData: {
    originCity: string;
    destination: string;
    country: string;
    durationDays: number;
    travelers: number;
    budgetTier: 'Low' | 'Medium' | 'High';
    interests: string[];
    startDate: string;
    endDate: string;
  }) => {
    try {
      const result = await createTripMutation.mutateAsync(formData);
      if (result && result._id) {
        router.push(`/trips/${result._id}`);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to create trip:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header currency={currency} setCurrency={setCurrency} />

      <div className="flex-1 flex flex-col lg:flex-row">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-8 max-w-4xl w-full mx-auto">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white">Create New Trip</h2>
            <p className="text-xs text-slate-400 mt-1">Provide your destination and preferences, and our AI Agent will compile a premium itinerary.</p>
          </div>

          {createTripMutation.error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded-xl">
              Error creating trip: {(createTripMutation.error as any)?.message || 'Something went wrong.'}
            </div>
          )}

          <CreateTripForm onSubmit={handleCreateTrip} isLoading={createTripMutation.isPending} />
        </main>
      </div>
    </div>
  );
}
