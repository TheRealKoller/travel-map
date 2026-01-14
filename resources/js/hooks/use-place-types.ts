import { PlaceType } from '@/types/geocoder';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

export function usePlaceTypes() {
    const [placeTypes, setPlaceTypes] = useState<PlaceType[]>([]);
    const [selectedPlaceType, setSelectedPlaceType] = useState<string>('all');
    const selectedPlaceTypeRef = useRef<string>('all');

    // Update place type ref when it changes
    useEffect(() => {
        selectedPlaceTypeRef.current = selectedPlaceType;
    }, [selectedPlaceType]);

    // Fetch available place types on component mount
    useEffect(() => {
        const fetchPlaceTypes = async () => {
            try {
                const response = await axios.get('/markers/place-types');
                setPlaceTypes(response.data);
            } catch (error) {
                console.error('Failed to load place types:', error);
                // Set default place types if API call fails
                setPlaceTypes([{ value: 'all', label: 'Alle Orte' }]);
            }
        };

        fetchPlaceTypes();
    }, []);

    return {
        placeTypes,
        selectedPlaceType,
        setSelectedPlaceType,
        selectedPlaceTypeRef,
    } as const;
}
