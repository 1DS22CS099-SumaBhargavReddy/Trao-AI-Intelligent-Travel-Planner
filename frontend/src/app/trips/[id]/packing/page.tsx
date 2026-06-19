'use client';

import React from 'react';
import { useTripContext } from '../layout';
import PackingList from '../../../../components/PackingList';

export default function TripPackingPage() {
  const { trip, updateTrip } = useTripContext();

  return (
    <div className="space-y-6">
      <PackingList
        trip={trip}
        onUpdateTrip={(updated) => updateTrip(updated)}
      />
    </div>
  );
}
