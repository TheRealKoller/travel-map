import { MapContainer } from '@/components/map-container';
import { ModalManager } from '@/components/modal-manager';
import { useModalState } from '@/hooks/use-modal-state';
import { useTours } from '@/hooks/use-tours';
import { useTrips } from '@/hooks/use-trips';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Map',
        href: '/',
    },
];

export default function MapPage() {
    const { trips, selectedTripId, setSelectedTripId, createTrip, renameTrip } =
        useTrips();

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
        openCreateTripModal,
        closeCreateTripModal,
        openRenameTripModal,
        closeRenameTripModal,
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

    const handleCreateTour = async (name: string) => {
        await createTour(name);
    };

    const handleDeleteTour = async () => {
        if (!modalState.tourToDelete) return;
        await deleteTour(modalState.tourToDelete);
    };

    return (
        <AppLayout
            breadcrumbs={breadcrumbs}
            trips={trips}
            selectedTripId={selectedTripId}
            onSelectTrip={setSelectedTripId}
            onCreateTrip={openCreateTripModal}
            onRenameTrip={handleOpenRenameModal}
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
            />
            <ModalManager
                isCreateTripModalOpen={modalState.isCreateTripModalOpen}
                isRenameTripModalOpen={modalState.isRenameTripModalOpen}
                isCreateTourModalOpen={modalState.isCreateTourModalOpen}
                isDeleteTourDialogOpen={modalState.isDeleteTourDialogOpen}
                tripToRename={modalState.tripToRename}
                tourToDelete={modalState.tourToDelete}
                onCreateTripOpenChange={closeCreateTripModal}
                onRenameTripOpenChange={closeRenameTripModal}
                onCreateTourOpenChange={closeCreateTourModal}
                onDeleteTourOpenChange={closeDeleteTourDialog}
                onCreateTrip={handleCreateTrip}
                onRenameTrip={handleRenameTrip}
                onCreateTour={handleCreateTour}
                onDeleteTour={handleDeleteTour}
            />
        </AppLayout>
    );
}
