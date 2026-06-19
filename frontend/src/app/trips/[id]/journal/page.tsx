'use client';

import React from 'react';
import { useTripContext } from '../layout';
import TravelJournal from '../../../../components/TravelJournal';

export default function TripJournalPage() {
  const { trip, updateTrip } = useTripContext();

  return (
    <div className="space-y-6">
      <TravelJournal
        trip={trip}
        onUpdateTrip={(updated) => updateTrip(updated)}
      />
    </div>
  );
}
