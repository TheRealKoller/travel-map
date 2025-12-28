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
import { useState } from 'react';

interface CreateTripModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateTrip: (name: string) => Promise<void>;
}

export default function CreateTripModal({
    open,
    onOpenChange,
    onCreateTrip,
}: CreateTripModalProps) {
    const [tripName, setTripName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tripName.trim()) return;

        setIsSubmitting(true);
        try {
            await onCreateTrip(tripName.trim());
            setTripName('');
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to create trip:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create new trip</DialogTitle>
                    <DialogDescription>
                        Give your trip a name to organize your travel markers.
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
                            {isSubmitting ? 'Creating...' : 'Create trip'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
