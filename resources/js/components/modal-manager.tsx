import CreateTourModal from '@/components/create-tour-modal';
import CreateTripModal from '@/components/create-trip-modal';
import DeleteTourDialog from '@/components/delete-tour-dialog';
import RenameTripModal from '@/components/rename-trip-modal';
import { Tour } from '@/types/tour';
import { Trip } from '@/types/trip';

interface ModalManagerProps {
    isCreateTripModalOpen: boolean;
    isRenameTripModalOpen: boolean;
    isCreateTourModalOpen: boolean;
    isDeleteTourDialogOpen: boolean;
    tripToRename: Trip | null;
    tourToDelete: Tour | null;
    onCreateTripOpenChange: (open: boolean) => void;
    onRenameTripOpenChange: (open: boolean) => void;
    onCreateTourOpenChange: (open: boolean) => void;
    onDeleteTourOpenChange: (open: boolean) => void;
    onCreateTrip: (name: string) => Promise<void>;
    onRenameTrip: (name: string) => Promise<void>;
    onCreateTour: (name: string) => Promise<void>;
    onDeleteTour: () => Promise<void>;
}

export function ModalManager({
    isCreateTripModalOpen,
    isRenameTripModalOpen,
    isCreateTourModalOpen,
    isDeleteTourDialogOpen,
    tripToRename,
    tourToDelete,
    onCreateTripOpenChange,
    onRenameTripOpenChange,
    onCreateTourOpenChange,
    onDeleteTourOpenChange,
    onCreateTrip,
    onRenameTrip,
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
