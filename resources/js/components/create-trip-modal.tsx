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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { COUNTRIES } from '@/lib/countries';
import { useState } from 'react';

interface CreateTripModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateTrip: (name: string, country: string | null) => Promise<void>;
}

export default function CreateTripModal({
    open,
    onOpenChange,
    onCreateTrip,
}: CreateTripModalProps) {
    const [tripName, setTripName] = useState('');
    const [country, setCountry] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tripName.trim()) return;

        setIsSubmitting(true);
        try {
            await onCreateTrip(tripName.trim(), country || null);
            setTripName('');
            setCountry('');
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
                        Give your trip a name and optionally select a country to
                        filter search results.
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
                        <div className="grid gap-2">
                            <Label htmlFor="country">Country (optional)</Label>
                            <Select
                                value={country}
                                onValueChange={setCountry}
                                disabled={isSubmitting}
                            >
                                <SelectTrigger id="country">
                                    <SelectValue placeholder="Select a country..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {COUNTRIES.map((c) => (
                                        <SelectItem key={c.code} value={c.code}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Search results will be filtered to this country
                            </p>
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
