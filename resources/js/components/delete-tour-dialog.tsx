import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface DeleteTourDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => Promise<void>;
    tourName: string;
}

export default function DeleteTourDialog({
    open,
    onOpenChange,
    onConfirm,
    tourName,
}: DeleteTourDialogProps) {
    const handleConfirm = async () => {
        await onConfirm();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete tour</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete the tour "{tourName}"?
                        The markers will remain in your trip, but the tour
                        organization will be removed.
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
                        Delete tour
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
