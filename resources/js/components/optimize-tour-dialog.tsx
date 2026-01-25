import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface OptimizeTourDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => Promise<void>;
    markerCount: number;
}

export default function OptimizeTourDialog({
    open,
    onOpenChange,
    onConfirm,
    markerCount,
}: OptimizeTourDialogProps) {
    const handleConfirm = async () => {
        await onConfirm();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Optimize tour order</DialogTitle>
                    <DialogDescription>
                        This will automatically reorder the {markerCount}{' '}
                        markers in your tour based on walking distances.
                        Continue?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        data-testid="optimize-tour-dialog-cancel-button"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        data-testid="optimize-tour-dialog-confirm-button"
                    >
                        Optimize
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
