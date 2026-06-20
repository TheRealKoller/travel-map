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
    routeCount?: number;
}

export default function DeleteMarkerDialog({
    open,
    onOpenChange,
    onConfirm,
    markerName,
    routeCount = 0,
}: DeleteMarkerDialogProps) {
    const handleConfirm = () => {
        onConfirm();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete marker</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete "{markerName}"? This
                        action cannot be undone.
                        {routeCount > 0 && (
                            <span className="mt-2 block font-semibold text-destructive">
                                Warning: This will also delete {routeCount}{' '}
                                associated route{routeCount !== 1 ? 's' : ''}.
                            </span>
                        )}
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
                        {routeCount > 0 &&
                            ` and ${routeCount} route${routeCount !== 1 ? 's' : ''}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
