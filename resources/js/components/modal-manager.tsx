import CreateTourModal from '@/components/create-tour-modal';
import CreateTripModal from '@/components/create-trip-modal';
import DeleteTourDialog from '@/components/delete-tour-dialog';
import DeleteTripDialog from '@/components/delete-trip-dialog';
import RenameTripModal from '@/components/rename-trip-modal';
import { Tour } from '@/types/tour';
import { Trip } from '@/types/trip';

interface ModalManagerProps {
    isCreateTripModalOpen: boolean;
    isRenameTripModalOpen: boolean;
    isDeleteTripDialogOpen: boolean;
    isCreateTourModalOpen: boolean;
    isDeleteTourDialogOpen: boolean;
    tripToRename: Trip | null;
    tripToDelete: Trip | null;
    tourToDelete: Tour | null;
    onCreateTripOpenChange: (open: boolean) => void;
    onRenameTripOpenChange: (open: boolean) => void;
    onDeleteTripOpenChange: (open: boolean) => void;
    onCreateTourOpenChange: (open: boolean) => void;
    onDeleteTourOpenChange: (open: boolean) => void;
    onCreateTrip: (name: string) => Promise<void>;
    onRenameTrip: (name: string) => Promise<void>;
    onDeleteTrip: () => Promise<void>;
    onCreateTour: (name: string) => Promise<void>;
    onDeleteTour: () => Promise<void>;
}

export function ModalManager({
    isCreateTripModalOpen,
    isRenameTripModalOpen,
    isDeleteTripDialogOpen,
    isCreateTourModalOpen,
    isDeleteTourDialogOpen,
    tripToRename,
    tripToDelete,
    tourToDelete,
    onCreateTripOpenChange,
    onRenameTripOpenChange,
    onDeleteTripOpenChange,
    onCreateTourOpenChange,
    onDeleteTourOpenChange,
    onCreateTrip,
    onRenameTrip,
    onDeleteTrip,
    onCreateTour,
    onDeleteTour,
}: ModalManagerProps) {
    return (
        <>
            <CreateTripModal
                open={isCreateTripModalOpen}
                onOpenChange={onCreateTripOpenChange}
                onCreateTrip={onCreateTrip}
            />
            <RenameTripModal
                open={isRenameTripModalOpen}
                onOpenChange={onRenameTripOpenChange}
                onRenameTrip={onRenameTrip}
                currentName={tripToRename?.name ?? ''}
            />
            <DeleteTripDialog
                open={isDeleteTripDialogOpen}
                onOpenChange={onDeleteTripOpenChange}
                onConfirm={onDeleteTrip}
                tripName={tripToDelete?.name ?? ''}
            />
            <CreateTourModal
                open={isCreateTourModalOpen}
                onOpenChange={onCreateTourOpenChange}
                onCreateTour={onCreateTour}
            />
            <DeleteTourDialog
                open={isDeleteTourDialogOpen}
                onOpenChange={onDeleteTourOpenChange}
                onConfirm={onDeleteTour}
                tourName={tourToDelete?.name ?? ''}
            />
        </>
    );
}
