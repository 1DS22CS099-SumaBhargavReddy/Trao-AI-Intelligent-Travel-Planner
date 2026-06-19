'use client';

import React from 'react';
import { useTripContext } from '../layout';
import RouteMap from '../../../../components/RouteMap';

export default function TripMapPage() {
  const { trip } = useTripContext();

  return (
    <div className="space-y-6">
      <RouteMap trip={trip} />
    </div>
  );
}
