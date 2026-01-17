import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface DeleteTripDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => Promise<void>;
    tripName: string;
}

export default function DeleteTripDialog({
    open,
    onOpenChange,
    onConfirm,
    tripName,
}: DeleteTripDialogProps) {
    const handleConfirm = async () => {
        await onConfirm();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete trip</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete the trip "{tripName}"?
                        This will permanently delete the trip and all associated
                        data including markers, tours, and routes. This action
                        cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleConfirm}
                    >
                        Delete trip
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
