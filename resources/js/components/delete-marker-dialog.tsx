import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface RouteCountResponse {
    route_count: number;
}

interface DeleteMarkerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    markerName: string;
    markerId: string;
}

export default function DeleteMarkerDialog({
    open,
    onOpenChange,
    onConfirm,
    markerName,
    markerId,
}: DeleteMarkerDialogProps) {
    const [routeCount, setRouteCount] = useState<number>(0);
    const [loading, setLoading] = useState(false);

    // Fetch fresh route count when dialog opens
    useEffect(() => {
        const fetchRouteCount = async () => {
            if (!open || !markerId) {
                return;
            }

            setLoading(true);
            try {
                const response = await axios.get<RouteCountResponse>(
                    `/markers/${markerId}/route-count`,
                );
                setRouteCount(response.data.route_count || 0);
            } catch (error) {
                toast.error('Failed to fetch route count. Please try again.');
                setRouteCount(0);
            } finally {
                setLoading(false);
            }
        };

        fetchRouteCount();
    }, [open, markerId]);

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
                        {loading ? (
                            <span className="mt-2 block text-muted-foreground">
                                Checking associated routes...
                            </span>
                        ) : (
                            routeCount > 0 && (
                                <span className="mt-2 block font-semibold text-destructive">
                                    Warning: This will also delete {routeCount}{' '}
                                    associated route
                                    {routeCount !== 1 ? 's' : ''}.
                                </span>
                            )
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
                        disabled={loading}
                        data-testid="delete-marker-dialog-confirm-button"
                    >
                        Delete marker
                        {!loading &&
                            routeCount > 0 &&
                            ` and ${routeCount} route${routeCount !== 1 ? 's' : ''}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
