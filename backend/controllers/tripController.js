const Trip = require('../models/Trip');
const googlePlaces = require('../services/googlePlaces');
const openWeather = require('../services/openWeather');
const aiService = require('../services/aiService');
const googleMaps = require('../services/googleMaps');

// Helper to determine country cost indexes
function getCountryIndex(country) {
  const c = (country || '').toLowerCase();
  if (c.includes('india') || c.includes('bali') || c.includes('indonesia') || c.includes('thailand') || c.includes('vietnam') || c.includes('nepal')) {
    return 0.35;
  }
  if (c.includes('united states') || c.includes('usa') || c.includes('france') || c.includes('united kingdom') || c.includes('uk') || c.includes('germany') || c.includes('italy')) {
    return 1.25;
  }
  if (c.includes('japan') || c.includes('tokyo') || c.includes('korea') || c.includes('singapore') || c.includes('australia')) {
    return 1.0;
  }
  return 0.8;
}

const BUDGET_MULTIPLIERS = {
  Low: 0.6,
  Medium: 1.0,
  High: 2.5
};

function getCityPricing(city, country, budgetTier) {
  const cName = (city || '').toLowerCase().trim();
  
  // Exact Bangalore pricing in USD (based on INR values divided by 83.5)
  if (cName.includes('bangalore') || cName.includes('bengaluru')) {
    const bangalorePricing = {
      Low: { hotel: 1500 / 83.5, food: 700 / 83.5, transport: 400 / 83.5 },
      Medium: { hotel: 3500 / 83.5, food: 1500 / 83.5, transport: 800 / 83.5 },
      High: { hotel: 9000 / 83.5, food: 3500 / 83.5, transport: 2000 / 83.5 }
    };
    return bangalorePricing[budgetTier] || bangalorePricing.Medium;
  }
  
  // For other cities, calibrate using countryIndex and budget multipliers
  const countryIndex = getCountryIndex(country);
  
  // Baseline Medium budget in USD (reference country index 1.0)
  const baseMedium = {
    hotel: 120,
    food: 50,
    transport: 28
  };
  
  const multiplier = BUDGET_MULTIPLIERS[budgetTier] || 1.0;
  
  return {
    hotel: baseMedium.hotel * multiplier * countryIndex,
    food: baseMedium.food * multiplier * countryIndex,
    transport: baseMedium.transport * multiplier * countryIndex
  };
}

function estimateAttractionCost(name, country) {
  const n = (name || '').toLowerCase().trim();
  
  // Specific Indian attractions
  const specificIndianAttractions = {
    'bangalore palace': 230,
    'bengaluru palace': 230,
    'lalbagh botanical garden': 30,
    'lalbagh': 30,
    'cubbon park': 0,
    'iskcon': 0,
    'mysore palace': 100,
    'taj mahal': 1100,
    'red fort': 35,
    'qutub minar': 35
  };

  for (const [key, priceINR] of Object.entries(specificIndianAttractions)) {
    if (n.includes(key)) {
      return priceINR / 83.5; // Convert directly to USD, no double country index scaling needed
    }
  }

  // Generic keyword pricing in USD (reference country index 1.0)
  const genericPricesUSD = {
    'palace': 15.0,
    'castle': 15.0,
    'museum': 10.0,
    'zoo': 18.0,
    'national park': 20.0,
    'safari': 40.0,
    'theme park': 50.0,
    'amusement': 40.0,
    'aquarium': 15.0,
    'planetarium': 8.0,
    'fort': 5.0,
    'garden': 4.0,
    'park': 0,
    'temple': 0,
    'church': 0,
    'mosque': 0,
    'basilica': 0,
    'beach': 0,
    'waterfall': 0,
    'hills': 0,
    'lake': 0
  };

  for (const [key, priceUSD] of Object.entries(genericPricesUSD)) {
    if (n.includes(key)) {
      const countryIndex = getCountryIndex(country);
      return priceUSD * countryIndex; // Scale generic prices by country cost index
    }
  }

  // General fallback
  const countryIndex = getCountryIndex(country);
  return 5.0 * countryIndex; // Default generic attraction fee
}


// Generate new travel plan using real APIs exclusively (Zero-Demo Strategy)
exports.generateNewTrip = async (req, res) => {
  const { originCity, destination, country, durationDays, budgetTier, travelers = 1, interests, startDate, endDate } = req.body;
  const userId = req.user.id;

  console.log(`[DEBUG] Destination received: "${destination}" (Country: "${country}", Origin: "${originCity}")`);

  try {
    // 1. Destination Geocoding Validation
    const destGeocoded = await googlePlaces.geocodeCity(`${destination}, ${country}`);
    const destCoords = { lat: destGeocoded.lat, lng: destGeocoded.lng };
    console.log(`[DEBUG] Coordinates found: lat=${destCoords.lat}, lng=${destCoords.lng}`);

    // 2. Origin Geocoding
    let originGeocoded = await googlePlaces.geocodeCity(originCity);
    
    // Check if origin country is different from destination country, and try to geocode with destination country as hint
    if (originGeocoded.country.toLowerCase().trim() !== destGeocoded.country.toLowerCase().trim()) {
      try {
        const originWithCountry = `${originCity}, ${destGeocoded.country}`;
        const geocodedAlternative = await googlePlaces.geocodeCity(originWithCountry);
        if (geocodedAlternative.country.toLowerCase().trim() === destGeocoded.country.toLowerCase().trim()) {
          originGeocoded = geocodedAlternative;
          console.log(`[DEBUG] Re-routed origin to match destination country: ${originWithCountry}`);
        }
      } catch (err) {
        console.log(`[DEBUG] Alternative origin geocoding failed:`, err.message);
      }
    }
    const originCoords = { lat: originGeocoded.lat, lng: originGeocoded.lng };

    // 3. Find Real Hotels
    const hotelsList = await googlePlaces.searchHotels(destGeocoded.city, destGeocoded.country);
    console.log(`[DEBUG] Hotels found: ${hotelsList.length}`);

    // 4. Find Real Attractions
    const attractionsList = await googlePlaces.searchAttractions(destGeocoded.city, destGeocoded.country);
    console.log(`[DEBUG] Attractions found: ${attractionsList.length}`);

    // 5. Query Open-Meteo Weather
    const weather = await openWeather.getWeatherForecast(destCoords.lat, destCoords.lng, startDate || new Date(), endDate || new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000));

    // 6. Call Gemini to organize attractions without inventing names
    const itineraryData = await aiService.generateItinerary(destGeocoded.city, Number(durationDays), budgetTier, interests, attractionsList);

    // 7. Find Nearby Restaurants & Compute Directions Routes per day
    const countryIndex = getCountryIndex(destGeocoded.country);
    
    // Assign pricing to hotels based on budget tier, country index, and index mapping
    const mappedHotels = hotelsList.map((hotel, idx) => {
      let tier = 'Mid Range';
      let cost = 0;
      
      if (idx % 3 === 0) {
        tier = 'Luxury';
        cost = Math.round(getCityPricing(destGeocoded.city, destGeocoded.country, 'High').hotel);
      } else if (idx % 3 === 2) {
        tier = 'Budget Friendly';
        cost = Math.round(getCityPricing(destGeocoded.city, destGeocoded.country, 'Low').hotel);
      } else {
        tier = 'Mid Range';
        cost = Math.round(getCityPricing(destGeocoded.city, destGeocoded.country, 'Medium').hotel);
      }
      
      return {
        ...hotel,
        estimatedCostNightUSD: cost,
        tier
      };
    });

    let chosenHotel;
    if (budgetTier === 'Low') {
      chosenHotel = mappedHotels.find(h => h.tier === 'Budget Friendly');
    } else if (budgetTier === 'High') {
      chosenHotel = mappedHotels.find(h => h.tier === 'Luxury');
    } else {
      chosenHotel = mappedHotels.find(h => h.tier === 'Mid Range');
    }

    if (!chosenHotel) {
      const targetPricing = getCityPricing(destGeocoded.city, destGeocoded.country, budgetTier);
      const fallbackHotel = mappedHotels[0] || { name: 'Base Hotel', location: destCoords };
      chosenHotel = {
        ...fallbackHotel,
        estimatedCostNightUSD: Math.round(targetPricing.hotel),
        tier: budgetTier === 'Low' ? 'Budget Friendly' : budgetTier === 'High' ? 'Luxury' : 'Mid Range'
      };
    }

    // Filter hotels to match budget tier
    let filteredHotels = mappedHotels.filter(hotel => {
      if (budgetTier === 'Low') {
        return hotel.tier === 'Budget Friendly';
      } else if (budgetTier === 'Medium') {
        return hotel.tier === 'Mid Range' || hotel.tier === 'Budget Friendly';
      } else {
        return true; // High can see all hotels
      }
    });

    if (filteredHotels.length === 0) {
      filteredHotels = [chosenHotel];
    }

    const finalizedItinerary = [];
    const dailyRoutes = [];
    let activitiesCostSum = 0;
    let localRouteDistanceSum = 0;

    for (const day of itineraryData.itinerary) {
      const dayActivities = [];
      const activityCoords = [];

      // Link organized activities back to their geocoded locations
      for (const act of day.activities) {
        const matchingPlace = attractionsList.find(p => p.name.toLowerCase().includes(act.title.toLowerCase()) || act.title.toLowerCase().includes(p.name.toLowerCase())) 
                              || attractionsList[Math.floor(Math.random() * attractionsList.length)];
        
        let actCost = 0;
        const baseCost = estimateAttractionCost(matchingPlace.name, destGeocoded.country);
        if (baseCost > 0) {
          actCost = baseCost * Number(travelers);
        }
        activitiesCostSum += actCost;

        const activityObj = {
          title: matchingPlace.name,
          description: act.description || 'Visit geocoded local attraction.',
          estimatedCostUSD: actCost,
          timeOfDay: dayActivities.length === 0 ? 'Morning' : dayActivities.length === 1 ? 'Afternoon' : 'Evening',
          rating: matchingPlace.rating,
          imageUrl: matchingPlace.imageUrl,
          location: {
            name: matchingPlace.name,
            address: matchingPlace.address,
            lat: matchingPlace.lat,
            lng: matchingPlace.lng
          }
        };

        dayActivities.push(activityObj);
        activityCoords.push({ lat: matchingPlace.lat, lng: matchingPlace.lng });
      }

      // 8. Find Nearby Restaurants centered around the first activity
      const restaurantCenter = activityCoords[0] || destCoords;
      let restaurants = [];
      try {
        const foundRestaurants = await googlePlaces.searchNearbyRestaurants(restaurantCenter.lat, restaurantCenter.lng);
        restaurants = foundRestaurants.slice(0, 3).map((r, idx) => ({
          name: r.name,
          type: idx === 0 ? 'Local Street Food' : idx === 1 ? 'Vegetarian Cafe' : 'Fine Dining Option',
          location: r.location,
          budget: r.budget,
          rating: r.rating
        }));
      } catch (err) {
        console.warn('[WARN] Nearby restaurants scan failed:', err.message);
        restaurants = [
          { name: 'Local Eatery', type: 'Local Street Food', location: 'City Center', budget: '$$', rating: 4.2 }
        ];
      }

      finalizedItinerary.push({
        dayNumber: day.dayNumber,
        activities: dayActivities,
        restaurants
      });

      // 9. Compute Daily directions route
      try {
        const route = await googleMaps.getDirectionsRoute(chosenHotel.location || destCoords, activityCoords);
        dailyRoutes.push({
          dayNumber: day.dayNumber,
          distance: route.distance,
          duration: route.duration,
          polyline: route.polyline
        });
        
        // Extract mileage value
        const milesVal = parseFloat(route.distance.replace(' miles', '')) || 0;
        localRouteDistanceSum += milesVal;
      } catch (routeErr) {
        console.warn('[WARN] Directions routing failed for day:', day.dayNumber, routeErr.message);
        dailyRoutes.push({
          dayNumber: day.dayNumber,
          distance: '0 miles',
          duration: '0 mins',
          polyline: ''
        });
      }
    }

    // 10. Compute Intercity transit distance and costs
    const intercityDistance = googleMaps.calculateHaversineDistance(originCoords, destCoords);
    let intercityCost = 0;
    
    if (intercityDistance > 20) {
      const isInternational = originGeocoded.country.toLowerCase().trim() !== destGeocoded.country.toLowerCase().trim();
      let mode = 'train';
      
      if (isInternational) {
        mode = 'flight';
      } else if (budgetTier === 'High' && intercityDistance > 120) {
        mode = 'flight';
      } else if (budgetTier === 'Medium' && intercityDistance > 450) {
        mode = 'flight';
      } else if (budgetTier === 'Low' && intercityDistance > 800) {
        mode = 'flight';
      }
      
      if (mode === 'flight') {
        intercityCost = Math.round(120 + intercityDistance * 0.12);
        if (isInternational) {
          intercityCost = Math.round(intercityCost * 1.5);
        }
      } else {
        const costPerMile = budgetTier === 'Low' ? 0.04 : 0.07;
        const baseCost = budgetTier === 'Low' ? 8 : 15;
        intercityCost = Math.round(baseCost + intercityDistance * costPerMile);
      }
    }

    // 11. Real Budget Engine calculation
    const cityPricingTier = getCityPricing(destGeocoded.city, destGeocoded.country, budgetTier);
    
    const roomsCount = Math.ceil(Number(travelers) / 2);
    const accommodationCost = Math.round(chosenHotel.estimatedCostNightUSD * Number(durationDays) * roomsCount);
    
    const foodCost = Math.round(cityPricingTier.food * Number(durationDays) * Number(travelers));

    const cabsCount = Math.ceil(Number(travelers) / 4);
    let localTransitCost = 0;
    if (localRouteDistanceSum > 0) {
      localTransitCost = (localRouteDistanceSum * 1.5 * countryIndex) * cabsCount;
    } else {
      localTransitCost = (cityPricingTier.transport * Number(durationDays)) * cabsCount;
    }
    localTransitCost = Math.round(localTransitCost);
    
    const transportCost = Math.round(intercityCost * Number(travelers)) + localTransitCost;
    const activitiesCostRounded = Math.round(activitiesCostSum);
    const totalBudget = accommodationCost + foodCost + activitiesCostRounded + transportCost;

    // 12. Weather-Aware Packing List Generator
    const packingList = [
      { item: 'Government-Issued Photo ID', category: 'Documents', isPacked: false },
      { item: 'Cash & Credit Cards', category: 'Documents', isPacked: false }
    ];

    if (originGeocoded.country.toLowerCase() !== destGeocoded.country.toLowerCase()) {
      packingList.push({ item: 'Passport & Travel Visa Documents', category: 'Documents', isPacked: false });
      packingList.push({ item: 'Travel Medical Insurance copies', category: 'Documents', isPacked: false });
    }

    // Weather clothes
    if (weather.temperature < 55) {
      packingList.push({ item: 'Thermal layers & undershirts', category: 'Clothing', isPacked: false });
      packingList.push({ item: 'Heavy coat or winter jacket', category: 'Clothing', isPacked: false });
      packingList.push({ item: 'Gloves & beanie hat', category: 'Clothing', isPacked: false });
    } else if (weather.temperature >= 80) {
      packingList.push({ item: 'Lightweight shorts & t-shirts', category: 'Clothing', isPacked: false });
      packingList.push({ item: 'Polarized sunglasses', category: 'Clothing', isPacked: false });
      packingList.push({ item: 'Sun hat or baseball cap', category: 'Clothing', isPacked: false });
      packingList.push({ item: 'Sunscreen protection cream', category: 'Gear', isPacked: false });
    } else {
      packingList.push({ item: 'Light jacket or sweater', category: 'Clothing', isPacked: false });
      packingList.push({ item: 'Comfortable long jeans/pants', category: 'Clothing', isPacked: false });
    }

    // Weather precip
    if (weather.rainProbability > 30) {
      packingList.push({ item: 'Compact umbrella', category: 'Gear', isPacked: false });
      packingList.push({ item: 'Waterproof raincoat', category: 'Clothing', isPacked: false });
    }

    // Wind
    if (weather.windSpeed > 15) {
      packingList.push({ item: 'Windbreaker jacket', category: 'Clothing', isPacked: false });
    }

    // Interests
    if (interests && (interests.includes('Nature') || interests.includes('Adventure'))) {
      packingList.push({ item: 'Hiking boots / outdoor walking shoes', category: 'Gear', isPacked: false });
      packingList.push({ item: 'Bug spray / insect repellent', category: 'Other', isPacked: false });
      packingList.push({ item: 'Reusable water bottle', category: 'Gear', isPacked: false });
    }
    if (interests && interests.includes('Food')) {
      packingList.push({ item: 'Hand sanitizer wipes', category: 'Other', isPacked: false });
    }

    // 13. Country-Specific Emergency Support Card
    let policeNum = '112';
    let ambulanceNum = '112';
    
    const countryClean = destGeocoded.country.toLowerCase();
    if (countryClean.includes('india')) {
      policeNum = '112';
      ambulanceNum = '108';
    } else if (countryClean.includes('united states') || countryClean.includes('usa') || countryClean.includes('canada')) {
      policeNum = '911';
      ambulanceNum = '911';
    } else if (countryClean.includes('japan')) {
      policeNum = '110';
      ambulanceNum = '119';
    } else if (countryClean.includes('united kingdom') || countryClean.includes('uk')) {
      policeNum = '999';
      ambulanceNum = '999';
    }

    // Hospitals Places Search
    let localHospitals = ['General Hospital', 'City Emergency Center'];
    try {
      localHospitals = await googlePlaces.searchNearbyHospitals(destCoords.lat, destCoords.lng);
    } catch (hospErr) {
      console.warn('[WARN] Hospitals lookup failed:', hospErr.message);
    }

    // Embassy check
    let embassyInfoStr = 'N/A (Domestic Travel)';
    if (originGeocoded.country.toLowerCase() !== destGeocoded.country.toLowerCase()) {
      try {
        embassyInfoStr = await googlePlaces.searchEmbassy(originGeocoded.country, destGeocoded.city);
      } catch (embErr) {
        console.warn('[WARN] Embassy lookup failed:', embErr.message);
        embassyInfoStr = `Embassy of ${originGeocoded.country} in ${destGeocoded.city}`;
      }
    }

    const emergencyInfo = {
      police: policeNum,
      hospitals: localHospitals,
      embassy: embassyInfoStr,
      numbers: [`Police: ${policeNum}`, `Ambulance: ${ambulanceNum}`]
    };

    // 14. Save Trip Record
    const newTrip = new Trip({
      userId,
      originCity: originGeocoded.city,
      originCountry: originGeocoded.country,
      destination: destGeocoded.city,
      country: destGeocoded.country,
      durationDays: Number(durationDays),
      travelers: Number(travelers),
      budgetTier,
      interests: interests || [],
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      destinationCoords: destCoords,
      originCoords: originCoords,
      destinationDetails: {
        city: destGeocoded.city,
        state: destGeocoded.state,
        country: destGeocoded.country
      },
      itinerary: finalizedItinerary,
      hotels: filteredHotels,
      dailyRoutes,
      estimatedBudget: {
        transport: transportCost,
        accommodation: accommodationCost,
        food: foodCost,
        activities: activitiesCostRounded,
        total: totalBudget
      },
      packingList,
      emergencyInfo,
      riskWarnings: itineraryData.riskWarnings || ['Observe local transit regulations.'],
      weatherForecast: weather,
      journalEntries: []
    });

    const savedTrip = await newTrip.save();
    return res.status(201).json(savedTrip);

  } catch (error) {
    console.error('[FATAL] Real-data trip generation failure:', error);
    return res.status(400).json({ error: "Unable to retrieve destination data" });
  }
};

// Retrieve trips
exports.getTrips = async (req, res) => {
  const { search, budget } = req.query || {};
  const query = { userId: req.user.id };

  if (search) {
    query.destination = { $regex: search, $options: 'i' };
  }
  if (budget) {
    query.budgetTier = budget;
  }

  try {
    const trips = await Trip.find(query).sort({ startDate: -1 });
    return res.status(200).json(trips);
  } catch (error) {
    console.error('Error fetching trips:', error);
    return res.status(500).json({ message: 'Failed to retrieve trips' });
  }
};

// Retrieve single trip by ID
exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found or unauthorized' });
    }
    return res.status(200).json(trip);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to retrieve trip' });
  }
};

// Update Trip
exports.updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Fix for legacy trips missing originCoords (Mongoose Validation Error)
    if (!trip.originCoords || trip.originCoords.lat === undefined) {
      trip.originCoords = trip.destinationCoords || { lat: 0, lng: 0 };
    }

    if (req.body.itinerary) {
      trip.itinerary = req.body.itinerary;
      
      let actCost = 0;
      trip.itinerary.forEach(d => d.activities.forEach(a => { actCost += (a.estimatedCostUSD || 0); }));
      trip.estimatedBudget.activities = actCost;
      trip.estimatedBudget.total = trip.estimatedBudget.transport + 
                                   trip.estimatedBudget.accommodation + 
                                   trip.estimatedBudget.food + 
                                   actCost;
    }
    
    if (req.body.packingList) {
      trip.packingList = req.body.packingList;
    }

    if (req.body.journalEntries) {
      trip.journalEntries = req.body.journalEntries;
    }

    const updated = await trip.save();
    return res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Update operation failed' });
  }
};

// Delete Trip
exports.deleteTrip = async (req, res) => {
  try {
    const deleted = await Trip.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    return res.status(200).json({ message: 'Trip deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Delete operation failed' });
  }
};

// Regenerate single day
exports.regenerateDay = async (req, res) => {
  const { dayNumber, promptText } = req.body;
  
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Geocode destination to fetch real attractions
    const attractionsList = await googlePlaces.searchAttractions(trip.destinationDetails.city, trip.destinationDetails.country);
    
    const regeneratedDayData = await aiService.regenerateDay(trip.destination, Number(dayNumber), promptText, attractionsList);

    const dayActivities = [];
    const countryIndex = getCountryIndex(trip.destinationDetails.country);

    for (const act of regeneratedDayData.activities) {
      const matchingPlace = attractionsList.find(p => p.name.toLowerCase().includes(act.title.toLowerCase()) || act.title.toLowerCase().includes(p.name.toLowerCase())) 
                            || attractionsList[Math.floor(Math.random() * attractionsList.length)];
      
      let actCost = 0;
      const baseCost = estimateAttractionCost(matchingPlace.name, trip.destinationDetails.country);
      if (baseCost > 0) {
        actCost = baseCost * Number(trip.travelers || 1);
      }

      dayActivities.push({
        title: matchingPlace.name,
        description: act.description || 'Visit geocoded local attraction.',
        estimatedCostUSD: actCost,
        timeOfDay: dayActivities.length === 0 ? 'Morning' : dayActivities.length === 1 ? 'Afternoon' : 'Evening',
        rating: matchingPlace.rating,
        imageUrl: matchingPlace.imageUrl,
        location: {
          name: matchingPlace.name,
          address: matchingPlace.address,
          lat: matchingPlace.lat,
          lng: matchingPlace.lng
        }
      });
    }

    const dayIdx = trip.itinerary.findIndex(d => d.dayNumber === Number(dayNumber));
    if (dayIdx !== -1) {
      trip.itinerary[dayIdx].activities = dayActivities;
      
      // Update restaurants for the regenerated day based on the first activity coordinates
      const firstActCoords = dayActivities[0]?.location || trip.destinationCoords;
      try {
        const foundRestaurants = await googlePlaces.searchNearbyRestaurants(firstActCoords.lat, firstActCoords.lng);
        trip.itinerary[dayIdx].restaurants = foundRestaurants.slice(0, 3).map((r, idx) => ({
          name: r.name,
          type: idx === 0 ? 'Local Street Food' : idx === 1 ? 'Vegetarian Cafe' : 'Fine Dining Option',
          location: r.location,
          budget: r.budget,
          rating: r.rating
        }));
      } catch (rErr) {
        console.warn('[WARN] Nearby restaurants scan failed during day regeneration:', rErr.message);
      }
    }

    // Recompute total activities budget
    let actCost = 0;
    trip.itinerary.forEach(d => d.activities.forEach(a => { actCost += (a.estimatedCostUSD || 0); }));
    trip.estimatedBudget.activities = Math.round(actCost);
    
    // Recompute Directions Route for that day
    const activityCoords = dayActivities.map(a => ({ lat: a.location.lat, lng: a.location.lng }));
    const baseHotel = trip.hotels[0] || { location: trip.destinationCoords };
    try {
      const route = await googleMaps.getDirectionsRoute(baseHotel.location, activityCoords);
      const routeIdx = trip.dailyRoutes.findIndex(r => r.dayNumber === Number(dayNumber));
      if (routeIdx !== -1) {
        trip.dailyRoutes[routeIdx] = {
          dayNumber: Number(dayNumber),
          distance: route.distance,
          duration: route.duration,
          polyline: route.polyline
        };
      }
    } catch (routeErr) {
      console.warn('[WARN] Directions routing recalculation failed:', routeErr.message);
    }

    // Recompute total budget sums
    let localRouteDistanceSum = 0;
    trip.dailyRoutes.forEach(r => {
      const milesVal = parseFloat(r.distance.replace(' miles', '')) || 0;
      localRouteDistanceSum += milesVal;
    });
    
    const cabsCount = Math.ceil(Number(trip.travelers || 1) / 4);
    const localTransitCost = Math.round(localRouteDistanceSum * 1.5 * countryIndex) * cabsCount;
    const transportWithoutLocal = trip.estimatedBudget.transport - Math.round((trip.estimatedBudget.transport - localTransitCost) / 2); // approximate preservation of flights
    
    trip.estimatedBudget.transport = transportWithoutLocal + localTransitCost;
    trip.estimatedBudget.total = trip.estimatedBudget.transport + trip.estimatedBudget.accommodation + trip.estimatedBudget.food + trip.estimatedBudget.activities;

    const saved = await trip.save();
    return res.status(200).json(saved);

  } catch (error) {
    console.error('[FATAL] Day regeneration failure:', error);
    return res.status(500).json({ message: 'Day regeneration failed' });
  }
};
