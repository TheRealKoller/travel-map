import { MapContainer } from '@/components/map-container';
import { ModalManager } from '@/components/modal-manager';
import { useModalState } from '@/hooks/use-modal-state';
import { useTours } from '@/hooks/use-tours';
import { useTrips } from '@/hooks/use-trips';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Map',
        href: '/',
    },
];

interface MapPageProps {
    trip?: {
        id: number;
    };
}

export default function MapPage() {
    const { trip } = usePage<MapPageProps>().props;
    
    const {
        trips,
        setTrips,
        selectedTripId,
        setSelectedTripId,
        createTrip,
        renameTrip,
        deleteTrip,
        updateTripViewport,
    } = useTrips();

    // Set the selected trip based on the route parameter
    useEffect(() => {
        if (trip?.id && selectedTripId !== trip.id) {
            setSelectedTripId(trip.id);
        }
    }, [trip?.id, selectedTripId, setSelectedTripId]);

    const {
        tours,
        setTours,
        selectedTourId,
        setSelectedTourId,
        createTour,
        deleteTour,
    } = useTours(selectedTripId);

    const {
        state: modalState,
        closeCreateTripModal,
        openRenameTripModal,
        closeRenameTripModal,
        openDeleteTripDialog,
        closeDeleteTripDialog,
        openCreateTourModal,
        closeCreateTourModal,
        openDeleteTourDialog,
        closeDeleteTourDialog,
    } = useModalState();

    const handleOpenRenameModal = (tripId: number) => {
        const trip = trips.find((t) => t.id === tripId);
        if (!trip) {
            console.warn(`Trip with id ${tripId} not found`);
            return;
        }
        openRenameTripModal(trip);
    };

    const handleOpenDeleteTripDialog = (tripId: number) => {
        const trip = trips.find((t) => t.id === tripId);
        if (!trip) {
            console.warn(`Trip with id ${tripId} not found`);
            return;
        }
        openDeleteTripDialog(trip);
    };

    const handleOpenDeleteTourDialog = (tourId: number) => {
        const tour = tours.find((t) => t.id === tourId);
        if (!tour) {
            console.warn(`Tour with id ${tourId} not found`);
            return;
        }
        openDeleteTourDialog(tour);
    };

    const handleCreateTrip = async (name: string) => {
        await createTrip(name);
    };

    const handleRenameTrip = async (name: string) => {
        if (!modalState.tripToRename) return;
        await renameTrip(modalState.tripToRename, name);
    };

    const handleDeleteTrip = async () => {
        if (!modalState.tripToDelete) return;
        await deleteTrip(modalState.tripToDelete.id);
    };

    const handleCreateTour = async (name: string) => {
        await createTour(name);
    };

    const handleDeleteTour = async () => {
        if (!modalState.tourToDelete) return;
        await deleteTour(modalState.tourToDelete);
    };

    const handleTripImageFetched = (tripId: number, imageUrl: string) => {
        setTrips((prev) =>
            prev.map((t) =>
                t.id === tripId ? { ...t, image_url: imageUrl } : t,
            ),
        );
    };

    const handleSetViewport = async (
        tripId: number,
        viewport: { latitude: number; longitude: number; zoom: number },
    ) => {
        await updateTripViewport(tripId, viewport);
    };

    return (
        <AppLayout
            breadcrumbs={breadcrumbs}
            trips={trips}
            selectedTripId={selectedTripId}
            onSelectTrip={setSelectedTripId}
            onRenameTrip={handleOpenRenameModal}
            onDeleteTrip={handleOpenDeleteTripDialog}
            onTripImageFetched={handleTripImageFetched}
            updateTripViewport={updateTripViewport}
        >
            <Head title="Map" />
            <MapContainer
                selectedTripId={selectedTripId}
                selectedTourId={selectedTourId}
                tours={tours}
                trips={trips}
                onToursUpdate={setTours}
                onSelectTour={setSelectedTourId}
                onCreateTour={openCreateTourModal}
                onDeleteTour={handleOpenDeleteTourDialog}
                onSetViewport={handleSetViewport}
            />
            <ModalManager
                isCreateTripModalOpen={modalState.isCreateTripModalOpen}
                isRenameTripModalOpen={modalState.isRenameTripModalOpen}
                isDeleteTripDialogOpen={modalState.isDeleteTripDialogOpen}
                isCreateTourModalOpen={modalState.isCreateTourModalOpen}
                isDeleteTourDialogOpen={modalState.isDeleteTourDialogOpen}
                tripToRename={modalState.tripToRename}
                tripToDelete={modalState.tripToDelete}
                tourToDelete={modalState.tourToDelete}
                onCreateTripOpenChange={closeCreateTripModal}
                onRenameTripOpenChange={closeRenameTripModal}
                onDeleteTripOpenChange={closeDeleteTripDialog}
                onCreateTourOpenChange={closeCreateTourModal}
                onDeleteTourOpenChange={closeDeleteTourDialog}
                onCreateTrip={handleCreateTrip}
                onRenameTrip={handleRenameTrip}
                onDeleteTrip={handleDeleteTrip}
                onCreateTour={handleCreateTour}
                onDeleteTour={handleDeleteTour}
            />
        </AppLayout>
    );
}
