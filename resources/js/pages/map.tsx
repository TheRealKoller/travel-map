import CreateTourModal from '@/components/create-tour-modal';
import CreateTripModal from '@/components/create-trip-modal';
import RenameTripModal from '@/components/rename-trip-modal';
import TourTabs from '@/components/tour-tabs';
import TravelMap from '@/components/travel-map';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Tour } from '@/types/tour';
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
    const [tours, setTours] = useState<Tour[]>([]);
    const [selectedTourId, setSelectedTourId] = useState<number | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isCreateTourModalOpen, setIsCreateTourModalOpen] = useState(false);
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

    useEffect(() => {
        const loadTours = async () => {
            if (!selectedTripId) return;

            try {
                const response = await axios.get('/tours', {
                    params: { trip_id: selectedTripId },
                });
                setTours(response.data);
                setSelectedTourId(null); // Reset to "All markers" when switching trips
            } catch (error) {
                console.error('Failed to load tours:', error);
            }
        };

        loadTours();
    }, [selectedTripId]);

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

    const handleRenameTrip = async (name: string) => {
        if (!tripToRename) return;

        try {
            const response = await axios.put(`/trips/${tripToRename.id}`, {
                name,
            });
            const updatedTrip = response.data;
            setTrips((prev) =>
                prev.map((trip) =>
                    trip.id === updatedTrip.id ? updatedTrip : trip,
                ),
            );
        } catch (error) {
            console.error('Failed to rename trip:', error);
            throw error;
        }
    };

    const handleOpenRenameModal = (tripId: number) => {
        const trip = trips.find((t) => t.id === tripId);
        if (!trip) {
            console.warn(`Trip with id ${tripId} not found`);
            return;
        }
        setTripToRename(trip);
        setIsRenameModalOpen(true);
    };

    const handleCreateTour = async (name: string) => {
        if (!selectedTripId) return;

        try {
            const response = await axios.post('/tours', {
                name,
                trip_id: selectedTripId,
            });
            const newTour = response.data;
            setTours((prev) => [...prev, newTour]);
            setSelectedTourId(newTour.id);
        } catch (error) {
            console.error('Failed to create tour:', error);
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
            onRenameTrip={handleOpenRenameModal}
        >
            <Head title="Map" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <TourTabs
                    tours={tours}
                    selectedTourId={selectedTourId}
                    onSelectTour={setSelectedTourId}
                    onCreateTour={() => setIsCreateTourModalOpen(true)}
                >
                    <TravelMap
                        selectedTripId={selectedTripId}
                        selectedTourId={selectedTourId}
                        tours={tours}
                        onToursUpdate={setTours}
                    />
                </TourTabs>
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
                currentName={tripToRename?.name ?? ''}
            />
            <CreateTourModal
                open={isCreateTourModalOpen}
                onOpenChange={setIsCreateTourModalOpen}
                onCreateTour={handleCreateTour}
            />
        </AppLayout>
    );
}
