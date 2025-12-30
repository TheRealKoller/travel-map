import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trip } from '@/types/trip';
import { useEffect, useState } from 'react';

interface RenameTripModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onRenameTrip: (tripId: number, name: string) => Promise<void>;
    trip: Trip | null;
}

export default function RenameTripModal({
    open,
    onOpenChange,
    onRenameTrip,
    trip,
}: RenameTripModalProps) {
    const [tripName, setTripName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (trip) {
            setTripName(trip.name);
        } else {
            setTripName('');
        }
    }, [trip]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tripName.trim() || !trip) return;

        setIsSubmitting(true);
        try {
            await onRenameTrip(trip.id, tripName.trim());
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to rename trip:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rename trip</DialogTitle>
                    <DialogDescription>
                        Change the name of your trip.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="tripName">Trip name</Label>
                            <Input
                                id="tripName"
                                value={tripName}
                                onChange={(e) => setTripName(e.target.value)}
                                placeholder="e.g., Summer 2024, Japan Trip"
                                disabled={isSubmitting}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !tripName.trim()}
                        >
                            {isSubmitting ? 'Renaming...' : 'Rename trip'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
