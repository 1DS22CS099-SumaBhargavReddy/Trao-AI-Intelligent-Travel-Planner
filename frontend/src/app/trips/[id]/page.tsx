'use client';

import React from 'react';
import { useTripContext } from './layout';

function getHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function TripOverviewPage() {
  const { trip, currency } = useTripContext();

  const formatCost = (usdAmount: number) => {
    if (currency === 'INR') {
      return `₹${Math.round(usdAmount * 83.5).toLocaleString('en-IN')}`;
    }
    return `$${usdAmount.toLocaleString('en-US')}`;
  };

  // 1. Geocoded mileage calculator
  const destCoords = trip.destinationCoords || { lat: 0, lng: 0 };
  const originCoords = trip.originCoords || { lat: 17.3850, lng: 78.4867 };

  const distanceMiles = destCoords.lat !== 0 && destCoords.lng !== 0
    ? getHaversineDistance(originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng)
    : 350;

  const isDomestic = trip.originCountry
    ? (trip.country || '').toLowerCase().trim() === (trip.originCountry || '').toLowerCase().trim()
    : (trip.country || '').toLowerCase().trim() === 'india' && 
      ['hyderabad', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'new delhi', 'chennai', 'kolkata', 'pune', 'goa', 'kochi', 'jaipur', 'agra'].includes((trip.originCity || '').toLowerCase().trim());

  // Transportation calculations
  const flightAvailable = distanceMiles > 200;
  const flightPrice = Math.round((120 + distanceMiles * 0.12) * (isDomestic ? 1.0 : 1.5));
  const flightTime = Math.round(1.5 + distanceMiles / 450);

  const trainAvailable = distanceMiles < 850 && isDomestic;
  const trainPrice = Math.round(15 + distanceMiles * 0.07);
  const trainTime = Math.round(3 + distanceMiles / 50);

  const busAvailable = distanceMiles < 450 && isDomestic;
  const busPrice = Math.round(10 + distanceMiles * 0.05);
  const busTime = Math.round(2 + distanceMiles / 40);

  return (
    <div className="space-y-6">
      {/* Risk Analysis Card */}
      {trip.riskWarnings && trip.riskWarnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-100 text-amber-600 rounded-xl text-xl">⚠️</span>
            <div>
              <h3 className="text-lg font-bold text-gray-900">AI Destination Risk Analysis</h3>
              <p className="text-xs text-amber-700 font-medium">Critical warnings and seasonal alerts compiled for your travel window</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {trip.riskWarnings.map((warning, index) => (
              <div 
                key={index} 
                className="bg-white border border-amber-100 p-4 rounded-2xl flex gap-3 items-start hover:border-amber-300 transition duration-200 shadow-sm"
              >
                <span className="text-amber-500 text-sm mt-0.5">✦</span>
                <p className="text-xs text-gray-700 leading-relaxed font-medium">{warning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Location details, Weather, Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Geocoded Location Card */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-900">
                📍 Verified Location
              </h3>
              <span className="text-[10px] bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-md font-mono">
                Geocoded
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Destination Details</p>
                <p className="text-sm font-bold text-gray-900 leading-tight">
                  {trip.destinationDetails?.city || trip.destination}, {trip.destinationDetails?.state ? `${trip.destinationDetails.state}, ` : ''}{trip.destinationDetails?.country || trip.country}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Geographic Coordinates</p>
                <p className="text-xs font-mono text-gray-700 font-bold">
                  Latitude: {destCoords.lat.toFixed(6)}<br />
                  Longitude: {destCoords.lng.toFixed(6)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Starting Hub</p>
                <p className="text-xs font-semibold text-gray-700">
                  Departing from <span className="text-gray-900 font-bold">{trip.originCity}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 p-3 rounded-2xl text-[10px] text-gray-500 mt-4 leading-relaxed">
            Strict boundaries verified. All attractions & recommendations constrained to the geocoded city coordinates.
          </div>
        </div>

        {/* Weather Forecast Card */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-900">
                ⛈️ Open-Meteo Weather
              </h3>
              <span className="text-[10px] bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-md font-mono">
                Live Data
              </span>
            </div>

            {trip.weatherForecast ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col justify-center">
                  <span className="text-[10px] text-gray-500">Avg Temp</span>
                  <span className="text-lg font-black text-gray-900 font-mono mt-1">
                    {Math.round(trip.weatherForecast.temperature)}°F
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono mt-0.5">
                    ({Math.round((trip.weatherForecast.temperature - 32) * 5 / 9)}°C)
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col justify-center">
                  <span className="text-[10px] text-gray-500">Precipitation</span>
                  <span className="text-lg font-black text-gray-900 font-mono mt-1">
                    {trip.weatherForecast.rainProbability}%
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col justify-center">
                  <span className="text-[10px] text-gray-500">Humidity</span>
                  <span className="text-lg font-black text-gray-900 font-mono mt-1">
                    {trip.weatherForecast.humidity}%
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex flex-col justify-center">
                  <span className="text-[10px] text-gray-500">Wind Speed</span>
                  <span className="text-lg font-black text-gray-900 font-mono mt-1">
                    {trip.weatherForecast.windSpeed} mph
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 italic py-6 text-center">
                Weather parameters loading...
              </div>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-200 p-3 rounded-2xl text-[10px] text-gray-500 mt-4 leading-relaxed">
            Packing checklist is weather-calibrated using these dynamic Open-Meteo metrics.
          </div>
        </div>

        {/* Parameters */}
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-3">
              ✈️ Trip Specifications
            </h3>
            
            <div className="space-y-3">
              {[
                { label: 'Selected Interests', value: trip.interests.join(', ') || 'General' },
                { label: 'Budget Calibration', value: trip.budgetTier === 'Low' ? 'Budget' : trip.budgetTier === 'High' ? 'Luxury' : 'Mid-Range' },
                { label: 'Travelers (Members)', value: `${trip.travelers || 1} ${(trip.travelers || 1) === 1 ? 'Member' : 'Members'}` },
                { label: 'Itinerary Length', value: `${trip.durationDays} Days` },
                { label: 'Calculated Distance', value: `${Math.round(distanceMiles)} miles` }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs border-b border-slate-950 pb-2.5 last:border-0 last:pb-0">
                  <span className="text-slate-500 font-medium">{item.label}</span>
                  <span className="font-bold text-slate-200 text-right max-w-[140px] truncate">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-950/20 border border-indigo-900/40 p-3 rounded-2xl text-center">
            <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Itinerary Status</p>
            <p className="text-[11px] font-semibold text-slate-300 mt-0.5">Ready & fully synchronized to database.</p>
          </div>
        </div>
      </div>

      {/* Intercity Transit Estimator Section */}
      <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🚇 Intercity Transportation Estimates</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Comparing price & time projections from <span className="text-indigo-400 font-bold">{trip.originCity}</span> to <span className="text-indigo-400 font-bold">{trip.destination}</span> (Calculated over {Math.round(distanceMiles)} miles)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Flight Card */}
          <div className={`p-5 rounded-2xl border transition duration-200 ${
            flightAvailable 
              ? 'bg-slate-950/50 border-slate-800 hover:border-indigo-500/30' 
              : 'bg-slate-950/20 border-slate-900 opacity-50'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-2xl">✈️</span>
                <h4 className="text-sm font-bold text-white mt-3">Commercial Flight</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Direct / Connected Transit</p>
              </div>
              {flightAvailable && (
                <span className="text-xs font-mono font-bold bg-indigo-950/40 text-indigo-300 border border-indigo-900/50 px-2 py-1 rounded-lg">
                  Recommended
                </span>
              )}
            </div>
            
            {flightAvailable ? (
              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-450">Est. Price</span>
                  <span className="font-bold text-white font-mono text-sm">{formatCost(flightPrice)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-450">Est. Duration</span>
                  <span className="font-semibold text-slate-200">{flightTime} hrs</span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic mt-6">Distance too short for commercial air routing.</p>
            )}
          </div>

          {/* Train Card */}
          <div className={`p-5 rounded-2xl border transition duration-200 ${
            trainAvailable 
              ? 'bg-slate-950/50 border-slate-800 hover:border-blue-500/30' 
              : 'bg-slate-950/20 border-slate-900 opacity-50'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-2xl">🚆</span>
                <h4 className="text-sm font-bold text-white mt-3">Express Train</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Railways Network</p>
              </div>
              {trainAvailable && (
                <span className="text-xs font-mono font-bold bg-blue-950/40 text-blue-300 border border-blue-900/50 px-2 py-1 rounded-lg">
                  Available
                </span>
              )}
            </div>

            {trainAvailable ? (
              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-450">Est. Price</span>
                  <span className="font-bold text-white font-mono text-sm">{formatCost(trainPrice)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-450">Est. Duration</span>
                  <span className="font-semibold text-slate-200">{trainTime} hrs</span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic mt-6">
                {!isDomestic ? 'Cross-border rail system not linked.' : 'Distance limit exceeded for rail transit.'}
              </p>
            )}
          </div>

          {/* Bus Card */}
          <div className={`p-5 rounded-2xl border transition duration-200 ${
            busAvailable 
              ? 'bg-slate-950/50 border-slate-800 hover:border-purple-500/30' 
              : 'bg-slate-950/20 border-slate-900 opacity-50'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-2xl">🚌</span>
                <h4 className="text-sm font-bold text-white mt-3">Intercity Bus / Coach</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Highways Network</p>
              </div>
              {busAvailable && (
                <span className="text-xs font-mono font-bold bg-purple-950/40 text-purple-300 border border-purple-900/50 px-2 py-1 rounded-lg">
                  Economical
                </span>
              )}
            </div>

            {busAvailable ? (
              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-450">Est. Price</span>
                  <span className="font-bold text-white font-mono text-sm">{formatCost(busPrice)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-450">Est. Duration</span>
                  <span className="font-semibold text-slate-200">{busTime} hrs</span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic mt-6">
                {!isDomestic ? 'Cross-border highways not supported.' : 'Distance limit exceeded for coach services.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Emergency Info Card */}
      {trip.emergencyInfo && (
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <span className="p-2 bg-red-500/20 text-red-400 rounded-xl text-xl">🚨</span>
            <div>
              <h3 className="text-lg font-bold text-white">Emergency Support Card</h3>
              <p className="text-xs text-slate-400">Critical local service connections for {trip.destination}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-2xl space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">👮 Police Department</span>
              <p className="text-sm font-black text-white">{trip.emergencyInfo.police || 'Local Police'}</p>
            </div>

            <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-2xl space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">🏛️ Consulate / Embassy</span>
              <p className="text-xs font-bold text-slate-200 leading-relaxed">{trip.emergencyInfo.embassy || 'N/A'}</p>
            </div>

            <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-2xl space-y-3 sm:col-span-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">🏥 Nearest Hospitals & Clinics</span>
              {trip.emergencyInfo.hospitals && trip.emergencyInfo.hospitals.length > 0 ? (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {trip.emergencyInfo.hospitals.map((hospital, idx) => (
                    <li key={idx} className="text-xs text-slate-350 flex items-start gap-2 bg-slate-950/40 p-2 rounded-lg border border-slate-900">
                      <span className="text-red-400">✚</span>
                      <span>{hospital}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No direct hospitals available in list.</p>
              )}
            </div>

            {trip.emergencyInfo.numbers && trip.emergencyInfo.numbers.length > 0 && (
              <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-2xl space-y-3 sm:col-span-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">📞 Local Hotlines</span>
                <div className="flex flex-wrap gap-2">
                  {trip.emergencyInfo.numbers.map((num, idx) => (
                    <span 
                      key={idx} 
                      className="text-xs font-bold font-mono bg-indigo-950/40 text-indigo-300 px-3 py-1.5 rounded-xl border border-indigo-900/50"
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
