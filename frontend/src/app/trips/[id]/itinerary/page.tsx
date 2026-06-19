'use client';

import React from 'react';
import { useTripContext } from '../layout';
import ItineraryCard from '../../../../components/ItineraryCard';

export default function TripItineraryPage() {
  const { trip, currency, updateTrip, regenerateDay, isRegenerating } = useTripContext();

  return (
    <div className="space-y-6">
      <ItineraryCard
        trip={trip}
        currency={currency}
        onUpdateTrip={(updated) => updateTrip(updated)}
        onRegenerateDay={regenerateDay}
        isRegenerating={isRegenerating}
      />
    </div>
  );
}
