'use client';

import React, { useState, useMemo } from 'react';
import { Trip, Activity } from '../types';

interface RouteMapProps {
  trip: Trip;
}

// Decodes Google Polyline format to lat/lng coordinates
function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

export default function RouteMap({ trip }: RouteMapProps) {
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [selectedNode, setSelectedNode] = useState<{
    type: 'hotel' | 'activity' | 'restaurant';
    title: string;
    description: string;
    details?: string;
  } | null>(null);

  // 1. Decode polylines and find coordinates for all map elements
  const mapData = useMemo(() => {
    const allPoints: { lat: number; lng: number }[] = [];

    // Hotel
    const hotel = trip.hotels?.[0];
    const hotelCoords = hotel?.location?.lat && hotel?.location?.lng
      ? { lat: hotel.location.lat, lng: hotel.location.lng }
      : trip.destinationCoords;

    if (hotelCoords) {
      allPoints.push(hotelCoords);
    }

    // Activities
    const activitiesList: { dayNumber: number; index: number; activity: Activity }[] = [];
    trip.itinerary.forEach(day => {
      day.activities.forEach((act, idx) => {
        if (act.location?.lat && act.location?.lng) {
          activitiesList.push({ dayNumber: day.dayNumber, index: idx, activity: act });
          allPoints.push({ lat: act.location.lat, lng: act.location.lng });
        }
      });
    });

    // Restaurants
    const restaurantsList: { dayNumber: number; index: number; name: string; type: string; location: string; rating?: number; lat: number; lng: number }[] = [];
    trip.itinerary.forEach(day => {
      day.restaurants?.forEach((rest, idx) => {
        if (rest.coords?.lat && rest.coords?.lng) {
          restaurantsList.push({
            dayNumber: day.dayNumber,
            index: idx,
            name: rest.name,
            type: rest.type,
            location: rest.location,
            rating: rest.rating,
            lat: rest.coords.lat,
            lng: rest.coords.lng
          });
          allPoints.push({ lat: rest.coords.lat, lng: rest.coords.lng });
        }
      });
    });

    // Decode polylines
    const routesByDay: { [key: number]: { lat: number; lng: number }[] } = {};
    if (trip.dailyRoutes) {
      trip.dailyRoutes.forEach(r => {
        if (r.polyline) {
          const pts = decodePolyline(r.polyline);
          routesByDay[r.dayNumber] = pts;
          allPoints.push(...pts);
        }
      });
    }

    // Fallback if empty
    if (allPoints.length === 0) {
      allPoints.push({ lat: 12.9716, lng: 77.5946 }); // Bangalore default
    }

    // Boundaries
    const lats = allPoints.map(p => p.lat);
    const lngs = allPoints.map(p => p.lng);
    let minLat = Math.min(...lats);
    let maxLat = Math.max(...lats);
    let minLng = Math.min(...lngs);
    let maxLng = Math.max(...lngs);

    // Padding
    const latDelta = maxLat - minLat || 0.01;
    const lngDelta = maxLng - minLng || 0.01;
    minLat -= latDelta * 0.15;
    maxLat += latDelta * 0.15;
    minLng -= lngDelta * 0.15;
    maxLng += lngDelta * 0.15;

    return {
      hotelCoords,
      activitiesList,
      restaurantsList,
      routesByDay,
      minLat,
      maxLat,
      minLng,
      maxLng
    };
  }, [trip]);

  // Project spherical coords to flat SVG (viewBox="0 0 400 240")
  const project = (lat: number, lng: number) => {
    const padding = 24;
    const width = 400 - padding * 2;
    const height = 240 - padding * 2;
    
    const x = padding + ((lng - mapData.minLng) / (mapData.maxLng - mapData.minLng)) * width;
    const y = padding + (1 - (lat - mapData.minLat) / (mapData.maxLat - mapData.minLat)) * height;
    
    return {
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10
    };
  };

  // Filter items by selected day
  const filteredActivities = useMemo(() => {
    if (selectedDay === 'all') return mapData.activitiesList;
    return mapData.activitiesList.filter(a => a.dayNumber === selectedDay);
  }, [mapData, selectedDay]);

  const filteredRestaurants = useMemo(() => {
    if (selectedDay === 'all') return mapData.restaurantsList;
    return mapData.restaurantsList.filter(r => r.dayNumber === selectedDay);
  }, [mapData, selectedDay]);

  // Draw roads / lines
  const pathD = useMemo(() => {
    if (selectedDay !== 'all') {
      const pts = mapData.routesByDay[selectedDay] || [];
      if (pts.length === 0) return '';
      return 'M ' + pts.map(p => {
        const proj = project(p.lat, p.lng);
        return `${proj.x} ${proj.y}`;
      }).join(' L ');
    } else {
      // Connect all days paths
      return Object.values(mapData.routesByDay).map(pts => {
        if (pts.length === 0) return '';
        return 'M ' + pts.map(p => {
          const proj = project(p.lat, p.lng);
          return `${proj.x} ${proj.y}`;
        }).join(' L ');
      }).join(' ');
    }
  }, [mapData, selectedDay]);

  const hotelProj = mapData.hotelCoords ? project(mapData.hotelCoords.lat, mapData.hotelCoords.lng) : null;

  return (
    <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🗺️ Premium Route Visualizer</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Displaying geocoded road routes, attractions, and restaurant links
          </p>
        </div>

        {/* Day selection tabs */}
        <div className="flex overflow-x-auto gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start shrink-0">
          <button
            onClick={() => setSelectedDay('all')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${
              selectedDay === 'all'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Days
          </button>
          {trip.itinerary.map(day => (
            <button
              key={day.dayNumber}
              onClick={() => setSelectedDay(day.dayNumber)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${
                selectedDay === day.dayNumber
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Day {day.dayNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Map Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden relative shadow-inner aspect-[5/3] flex flex-col justify-between p-4">
            
            {/* Grid overlay */}
            <div 
              className="absolute inset-0 opacity-[0.03] pointer-events-none" 
              style={{
                backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            />

            {/* SVG Map Canvas */}
            <svg 
              viewBox="0 0 400 240" 
              className="w-full h-full"
            >
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>

              {/* Render Road Polyline */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="url(#routeGradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-70"
                />
              )}

              {/* Render Hotel Pin */}
              {hotelProj && (
                <g 
                  className="cursor-pointer"
                  onClick={() => setSelectedNode({
                    type: 'hotel',
                    title: trip.hotels?.[0]?.name || 'Base Hotel',
                    description: trip.hotels?.[0]?.address || 'Your central hub for this trip.',
                    details: `Daily cost estimate: $${trip.hotels?.[0]?.estimatedCostNightUSD || 0} / night`
                  })}
                >
                  <circle cx={hotelProj.x} cy={hotelProj.y} r="10" fill="#f59e0b" className="animate-pulse opacity-20" />
                  <circle cx={hotelProj.x} cy={hotelProj.y} r="6" fill="#f59e0b" stroke="#020617" strokeWidth="1.5" />
                  <text x={hotelProj.x} y={hotelProj.y + 2} fontSize="5" fill="#020617" fontWeight="bold" textAnchor="middle">H</text>
                </g>
              )}

              {/* Render Restaurants Pins */}
              {filteredRestaurants.map((rest, idx) => {
                const proj = project(rest.lat, rest.lng);
                return (
                  <g
                    key={`rest-${idx}`}
                    className="cursor-pointer"
                    onClick={() => setSelectedNode({
                      type: 'restaurant',
                      title: rest.name,
                      description: `${rest.type} Option`,
                      details: `Location: ${rest.location} • Rating: ${rest.rating || 'N/A'}`
                    })}
                  >
                    <circle cx={proj.x} cy={proj.y} r="5" fill="#f97316" stroke="#020617" strokeWidth="1" />
                    <text x={proj.x} y={proj.y + 1.5} fontSize="4" fill="#ffffff" fontWeight="black" textAnchor="middle">R</text>
                  </g>
                );
              })}

              {/* Render Activities Pins */}
              {filteredActivities.map((actNode, idx) => {
                const act = actNode.activity;
                if (!act.location?.lat || !act.location?.lng) return null;
                const proj = project(act.location.lat, act.location.lng);
                
                return (
                  <g
                    key={`act-${idx}`}
                    className="cursor-pointer"
                    onClick={() => setSelectedNode({
                      type: 'activity',
                      title: act.title,
                      description: act.description,
                      details: `Time: ${act.timeOfDay} • Rating: ${act.rating || 'N/A'}`
                    })}
                  >
                    <circle cx={proj.x} cy={proj.y} r="7" fill="#6366f1" stroke="#020617" strokeWidth="1.5" />
                    <text x={proj.x} y={proj.y + 2} fontSize="5" fill="#ffffff" fontWeight="black" textAnchor="middle">
                      {actNode.dayNumber}.{actNode.index + 1}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Overlay Info bar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 backdrop-blur-md text-[11px] flex justify-between items-center z-10">
              {selectedNode ? (
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      selectedNode.type === 'hotel' ? 'bg-amber-400' : selectedNode.type === 'restaurant' ? 'bg-orange-500' : 'bg-indigo-400'
                    }`} />
                    <p className="font-bold text-white truncate">{selectedNode.title}</p>
                  </div>
                  <p className="text-slate-400 mt-0.5 truncate leading-tight">{selectedNode.description}</p>
                  {selectedNode.details && (
                    <p className="text-[10px] text-indigo-400/80 font-mono mt-1">{selectedNode.details}</p>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 italic">Select pins or markers to inspect real address coordinates</p>
              )}
              {selectedNode && (
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-500 hover:text-slate-350 font-bold px-2 py-1 bg-slate-950 rounded border border-slate-800"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Info / Route Stats Panel */}
        <div className="space-y-4">
          <div className="bg-slate-950/60 border border-slate-850 p-6 rounded-2xl space-y-6">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-2">
              Route Indicators
            </h4>

            {selectedDay === 'all' ? (
              <div className="space-y-4">
                {trip.dailyRoutes?.map(route => (
                  <div key={route.dayNumber} className="flex justify-between items-center text-xs p-3 bg-slate-900/40 rounded-xl border border-slate-900">
                    <span className="font-bold text-slate-200">Day {route.dayNumber} Route</span>
                    <div className="text-right space-y-0.5">
                      <p className="font-bold text-white font-mono">{route.distance}</p>
                      <p className="text-[10px] text-slate-500">{route.duration} transit</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              (() => {
                const activeRoute = trip.dailyRoutes?.find(r => r.dayNumber === selectedDay);
                return (
                  <div className="space-y-4">
                    <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-xl space-y-2 text-center">
                      <p className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider">Day {selectedDay} Summary</p>
                      <p className="text-lg font-black text-white font-mono">{activeRoute?.distance || '0 miles'}</p>
                      <p className="text-[11px] text-slate-400">Total duration: {activeRoute?.duration || '0 mins'}</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Activities Chronology</p>
                      {filteredActivities.map((actNode, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-2.5 bg-slate-900/40 border border-slate-900 hover:border-slate-800 rounded-xl cursor-pointer"
                          onClick={() => setSelectedNode({
                            type: 'activity',
                            title: actNode.activity.title,
                            description: actNode.activity.description,
                            details: `Time: ${actNode.activity.timeOfDay} • Rating: ${actNode.activity.rating || 'N/A'}`
                          })}
                        >
                          <span className="w-5 h-5 flex items-center justify-center bg-indigo-600 text-white rounded text-[10px] font-black font-mono shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-200 truncate">{actNode.activity.title}</p>
                            <p className="text-[10px] text-slate-500 uppercase">{actNode.activity.timeOfDay}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl text-[10px] text-slate-400 leading-relaxed">
            🌿 Map routes are calculated using Google Directions API waypoints sequencing optimized to minimize carbon footprint and local transit times.
          </div>
        </div>

      </div>
    </div>
  );
}
