'use client';

import React, { useState } from 'react';
import { useTripContext } from '../layout';
import { EstimatedBudget } from '../../../../types';

export default function TripBudgetPage() {
  const { trip, currency, updateTrip, isUpdating } = useTripContext();
  const budget = trip.estimatedBudget || { transport: 0, accommodation: 0, food: 0, activities: 0, total: 0 };

  const [transport, setTransport] = useState(budget.transport);
  const [accommodation, setAccommodation] = useState(budget.accommodation);
  const [food, setFood] = useState(budget.food);
  const [activities, setActivities] = useState(budget.activities);
  const [isEditing, setIsEditing] = useState(false);

  const formatCost = (usdAmount: number) => {
    if (currency === 'INR') {
      return `₹${Math.round(usdAmount * 83.5).toLocaleString('en-IN')}`;
    }
    return `$${usdAmount.toLocaleString('en-US')}`;
  };

  const handleOverrideBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTotal = transport + accommodation + food + activities;
    const updatedBudget: EstimatedBudget = {
      transport,
      accommodation,
      food,
      activities,
      total: newTotal
    };

    try {
      await updateTrip({ estimatedBudget: updatedBudget });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to override budget:', err);
    }
  };

  // Percent calculation
  const totalVal = budget.total || 1;
  const transportPct = Math.round((budget.transport / totalVal) * 100);
  const accommodationPct = Math.round((budget.accommodation / totalVal) * 100);
  const foodPct = Math.round((budget.food / totalVal) * 100);
  const activitiesPct = Math.round((budget.activities / totalVal) * 105) > 100 
    ? 100 - (transportPct + accommodationPct + foodPct) 
    : Math.round((budget.activities / totalVal) * 100);

  const categories = [
    { name: 'Transport & Flights', value: budget.transport, pct: transportPct, color: 'bg-indigo-500', barBg: 'bg-indigo-950/40', textColor: 'text-indigo-400', icon: '✈️' },
    { name: 'Accommodation / Hotels', value: budget.accommodation, pct: accommodationPct, color: 'bg-blue-500', barBg: 'bg-blue-950/40', textColor: 'text-blue-400', icon: '🏨' },
    { name: 'Dining & Food Services', value: budget.food, pct: foodPct, color: 'bg-purple-500', barBg: 'bg-purple-950/40', textColor: 'text-purple-400', icon: '🍽️' },
    { name: 'Planned Activities', value: budget.activities, pct: activitiesPct, color: 'bg-emerald-500', barBg: 'bg-emerald-950/40', textColor: 'text-emerald-400', icon: '🧗' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-900 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>💰 Dynamic Expense Analysis & Ledger</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Visualizing estimated expenditure distribution and category ledger limits
          </p>
        </div>

        <button
          onClick={() => {
            setIsEditing(!isEditing);
            if (!isEditing) {
              setTransport(budget.transport);
              setAccommodation(budget.accommodation);
              setFood(budget.food);
              setActivities(budget.activities);
            }
          }}
          className="bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-indigo-400 px-4 py-2.5 rounded-xl border border-slate-800 transition self-start sm:self-auto"
        >
          {isEditing ? 'Cancel Edit' : '✏️ Override Budget Estimates'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Visual Charts and bars */}
        <div className="md:col-span-2 space-y-6">
          {/* Main cost card */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden flex flex-col sm:flex-row justify-between sm:items-center gap-6">
            <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Est. Trip Investment</span>
              <h4 className="text-3xl font-black text-white font-mono">{formatCost(budget.total)}</h4>
            </div>
            <div className="bg-indigo-950/40 border border-indigo-900/60 p-4 rounded-2xl flex flex-col justify-between shrink-0">
              <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider">Budget Tier Calibration</span>
              <span className="text-sm font-black text-white mt-1">
                {trip.budgetTier === 'Low' ? 'Budget' : trip.budgetTier === 'High' ? 'Luxury' : 'Mid-Range'} Travel
              </span>
              <span className="text-[10px] text-slate-400 font-semibold mt-1">
                Estimated for {trip.travelers || 1} {(trip.travelers || 1) === 1 ? 'Member' : 'Members'}
              </span>
            </div>
          </div>

          {/* Override Form */}
          {isEditing && (
            <form onSubmit={handleOverrideBudget} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">Override Category Expenditures (USD)</h4>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Transport', val: transport, set: setTransport },
                  { label: 'Accommodation', val: accommodation, set: setAccommodation },
                  { label: 'Food', val: food, set: setFood },
                  { label: 'Activities', val: activities, set: setActivities }
                ].map((input, idx) => (
                  <div key={idx}>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{input.label}</label>
                    <input
                      type="number"
                      value={input.val || ''}
                      onChange={(e) => input.set(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-805 text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition duration-200"
              >
                {isUpdating ? 'Recalculating totals...' : 'Save & Overwrite Estimates'}
              </button>
            </form>
          )}

          {/* Bar Chart visualizer */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-2">
              Expense Allocation Share
            </h4>

            <div className="space-y-4">
              {categories.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200 flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </span>
                    <span className="font-mono text-slate-400">
                      {formatCost(cat.value)} <span className="text-[10px] text-slate-500">({cat.pct}%)</span>
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className={`w-full ${cat.barBg} h-3 rounded-full overflow-hidden border border-slate-950`}>
                    <div
                      className={`${cat.color} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${cat.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expense Ledger table card */}
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-2">
            Expense Ledger
          </h4>

          <div className="space-y-4">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-850 rounded-2xl hover:border-slate-800 transition"
              >
                <div className="space-y-0.5 truncate pr-2">
                  <p className="text-xs font-bold text-white truncate">{cat.name}</p>
                  <p className="text-[9px] text-slate-500 font-medium">Estimated cost category</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-slate-200 font-mono">{formatCost(cat.value)}</p>
                  <p className="text-[9px] text-slate-500 font-semibold uppercase">{cat.pct}% Share</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
