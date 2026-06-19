'use client';

import React, { useState } from 'react';
import { Trip, Activity } from '../types';

interface ItineraryCardProps {
  trip: Trip;
  currency: 'USD' | 'INR';
  onUpdateTrip: (updatedTrip: Trip) => void;
  onRegenerateDay: (dayNumber: number, promptText: string) => Promise<void>;
  isRegenerating: boolean;
}

export default function ItineraryCard({ trip, currency, onUpdateTrip, onRegenerateDay, isRegenerating }: ItineraryCardProps) {
  const [newActivityTitles, setNewActivityTitles] = useState<{ [day: number]: string }>({});
  const [newActivityDescs, setNewActivityDescs] = useState<{ [day: number]: string }>({});
  const [newActivityCosts, setNewActivityCosts] = useState<{ [day: number]: number }>({});
  const [newActivityTimes, setNewActivityTimes] = useState<{ [day: number]: string }>({});
  const [dayPrompts, setDayPrompts] = useState<{ [day: number]: string }>({});
  
  const [activeDayForm, setActiveDayForm] = useState<number | null>(null);
  const [activeRegenForm, setActiveRegenForm] = useState<number | null>(null);

  // Currency Converter helper
  const formatCost = (usdAmount: number) => {
    if (currency === 'INR') {
      return `₹${Math.round(usdAmount * 83.5).toLocaleString('en-IN')}`;
    }
    return `$${usdAmount.toLocaleString('en-US')}`;
  };

  // Add custom activity
  const handleAddActivity = async (dayNumber: number) => {
    const title = newActivityTitles[dayNumber]?.trim();
    if (!title) return;

    // Use default generic travel image
    const newActivity: Activity = {
      title,
      description: newActivityDescs[dayNumber]?.trim() || 'Custom planned item',
      estimatedCostUSD: newActivityCosts[dayNumber] || 0,
      timeOfDay: newActivityTimes[dayNumber] || 'Morning',
      rating: 5,
      imageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=500&q=80'
    };

    const updatedItinerary = trip.itinerary.map((day) => {
      if (day.dayNumber === dayNumber) {
        return {
          ...day,
          activities: [...day.activities, newActivity]
        };
      }
      return day;
    });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/trips/${trip._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ itinerary: updatedItinerary })
      });

      if (res.ok) {
        const data = await res.json();
        onUpdateTrip(data);
        
        setNewActivityTitles(prev => ({ ...prev, [dayNumber]: '' }));
        setNewActivityDescs(prev => ({ ...prev, [dayNumber]: '' }));
        setNewActivityCosts(prev => ({ ...prev, [dayNumber]: 0 }));
        setNewActivityTimes(prev => ({ ...prev, [dayNumber]: 'Morning' }));
        setActiveDayForm(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Remove activity
  const handleRemoveActivity = async (dayNumber: number, activityIndex: number) => {
    const updatedItinerary = trip.itinerary.map((day) => {
      if (day.dayNumber === dayNumber) {
        const activities = day.activities.filter((_, idx) => idx !== activityIndex);
        return { ...day, activities };
      }
      return day;
    });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/trips/${trip._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ itinerary: updatedItinerary })
      });

      if (res.ok) {
        const data = await res.json();
        onUpdateTrip(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegenSubmit = async (dayNumber: number) => {
    const prompt = dayPrompts[dayNumber]?.trim();
    if (!prompt) return;

    await onRegenerateDay(dayNumber, prompt);
    setDayPrompts(prev => ({ ...prev, [dayNumber]: '' }));
    setActiveRegenForm(null);
  };

  // Generate star icons
  const renderStars = (rating: number) => {
    const stars = [];
    const count = Math.max(1, Math.min(5, Math.round(rating)));
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span key={i} className={i < count ? 'text-amber-400' : 'text-slate-600'}>
          ★
        </span>
      );
    }
    return <div className="flex gap-0.5 text-sm">{stars}</div>;
  };

  return (
    <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-800 pb-4 flex items-center justify-between">
        <span>📅 Day-by-Day Optimized Itinerary</span>
        <span className="text-xs font-mono uppercase bg-indigo-900/50 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/20">
          Route Optimized ⏱️
        </span>
      </h2>

      <div className="space-y-10 relative before:absolute before:left-[17px] before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-850">
        {trip.itinerary.map((day) => (
          <div key={day.dayNumber} className="relative pl-10 md:pl-12 group">
            {/* Timeline bullet */}
            <div className="absolute left-0 top-1 w-9 h-9 rounded-full bg-slate-950 border-2 border-indigo-500/80 flex items-center justify-center font-bold text-sm text-indigo-400 group-hover:border-indigo-400 group-hover:text-indigo-300 transition duration-200">
              {day.dayNumber}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h3 className="text-lg font-bold text-slate-100">
                Day {day.dayNumber} Overview
              </h3>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActiveDayForm(activeDayForm === day.dayNumber ? null : day.dayNumber);
                    setActiveRegenForm(null);
                  }}
                  className="text-[10px] md:text-xs bg-slate-800 hover:bg-slate-750 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-750/60 transition"
                >
                  ➕ Add Activity
                </button>
                <button
                  onClick={() => {
                    setActiveRegenForm(activeRegenForm === day.dayNumber ? null : day.dayNumber);
                    setActiveDayForm(null);
                  }}
                  className="text-[10px] md:text-xs bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 px-2.5 py-1.5 rounded-lg border border-indigo-500/20 transition"
                >
                  ✨ AI Regenerate Day
                </button>
              </div>
            </div>

            {/* AI Day Regeneration Input */}
            {activeRegenForm === day.dayNumber && (
              <div className="bg-slate-950 border border-indigo-900/50 rounded-2xl p-4 mb-4 space-y-3">
                <p className="text-xs text-indigo-300">Instruct AI agent on how to rebuild Day {day.dayNumber}:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., More outdoor nature hikes / focus on historical shrines"
                    value={dayPrompts[day.dayNumber] || ''}
                    onChange={(e) => setDayPrompts({ ...dayPrompts, [day.dayNumber]: e.target.value })}
                    disabled={isRegenerating}
                    className="flex-1 bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded-xl text-white outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    onClick={() => handleRegenSubmit(day.dayNumber)}
                    disabled={isRegenerating || !dayPrompts[day.dayNumber]?.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-55 text-xs text-white px-4 py-2 rounded-xl font-semibold transition"
                  >
                    {isRegenerating ? 'Generating...' : 'Rewrite'}
                  </button>
                </div>
              </div>
            )}

            {/* Add Custom Activity Inline Form */}
            {activeDayForm === day.dayNumber && (
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 mb-4 space-y-3">
                <p className="text-xs font-semibold text-slate-450">Add Custom Activity</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Activity title..."
                    value={newActivityTitles[day.dayNumber] || ''}
                    onChange={(e) => setNewActivityTitles({ ...newActivityTitles, [day.dayNumber]: e.target.value })}
                    className="bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded-xl text-white outline-none focus:border-indigo-500 transition"
                  />
                  <input
                    type="text"
                    placeholder="Short description..."
                    value={newActivityDescs[day.dayNumber] || ''}
                    onChange={(e) => setNewActivityDescs({ ...newActivityDescs, [day.dayNumber]: e.target.value })}
                    className="bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded-xl text-white outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <input
                    type="number"
                    placeholder="Cost (USD)..."
                    value={newActivityCosts[day.dayNumber] || ''}
                    onChange={(e) => setNewActivityCosts({ ...newActivityCosts, [day.dayNumber]: Number(e.target.value) })}
                    className="bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded-xl text-white outline-none focus:border-indigo-500 transition"
                  />
                  <select
                    value={newActivityTimes[day.dayNumber] || 'Morning'}
                    onChange={(e) => setNewActivityTimes({ ...newActivityTimes, [day.dayNumber]: e.target.value })}
                    className="bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-300 outline-none focus:border-indigo-500 transition"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                  </select>
                  <button
                    onClick={() => handleAddActivity(day.dayNumber)}
                    disabled={!newActivityTitles[day.dayNumber]?.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs text-white px-4 py-2 rounded-xl font-semibold transition md:col-span-1 col-span-2"
                  >
                    Save Activity
                  </button>
                </div>
              </div>
            )}

            {/* Activities list (with pictures and ratings) */}
            <div className="space-y-4">
              {day.activities.map((activity, index) => (
                <div
                  key={activity._id || index}
                  className="bg-slate-950/45 border border-slate-850 hover:border-slate-800 rounded-2xl p-4 hover:bg-slate-950/70 transition duration-300 group/item flex flex-col md:flex-row gap-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-blue-500" />
                  
                  {/* Place Image */}
                  <div className="w-full md:w-32 h-24 rounded-xl overflow-hidden shrink-0 relative bg-slate-900 border border-slate-800">
                    <img
                      src={activity.imageUrl || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=500&q=80'}
                      alt={activity.title}
                      className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-bold text-slate-100 text-sm md:text-base">{activity.title}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-950/80 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-900/60">
                        {activity.timeOfDay}
                      </span>
                      {activity.estimatedCostUSD > 0 && (
                        <span className="text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800/30">
                          {formatCost(activity.estimatedCostUSD)}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-400 leading-relaxed">{activity.description}</p>
                    
                    {/* Place Rating */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-medium">Place Rating:</span>
                      {renderStars(activity.rating || 5)}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveActivity(day.dayNumber, index)}
                    className="absolute right-4 top-4 text-slate-550 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 transition opacity-0 group-hover/item:opacity-100 focus:opacity-100"
                    title="Remove activity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* AI Dining Recommendations for the Day */}
            {day.restaurants && day.restaurants.length > 0 && (
              <div className="mt-5 bg-slate-950/20 border border-slate-850/60 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <span>🍽️ AI Restaurant Matches (Near Activities)</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {day.restaurants.map((rest, rIdx) => (
                    <div
                      key={rIdx}
                      className="bg-slate-950/65 border border-slate-900 p-3 rounded-xl flex flex-col justify-between space-y-1.5 hover:border-slate-800 transition"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <p className="text-xs font-bold text-slate-200 line-clamp-1">{rest.name}</p>
                          <span className="text-[8px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded shrink-0">
                            {rest.budget}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-500 mt-0.5 capitalize">{rest.type.replace(/Option|Cafe/gi, '')}</p>
                      </div>
                      <p className="text-[10px] text-indigo-300 truncate">📍 {rest.location}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
