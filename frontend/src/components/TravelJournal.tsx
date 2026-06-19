'use client';

import React, { useState } from 'react';
import { Trip, Activity } from '../types';

interface TravelJournalProps {
  trip: Trip;
  onUpdateTrip: (updatedTrip: Trip) => void;
}

export default function TravelJournal({ trip, onUpdateTrip }: TravelJournalProps) {
  const [notes, setNotes] = useState('');
  const [activityRatings, setActivityRatings] = useState<{ [actId: string]: number }>({});
  const [saving, setSaving] = useState(false);

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;

    setSaving(true);
    
    // Map activity ratings into array structure
    const ratingsArray = Object.keys(activityRatings).map((actId) => ({
      activityId: actId,
      rating: activityRatings[actId]
    }));

    const newEntry = {
      notes: notes.trim(),
      activityRatings: ratingsArray,
      photos: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80', // generic travel photo
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=400&q=80'
      ],
      createdAt: new Date().toISOString()
    };

    const updatedJournal = [...(trip.journalEntries || []), newEntry];

    // Make PUT request to save journal entry
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/trips/${trip._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ journalEntries: updatedJournal })
      });

      if (res.ok) {
        const data = await res.json();
        onUpdateTrip(data);
        setNotes('');
        setActivityRatings({});
      }
    } catch (err) {
      console.error('Failed to save journal entry:', err);
    } finally {
      setSaving(false);
    }
  };

  const setRating = (actId: string, value: number) => {
    setActivityRatings((prev) => ({ ...prev, [actId]: value }));
  };

  // Get all activities of this trip to allow rating them
  const allActivities = trip.itinerary.flatMap(d => d.activities);

  return (
    <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span>📖 Travel Journal & Memory Vault</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Lock in your travel memories, rate visited coordinates, and store diary logs
        </p>
      </div>

      {/* New Entry Form */}
      <form onSubmit={handleSaveEntry} className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Write a new memory log
          </label>
          <textarea
            placeholder="What did you do? Write notes about the places, food, and people..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            required
            rows={3}
            className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-white placeholder-slate-550 rounded-xl px-3.5 py-3 transition outline-none resize-none"
          />
        </div>

        {/* Rate Activities list */}
        {allActivities.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rate Visited Locations</p>
            <div className="max-h-[150px] overflow-y-auto pr-1 space-y-1.5 border border-slate-900 p-2 rounded-xl bg-slate-900/20">
              {allActivities.map((act) => (
                <div key={act._id} className="flex justify-between items-center bg-slate-950/30 p-2 rounded-lg border border-slate-900">
                  <span className="text-xs text-slate-350 truncate max-w-[200px]">{act.title}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const ratingVal = activityRatings[act._id!] || 0;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(act._id!, star)}
                          className={`text-sm transition ${star <= ratingVal ? 'text-amber-400' : 'text-slate-700 hover:text-amber-550'}`}
                        >
                          ★
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !notes.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition duration-200"
        >
          {saving ? 'Saving memories...' : 'Log Memory in Vault 🔒'}
        </button>
      </form>

      {/* History Vault List */}
      <div className="space-y-4">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-2 flex justify-between">
          <span>📜 Saved Diaries</span>
          <span>{trip.journalEntries?.length || 0} entries</span>
        </h4>

        {(!trip.journalEntries || trip.journalEntries.length === 0) ? (
          <p className="text-slate-500 text-xs italic py-2">The Memory Vault is empty. Write your first log above!</p>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {trip.journalEntries.map((entry, idx) => (
              <div
                key={idx}
                className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl space-y-3 hover:border-slate-800 transition"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono text-indigo-400 font-bold">
                    Logged on {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] text-slate-500">Entry #{idx + 1}</span>
                </div>
                
                <p className="text-xs text-slate-300 leading-relaxed italic">"{entry.notes}"</p>

                {/* Rating updates if any */}
                {entry.activityRatings && entry.activityRatings.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {entry.activityRatings.map((ar, rIdx) => {
                      const matchAct = allActivities.find(a => a._id === ar.activityId);
                      if (!matchAct) return null;
                      return (
                        <div key={rIdx} className="text-[9px] bg-slate-900 border border-slate-850 text-slate-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span>{matchAct.title}:</span>
                          <span className="text-amber-400 font-bold">{ar.rating}★</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Photo Vault Mock Preview */}
                {entry.photos && entry.photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pt-2">
                    {entry.photos.map((photo, pIdx) => (
                      <div key={pIdx} className="w-16 h-12 rounded-lg overflow-hidden border border-slate-900 shrink-0">
                        <img src={photo} alt="Memory" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
