/**
 * Utility functions for transport mode handling
 */

import { TransportMode } from '@/types/route';
import { Bike, Bus, Car, PersonStanding, Train, TramFront } from 'lucide-react';
import { ReactElement } from 'react';

/**
 * Get icon component for transport mode
 */
export function getTransportIcon(mode: TransportMode): ReactElement {
    switch (mode) {
        case 'driving-car':
            return <Car className="h-4 w-4" />;
        case 'cycling-regular':
            return <Bike className="h-4 w-4" />;
        case 'foot-walking':
            return <PersonStanding className="h-4 w-4" />;
        case 'public-transport':
            return <Train className="h-4 w-4" />;
    }
}

/**
 * Get color class for transport mode
 */
export function getTransportColor(mode: TransportMode): string {
    switch (mode) {
        case 'driving-car':
            return 'text-red-600';
        case 'cycling-regular':
            return 'text-orange-600';
        case 'foot-walking':
            return 'text-green-600';
        case 'public-transport':
            return 'text-blue-600';
    }
}

/**
 * Get icon component for public transport vehicle type
 */
export function getVehicleIcon(vehicleType: string | null): ReactElement {
    if (!vehicleType) return <Train className="h-4 w-4" />;

    const type = vehicleType.toLowerCase();
    if (type.includes('bus')) return <Bus className="h-4 w-4" />;
    if (type.includes('tram') || type.includes('streetcar'))
        return <TramFront className="h-4 w-4" />;
    if (
        type.includes('train') ||
        type.includes('rail') ||
        type.includes('subway') ||
        type.includes('metro')
    )
        return <Train className="h-4 w-4" />;
    return <Train className="h-4 w-4" />;
}
