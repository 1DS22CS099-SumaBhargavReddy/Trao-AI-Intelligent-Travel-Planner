const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  estimatedCostUSD: { type: Number, default: 0 },
  timeOfDay: { type: String, enum: ['Morning', 'Afternoon', 'Evening'], default: 'Morning' },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  imageUrl: { type: String },
  location: {
    name: { type: String },
    address: { type: String },
    lat: { type: Number },
    lng: { type: Number }
  }
});

const RestaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String }, // e.g. Vegetarian, Cafe, etc.
  location: { type: String }, // Address / Vicinity
  budget: { type: String }, // e.g. "$$", "$$$"
  rating: { type: Number },
  priceLevel: { type: Number },
  coords: {
    lat: { type: Number },
    lng: { type: Number }
  }
});

const ItineraryDaySchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  activities: [ActivitySchema],
  restaurants: [RestaurantSchema]
});

const HotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tier: { type: String, enum: ['Budget Friendly', 'Mid Range', 'Luxury'], default: 'Mid Range' },
  estimatedCostNightUSD: { type: Number, default: 0 },
  rating: { type: String },
  address: { type: String },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  website: { type: String },
  imageUrl: { type: String },
  placeId: { type: String }
});

const EmergencyInfoSchema = new mongoose.Schema({
  police: { type: String, default: '112' },
  hospitals: [{ type: String }],
  embassy: { type: String },
  numbers: [{ type: String }]
});

const JournalEntrySchema = new mongoose.Schema({
  notes: { type: String, required: true },
  photos: [{ type: String }],
  activityRatings: [{
    activityId: { type: String },
    rating: { type: Number, min: 1, max: 5 }
  }],
  createdAt: { type: Date, default: Date.now }
});

const TripSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  originCity: { type: String, required: true },
  originCountry: { type: String },
  destination: { type: String, required: true },
  country: { type: String, required: true },
  durationDays: { type: Number, required: true },
  travelers: { type: Number, default: 1, required: true },
  budgetTier: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
  interests: [{ type: String }],
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  
  destinationCoords: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  originCoords: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  destinationDetails: {
    city: { type: String },
    state: { type: String },
    country: { type: String }
  },

  itinerary: [ItineraryDaySchema],
  hotels: [HotelSchema],
  
  dailyRoutes: [{
    dayNumber: { type: Number },
    distance: { type: String },
    duration: { type: String },
    polyline: { type: String }
  }],

  estimatedBudget: {
    transport: { type: Number, default: 0 },
    accommodation: { type: Number, default: 0 },
    food: { type: Number, default: 0 },
    activities: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  
  packingList: [{
    item: { type: String, required: true },
    category: { type: String, enum: ['Documents', 'Clothing', 'Gear', 'Other'], default: 'Other' },
    isPacked: { type: Boolean, default: false }
  }],
  
  emergencyInfo: EmergencyInfoSchema,
  riskWarnings: [{ type: String }],
  journalEntries: [JournalEntrySchema],
  
  weatherForecast: {
    temperature: { type: Number },
    rainProbability: { type: Number },
    humidity: { type: Number },
    windSpeed: { type: Number }
  }
}, { timestamps: true });

// Compound index to search trips by destination, user, and dates
TripSchema.index({ userId: 1, destination: 1, startDate: -1 });

module.exports = mongoose.model('Trip', TripSchema);
