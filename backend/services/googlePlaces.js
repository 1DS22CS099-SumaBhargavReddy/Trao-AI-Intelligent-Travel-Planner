const fetch = global.fetch;

// Geocode any address or city using Google Geocoding API
exports.geocodeCity = async (address) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_KEY') {
    throw new Error('Missing Google API Key');
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error('Geocoding failed');
  }

  const result = data.results[0];
  const { lat, lng } = result.geometry.location;

  let city = '';
  let state = '';
  let country = '';

  for (const component of result.address_components) {
    if (component.types.includes('locality')) {
      city = component.long_name;
    } else if (component.types.includes('administrative_area_level_2') && !city) {
      city = component.long_name;
    } else if (component.types.includes('administrative_area_level_1')) {
      state = component.long_name;
    } else if (component.types.includes('country')) {
      country = component.long_name;
    }
  }

  console.log(`[DEBUG] Geocoded address: "${address}" to Coordinates: lat=${lat}, lng=${lng}, City=${city || address}, Country=${country}`);

  return {
    city: city || address,
    state,
    country,
    lat,
    lng
  };
};

// Search real attractions using Google Places Text Search
exports.searchAttractions = async (city, country) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_KEY') {
    throw new Error('Missing Google API Key');
  }

  const query = `tourist attractions in ${city}, ${country}`;
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error('Failed to find attractions');
  }

  console.log(`[DEBUG] Attractions found for ${city}, ${country}: ${data.results.length}`);

  return data.results.slice(0, 15).map(item => ({
    name: item.name,
    address: item.formatted_address || item.vicinity,
    rating: item.rating || 4.0,
    lat: item.geometry.location.lat,
    lng: item.geometry.location.lng,
    placeId: item.place_id,
    imageUrl: item.photos 
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${item.photos[0].photo_reference}&key=${apiKey}` 
      : 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=500&q=80',
    openingHours: item.opening_hours ? (item.opening_hours.open_now ? 'Open Now' : 'Closed') : 'Hours Vary'
  }));
};

// Search real hotels using Google Places Text Search
exports.searchHotels = async (city, country) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_KEY') {
    throw new Error('Missing Google API Key');
  }

  const query = `hotels in ${city}, ${country}`;
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error('Failed to find hotels');
  }

  console.log(`[DEBUG] Hotels found for ${city}, ${country}: ${data.results.length}`);

  return data.results.slice(0, 5).map(item => ({
    name: item.name,
    address: item.formatted_address || item.vicinity,
    rating: item.rating ? String(item.rating) : '4.0',
    lat: item.geometry.location.lat,
    lng: item.geometry.location.lng,
    placeId: item.place_id,
    imageUrl: item.photos 
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${item.photos[0].photo_reference}&key=${apiKey}` 
      : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80',
    website: `https://www.google.com/maps/place/?q=place_id:${item.place_id}`,
    openingHours: '24/7'
  }));
};

// Search nearby restaurants using Google Places Nearby Search
exports.searchNearbyRestaurants = async (lat, lng) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_KEY') {
    throw new Error('Missing Google API Key');
  }

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=3000&type=restaurant&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error('Failed to find nearby restaurants');
  }

  return data.results.slice(0, 10).map(item => ({
    name: item.name,
    type: item.types ? item.types[0].replace(/_/g, ' ') : 'dining',
    location: item.vicinity || item.formatted_address,
    budget: item.price_level ? '$'.repeat(item.price_level) : '$$',
    rating: item.rating || 4.0,
    priceLevel: item.price_level || 2,
    coords: {
      lat: item.geometry.location.lat,
      lng: item.geometry.location.lng
    }
  }));
};

// Search nearby hospitals using Google Places Nearby Search
exports.searchNearbyHospitals = async (lat, lng) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_KEY') {
    throw new Error('Missing Google API Key');
  }

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=hospital&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    return ['Local City Hospital', 'Emergency Medical Clinic'];
  }

  return data.results.slice(0, 3).map(item => item.name);
};

// Search embassy location using Google Places Text Search
exports.searchEmbassy = async (originCountry, destinationCity) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_KEY') {
    return `Embassy of ${originCountry} in ${destinationCity}`;
  }

  const query = `embassy of ${originCountry} in ${destinationCity}`;
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return `${data.results[0].name}, ${data.results[0].formatted_address}`;
    }
  } catch (err) {
    console.error('[ERROR] Failed to query embassy:', err);
  }
  return `Embassy of ${originCountry} in ${destinationCity}`;
};
