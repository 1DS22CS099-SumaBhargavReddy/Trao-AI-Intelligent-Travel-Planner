'use client';

import React, { useState } from 'react';
import { useTripContext } from '../layout';
import { Hotel } from '../../../../types';

export default function TripHotelsPage() {
  const { trip, currency, updateTrip, isUpdating } = useTripContext();
  const [newHotelName, setNewHotelName] = useState('');
  const [newHotelTier, setNewHotelTier] = useState('Mid Range');
  const [newHotelCost, setNewHotelCost] = useState<number>(0);
  const [newHotelRating, setNewHotelRating] = useState('4.5');
  const [showAddForm, setShowAddForm] = useState(false);

  const formatCost = (usdAmount: number) => {
    if (currency === 'INR') {
      return `₹${Math.round(usdAmount * 83.5).toLocaleString('en-IN')}`;
    }
    return `$${usdAmount.toLocaleString('en-US')}`;
  };

  const handleAddHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHotelName.trim()) return;

    const newHotel: Hotel = {
      name: newHotelName.trim(),
      tier: newHotelTier,
      estimatedCostNightUSD: newHotelCost || 0,
      rating: newHotelRating
    };

    const updatedHotels = [...(trip.hotels || []), newHotel];

    try {
      await updateTrip({ hotels: updatedHotels });
      setNewHotelName('');
      setNewHotelCost(0);
      setNewHotelRating('4.5');
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to add hotel:', err);
    }
  };

  const handleRemoveHotel = async (hotelIndex: number) => {
    if (!confirm('Are you sure you want to remove this hotel option?')) return;
    const updatedHotels = (trip.hotels || []).filter((_, idx) => idx !== hotelIndex);
    try {
      await updateTrip({ hotels: updatedHotels });
    } catch (err) {
      console.error('Failed to remove hotel:', err);
    }
  };

  const renderStars = (ratingStr: string) => {
    const stars = [];
    const count = Math.max(1, Math.min(5, Math.round(parseFloat(ratingStr || '4.0'))));
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span key={i} className={i < count ? 'text-amber-400' : 'text-slate-650'}>
          ★
        </span>
      );
    }
    return <div className="flex gap-0.5 text-xs">{stars}</div>;
  };

  return (
    <div className="space-y-6">
      {/* Header and Control */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-900 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🏨 Recommended Hotels & Accommodations</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Real accommodation options matching your {trip.budgetTier === 'Low' ? 'Budget' : trip.budgetTier === 'High' ? 'Luxury' : 'Mid-Range'} budget tier in {trip.destination}
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-indigo-400 px-4 py-2.5 rounded-xl border border-slate-800 transition self-start sm:self-auto"
        >
          {showAddForm ? 'Cancel Form' : '➕ Add Hotel Option'}
        </button>
      </div>

      {/* Add Custom Hotel Form */}
      {showAddForm && (
        <form onSubmit={handleAddHotel} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 max-w-xl">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">Add New Accommodation Option</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Hotel Name</label>
              <input
                type="text"
                placeholder="e.g., Hotel Plaza Athenee"
                value={newHotelName}
                onChange={(e) => setNewHotelName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-805 text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-indigo-500 transition"
              />
            </div>
            
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Budget Category</label>
              <select
                value={newHotelTier}
                onChange={(e) => setNewHotelTier(e.target.value)}
                className="w-full bg-slate-950 border border-slate-805 text-xs px-3.5 py-2.5 rounded-xl text-slate-300 outline-none focus:border-indigo-500 transition"
              >
                <option value="Budget Friendly">Budget Friendly</option>
                <option value="Mid Range">Mid Range</option>
                <option value="Luxury">Luxury</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Est. Cost Per Night (USD)</label>
              <input
                type="number"
                placeholder="e.g., 120"
                value={newHotelCost || ''}
                onChange={(e) => setNewHotelCost(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-805 text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Rating (1.0 to 5.0)</label>
              <input
                type="text"
                placeholder="e.g., 4.7"
                value={newHotelRating}
                onChange={(e) => setNewHotelRating(e.target.value)}
                className="w-full bg-slate-950 border border-slate-805 text-xs px-3.5 py-2.5 rounded-xl text-white outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isUpdating || !newHotelName.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition duration-200"
          >
            {isUpdating ? 'Saving Accommodation...' : 'Add Hotel to List'}
          </button>
        </form>
      )}

      {!trip.hotels || trip.hotels.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-850 py-16 rounded-2xl text-center">
          <span className="text-4xl">🏨</span>
          <h4 className="text-slate-300 font-bold mt-4">No Hotels Recommended</h4>
          <p className="text-xs text-slate-500 mt-2">Add custom hotel preferences to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trip.hotels.map((hotel, idx) => (
            <div
              key={hotel._id || idx}
              className="bg-slate-900/50 border border-slate-850 rounded-2xl overflow-hidden hover:bg-slate-900 hover:shadow-xl transition flex flex-col justify-between group relative"
            >
              {/* Hotel image thumbnail / fallback */}
              <div className="relative h-40 w-full bg-slate-950">
                {hotel.imageUrl ? (
                  <img
                    src={hotel.imageUrl}
                    alt={hotel.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-950 to-slate-900 flex items-center justify-center">
                    <span className="text-4xl text-indigo-500/50">🏨</span>
                  </div>
                )}
                
                {/* Tier Badge */}
                <span className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-wider bg-slate-950/80 text-indigo-300 px-2.5 py-1 rounded-lg backdrop-blur-md border border-slate-805">
                  {hotel.tier}
                </span>

                {/* Remove button */}
                <button
                  onClick={() => handleRemoveHotel(idx)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-red-400 p-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md hover:bg-slate-950 transition border border-slate-800"
                  title="Remove Hotel"
                >
                  🗑️
                </button>
              </div>

              {/* Content body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h4 className="font-bold text-white text-base md:text-lg group-hover:text-indigo-400 transition leading-tight truncate">
                    {hotel.name}
                  </h4>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-200">{hotel.rating}</span>
                    {renderStars(hotel.rating)}
                  </div>

                  {hotel.address && (
                    <p className="text-xs text-slate-405 flex items-start gap-1.5 leading-relaxed">
                      <span className="text-indigo-400 mt-0.5 shrink-0">📍</span>
                      <span className="truncate line-clamp-2" title={hotel.address}>{hotel.address}</span>
                    </p>
                  )}
                </div>

                <div className="border-t border-slate-850 pt-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[9px] text-slate-500 uppercase font-semibold">Est. Rate / Night</p>
                      <p className="font-bold font-mono text-sm text-white mt-0.5">
                        {formatCost(hotel.estimatedCostNightUSD)}
                      </p>
                    </div>
                    {hotel.website && (
                      <a
                        href={hotel.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-indigo-650/20 hover:bg-indigo-600 text-indigo-300 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition border border-indigo-500/20"
                      >
                        Website 🌐
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
