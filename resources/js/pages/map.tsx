import CreateTripModal from '@/components/create-trip-modal';
import RenameTripModal from '@/components/rename-trip-modal';
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
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [tripToRename, setTripToRename] = useState<Trip | null>(null);

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

    const handleRenameTrip = async (tripId: number, name: string) => {
        try {
            const response = await axios.put(`/trips/${tripId}`, { name });
            const updatedTrip = response.data;
            setTrips((prev) =>
                prev.map((trip) => (trip.id === tripId ? updatedTrip : trip)),
            );
        } catch (error) {
            console.error('Failed to rename trip:', error);
            throw error;
        }
    };

    const handleDeleteTrip = async (tripId: number) => {
        if (
            !confirm(
                'Are you sure you want to delete this trip? All markers in this trip will also be deleted.',
            )
        ) {
            return;
        }

        try {
            await axios.delete(`/trips/${tripId}`);
            setTrips((prev) => prev.filter((trip) => trip.id !== tripId));
            if (selectedTripId === tripId) {
                const remainingTrips = trips.filter(
                    (trip) => trip.id !== tripId,
                );
                setSelectedTripId(
                    remainingTrips.length > 0 ? remainingTrips[0].id : null,
                );
            }
        } catch (error) {
            console.error('Failed to delete trip:', error);
        }
    };

    const handleOpenRenameModal = (trip: Trip) => {
        setTripToRename(trip);
        setIsRenameModalOpen(true);
    };

    return (
        <AppLayout
            breadcrumbs={breadcrumbs}
            trips={trips}
            selectedTripId={selectedTripId}
            onSelectTrip={setSelectedTripId}
            onCreateTrip={() => setIsCreateModalOpen(true)}
            onRenameTrip={handleOpenRenameModal}
            onDeleteTrip={handleDeleteTrip}
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
            <RenameTripModal
                open={isRenameModalOpen}
                onOpenChange={setIsRenameModalOpen}
                onRenameTrip={handleRenameTrip}
                trip={tripToRename}
            />
        </AppLayout>
    );
}
