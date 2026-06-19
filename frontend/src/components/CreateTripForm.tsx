'use client';

import React, { useState } from 'react';

interface CreateTripFormProps {
  onSubmit: (data: {
    originCity: string;
    destination: string;
    country: string;
    durationDays: number;
    travelers: number;
    budgetTier: 'Low' | 'Medium' | 'High';
    interests: string[];
    startDate: string;
    endDate: string;
  }) => void;
  isLoading: boolean;
}

const INTEREST_OPTIONS = [
  { id: 'Food', label: '🍳 Culinary & Food' },
  { id: 'Culture', label: '🏛️ Art & Culture' },
  { id: 'Adventure', label: '🧗 Adventure & Sports' },
  { id: 'Shopping', label: '🛍️ Shopping' },
  { id: 'Sightseeing', label: '📸 Sightseeing' },
  { id: 'Wellness', label: '🧘 Wellness & Spa' },
  { id: 'Nature', label: '🌲 Nature & Wildlife' },
  { id: 'Nightlife', label: '✨ Nightlife & Clubs' }
];

export default function CreateTripForm({ onSubmit, isLoading }: CreateTripFormProps) {
  const [originCity, setOriginCity] = useState('');
  const [destination, setDestination] = useState('');
  const [country, setCountry] = useState('');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Tomorrow
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Tomorrow + 3 days
  );
  const [budgetTier, setBudgetTier] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [travelers, setTravelers] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter(item => item !== id));
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!originCity.trim() || !destination.trim() || !country.trim() || !startDate || !endDate) return;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    onSubmit({
      originCity: originCity.trim(),
      destination: destination.trim(),
      country: country.trim(),
      durationDays,
      travelers,
      budgetTier,
      interests: selectedInterests,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm relative overflow-hidden">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-6 flex items-center gap-3">
        <span className="p-2 bg-gray-50 text-gray-800 rounded-xl">✈️</span>
        Plan Your Next Escape
      </h2>

      <div className="space-y-6">
        {/* Origin City */}
        <div>
          <label htmlFor="originCity" className="block text-sm font-medium text-gray-700 mb-2">
            Starting/Origin City
          </label>
          <input
            type="text"
            id="originCity"
            placeholder="e.g., Hyderabad, Mumbai, Seattle"
            value={originCity}
            onChange={(e) => setOriginCity(e.target.value)}
            disabled={isLoading}
            required
            className="w-full bg-white border border-gray-200 focus:border-black focus:ring-1 focus:ring-black text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 transition outline-none shadow-sm"
          />
        </div>

        {/* Destination & Country Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
              Destination City
            </label>
            <input
              type="text"
              id="destination"
              placeholder="e.g., Bangalore, Paris, London"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              disabled={isLoading}
              required
              className="w-full bg-white border border-gray-200 focus:border-black focus:ring-1 focus:ring-black text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 transition outline-none shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <input
              type="text"
              id="country"
              placeholder="e.g., India, France, United Kingdom"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={isLoading}
              required
              className="w-full bg-white border border-gray-200 focus:border-black focus:ring-1 focus:ring-black text-gray-900 placeholder-gray-400 rounded-xl px-4 py-3 transition outline-none shadow-sm"
            />
          </div>
        </div>

        {/* Grid for Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isLoading}
              required
              className="w-full bg-white border border-gray-200 focus:border-black focus:ring-1 focus:ring-black text-gray-900 rounded-xl px-4 py-3 transition outline-none shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
              End Date (Returns)
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isLoading}
              required
              className="w-full bg-white border border-gray-200 focus:border-black focus:ring-1 focus:ring-black text-gray-900 rounded-xl px-4 py-3 transition outline-none shadow-sm"
            />
          </div>
        </div>

        {/* Budget Tier & Travelers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Budget Tier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Low', 'Medium', 'High'] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setBudgetTier(tier)}
                  disabled={isLoading}
                  className={`py-3 rounded-xl border text-sm font-semibold transition ${
                    budgetTier === tier
                      ? 'bg-black border-black text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900'
                  }`}
                >
                  {tier === 'Low' ? 'Budget' : tier === 'Medium' ? 'Mid-Range' : 'Luxury'}
                </button>
              ))}
            </div>
          </div>

          {/* Travelers Count */}
          <div>
            <label htmlFor="travelers" className="block text-sm font-medium text-gray-700 mb-2">
              Number of Members (Travelers)
            </label>
            <input
              type="number"
              id="travelers"
              min="1"
              max="20"
              value={travelers}
              onChange={(e) => setTravelers(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
              disabled={isLoading}
              required
              className="w-full bg-white border border-gray-200 focus:border-black focus:ring-1 focus:ring-black text-gray-900 rounded-xl px-4 py-3 transition outline-none shadow-sm"
            />
          </div>
        </div>

        {/* Interests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What are you interested in?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {INTEREST_OPTIONS.map((interest) => {
              const isSelected = selectedInterests.includes(interest.id);
              return (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => toggleInterest(interest.id)}
                  disabled={isLoading}
                  className={`p-3 rounded-xl border text-xs font-medium text-left transition duration-200 flex items-center justify-between ${
                    isSelected
                      ? 'bg-black border-black text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900'
                  }`}
                >
                  <span>{interest.label}</span>
                  {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !destination.trim()}
          className="w-full bg-black hover:bg-gray-800 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-sm transition-all duration-300 transform active:scale-[0.98] mt-4 flex justify-center items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              AI Agent is Crafting Itinerary...
            </>
          ) : (
            'Generate Dream Itinerary ✨'
          )}
        </button>
      </div>
    </form>
  );
}
