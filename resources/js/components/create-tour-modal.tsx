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

interface CreateTourModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateTour: (name: string) => Promise<void>;
}

export default function CreateTourModal({
    open,
    onOpenChange,
    onCreateTour,
}: CreateTourModalProps) {
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Tour name is required');
            return;
        }

        setIsSubmitting(true);
        try {
            await onCreateTour(name);
            setName('');
            onOpenChange(false);
        } catch (err) {
            // Extract error message from axios error response
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
                const responseData = axiosError.response?.data;
                
                // Check for validation errors
                if (responseData?.errors?.name) {
                    setError(responseData.errors.name[0]);
                } else if (responseData?.message) {
                    setError(responseData.message);
                } else {
                    setError('Failed to create tour. Please try again.');
                }
            } else {
                setError('Failed to create tour. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create new tour</DialogTitle>
                    <DialogDescription>
                        Create a new tour to organize your markers.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="input-tour-name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="input-tour-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                                placeholder="e.g., Day 1 - Tokyo"
                                disabled={isSubmitting}
                                data-testid="input-tour-name"
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-red-600">{error}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                            data-testid="button-cancel-create-tour"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}
                            data-testid="button-submit-create-tour"
                        >
                            {isSubmitting ? 'Creating...' : 'Create tour'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
