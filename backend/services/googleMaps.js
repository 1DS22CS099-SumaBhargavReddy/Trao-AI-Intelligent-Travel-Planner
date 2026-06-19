const fetch = global.fetch;

// Get Google Directions route: Hotel -> Activities -> Hotel
exports.getDirectionsRoute = async (hotelCoords, activitiesCoords) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_KEY') {
    throw new Error('Missing Google API Key');
  }

  if (!activitiesCoords || activitiesCoords.length === 0) {
    return {
      distance: '0 miles',
      duration: '0 mins',
      polyline: '',
      distanceValueMeters: 0,
      durationValueSeconds: 0
    };
  }

  // Waypoints are optimized
  const waypoints = activitiesCoords.map(c => `${c.lat},${c.lng}`).join('|');
  const originStr = `${hotelCoords.lat},${hotelCoords.lng}`;

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${originStr}&waypoints=optimize:true|${waypoints}&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error('Directions route query failed');
  }

  const route = data.routes[0];
  let totalDistanceMeters = 0;
  let totalDurationSeconds = 0;

  if (route.legs) {
    for (const leg of route.legs) {
      totalDistanceMeters += leg.distance.value;
      totalDurationSeconds += leg.duration.value;
    }
  }

  const totalDistanceMiles = (totalDistanceMeters / 1609.34).toFixed(1);
  const hours = Math.floor(totalDurationSeconds / 3600);
  const minutes = Math.floor((totalDurationSeconds % 3600) / 60);
  const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes} mins`;

  console.log(`[DEBUG] Directions route calculated: ${totalDistanceMiles} miles, duration: ${durationStr}`);

  return {
    distance: `${totalDistanceMiles} miles`,
    duration: durationStr,
    polyline: route.overview_polyline ? route.overview_polyline.points : '',
    distanceValueMeters: totalDistanceMeters,
    durationValueSeconds: totalDurationSeconds
  };
};

// Calculate Haversine distance in miles between two coordinates
exports.calculateHaversineDistance = (coords1, coords2) => {
  const R = 3958.8; // Earth radius in miles
  const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
  const dLng = (coords2.lng - coords1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in miles
};
