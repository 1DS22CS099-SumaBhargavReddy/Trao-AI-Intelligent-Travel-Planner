const { z } = require('zod');

// Schema for generating a new trip
exports.createTripSchema = z.object({
  originCity: z.string().min(1, { message: 'Origin city is required' }).trim(),
  destination: z.string().min(2, { message: 'Destination must be at least 2 characters long' }).trim(),
  country: z.string().min(1, { message: 'Country is required' }).trim(),
  durationDays: z.number().int().min(1).max(30, { message: 'Duration must be between 1 and 30 days' }),
  budgetTier: z.enum(['Low', 'Medium', 'High']),
  travelers: z.number().int().min(1).max(20, { message: 'Number of travelers must be between 1 and 20' }).default(1),
  interests: z.array(z.string()).optional(),
  startDate: z.string().datetime({ message: 'Start date must be a valid ISO Date string' }).optional(),
  endDate: z.string().datetime({ message: 'End date must be a valid ISO Date string' }).optional()
});

// Schema for updating trip parameters (itinerary updates)
exports.updateTripSchema = z.object({
  itinerary: z.array(z.object({
    dayNumber: z.number().int().min(1),
    activities: z.array(z.object({
      title: z.string().min(1, { message: 'Activity title is required' }),
      description: z.string().optional(),
      estimatedCostUSD: z.number().nonnegative().default(0),
      timeOfDay: z.enum(['Morning', 'Afternoon', 'Evening']),
      rating: z.number().min(1).max(5).optional(),
      imageUrl: z.string().url().optional()
    }))
  })).optional(),
  packingList: z.array(z.object({
    item: z.string().min(1),
    category: z.enum(['Documents', 'Clothing', 'Gear', 'Other']),
    isPacked: z.boolean()
  })).optional(),
  journalEntries: z.array(z.object({
    notes: z.string().min(2),
    photos: z.array(z.string().url()).optional(),
    activityRatings: z.array(z.object({
      activityId: z.string(),
      rating: z.number().int().min(1).max(5)
    })).optional(),
    createdAt: z.string().datetime().optional()
  })).optional()
});

// Schema for day regeneration
exports.regenerateDaySchema = z.object({
  dayNumber: z.number().int().min(1),
  promptText: z.string().min(3, { message: 'Regeneration instruction must be at least 3 characters long' })
});
