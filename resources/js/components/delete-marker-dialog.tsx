import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface DeleteMarkerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    markerName: string;
}

export default function DeleteMarkerDialog({
    open,
    onOpenChange,
    onConfirm,
    markerName,
}: DeleteMarkerDialogProps) {
    const handleConfirm = () => {
        onConfirm();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete marker</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete "{markerName}"? This
                        action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        data-testid="delete-marker-dialog-cancel-button"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleConfirm}
                        data-testid="delete-marker-dialog-confirm-button"
                    >
                        Delete marker
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
