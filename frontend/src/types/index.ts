export interface Activity {
  _id?: string;
  title: string;
  description: string;
  estimatedCostUSD: number;
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening' | string;
  rating?: number;
  imageUrl?: string;
  location?: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
}

export interface Restaurant {
  name: string;
  type: string;
  location: string;
  budget: string;
  rating?: number;
  priceLevel?: number;
  coords?: {
    lat: number;
    lng: number;
  };
}

export interface ItineraryDay {
  _id?: string;
  dayNumber: number;
  activities: Activity[];
  restaurants?: Restaurant[];
}

export interface Hotel {
  _id?: string;
  name: string;
  tier: 'Budget Friendly' | 'Mid Range' | 'Luxury' | string;
  estimatedCostNightUSD: number;
  rating: string;
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  website?: string;
  imageUrl?: string;
  placeId?: string;
}

export interface PackingItem {
  _id?: string;
  item: string;
  category: 'Documents' | 'Clothing' | 'Gear' | 'Other' | string;
  isPacked: boolean;
}

export interface EstimatedBudget {
  transport: number;
  accommodation: number;
  food: number;
  activities: number;
  total: number;
}

export interface EmergencyInfo {
  police: string;
  hospitals: string[];
  embassy: string;
  numbers: string[];
}

export interface JournalEntry {
  notes: string;
  activityRatings: {
    activityId: string;
    rating: number;
  }[];
  photos: string[];
  createdAt: string;
}

export interface Trip {
  _id: string;
  userId: string;
  originCity: string;
  originCountry?: string;
  destination: string;
  country: string;
  durationDays: number;
  travelers: number;
  budgetTier: 'Low' | 'Medium' | 'High';
  interests: string[];
  startDate?: string;
  endDate?: string;
  destinationCoords: { lat: number; lng: number };
  originCoords: { lat: number; lng: number };
  destinationDetails: { city: string; state: string; country: string };
  itinerary: ItineraryDay[];
  hotels: Hotel[];
  dailyRoutes?: { dayNumber: number; distance: string; duration: string; polyline: string }[];
  estimatedBudget: EstimatedBudget;
  packingList: PackingItem[];
  emergencyInfo?: EmergencyInfo;
  riskWarnings?: string[];
  journalEntries?: JournalEntry[];
  weatherForecast?: { temperature: number; rainProbability: number; humidity: number; windSpeed: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
