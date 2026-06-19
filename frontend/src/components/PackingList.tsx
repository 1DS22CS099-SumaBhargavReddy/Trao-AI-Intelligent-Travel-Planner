'use client';

import React from 'react';
import { Trip, PackingItem } from '../types';

interface PackingListProps {
  trip: Trip;
  onUpdateTrip: (updatedTrip: Trip) => void;
}

export default function PackingList({ trip, onUpdateTrip }: PackingListProps) {
  const items = trip.packingList || [];

  const handleToggleItem = async (itemId: string) => {
    const updatedPacking = items.map((item) => {
      if (item._id === itemId) {
        return { ...item, isPacked: !item.isPacked };
      }
      return item;
    });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/trips/${trip._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ packingList: updatedPacking })
      });

      if (res.ok) {
        const data = await res.json();
        onUpdateTrip(data);
      }
    } catch (err) {
      console.error('Failed to update packing status:', err);
    }
  };

  const totalItems = items.length;
  const packedItems = items.filter((item) => item.isPacked).length;
  const percentPacked = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;

  // Group items by category
  const categories = ['Documents', 'Clothing', 'Gear', 'Other'];
  const groupedItems = categories.reduce((acc, cat) => {
    acc[cat] = items.filter((item) => item.category === cat);
    return acc;
  }, {} as { [key: string]: PackingItem[] });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>⛈️ Weather packing list</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic packing assistant calibrated for {trip.destination}'s climate
          </p>
        </div>
        
        {/* Progress Badge */}
        <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <span className="text-xs font-mono text-emerald-400 font-semibold">{percentPacked}% Packed</span>
          <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${percentPacked}%` }}
            />
          </div>
        </div>
      </div>

      {totalItems === 0 ? (
        <p className="text-slate-500 text-sm italic py-4">No packing recommendations generated.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((category) => {
            const catItems = groupedItems[category] || [];
            if (catItems.length === 0) return null;

            return (
              <div key={category} className="space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center justify-between border-b border-slate-800 pb-2">
                  <span>{category === 'Documents' ? '📄' : category === 'Clothing' ? '👕' : category === 'Gear' ? '🔌' : '📦'} {category}</span>
                  <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-slate-400">
                    {catItems.filter(i => i.isPacked).length}/{catItems.length}
                  </span>
                </h4>

                <div className="space-y-2">
                  {catItems.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => handleToggleItem(item._id!)}
                      className={`flex items-center gap-3 p-3 bg-slate-950/40 border border-slate-850 hover:border-slate-800/80 hover:bg-slate-950/70 rounded-xl cursor-pointer transition select-none ${
                        item.isPacked ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={item.isPacked}
                          readOnly
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                          item.isPacked 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'border-slate-700 bg-slate-900'
                        }`}>
                          {item.isPacked && (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs ${item.isPacked ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {item.item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
