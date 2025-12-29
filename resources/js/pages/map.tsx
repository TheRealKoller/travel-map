import CreateTripModal from '@/components/create-trip-modal';
import TravelMap from '@/components/travel-map';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Trip } from '@/types/trip';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Map',
        href: '/',
    },
];

export default function MapPage() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        const loadTrips = async () => {
            try {
                const response = await axios.get('/trips');
                const loadedTrips = response.data;
                setTrips(loadedTrips);
                if (loadedTrips.length > 0 && selectedTripId === null) {
                    setSelectedTripId(loadedTrips[0].id);
                }
            } catch (error) {
                console.error('Failed to load trips:', error);
            }
        };

        loadTrips();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCreateTrip = async (name: string) => {
        try {
            const response = await axios.post('/trips', { name });
            const newTrip = response.data;
            setTrips((prev) => [...prev, newTrip]);
            setSelectedTripId(newTrip.id);
        } catch (error) {
            console.error('Failed to create trip:', error);
            throw error;
        }
    };

    return (
        <AppLayout
            breadcrumbs={breadcrumbs}
            trips={trips}
            selectedTripId={selectedTripId}
            onSelectTrip={setSelectedTripId}
            onCreateTrip={() => setIsCreateModalOpen(true)}
        >
            <Head title="Map" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <TravelMap selectedTripId={selectedTripId} />
            </div>
            <CreateTripModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                onCreateTrip={handleCreateTrip}
            />
        </AppLayout>
    );
}
