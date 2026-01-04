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

interface CreateSubTourModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateSubTour: (name: string) => Promise<void>;
    parentTourName: string;
}

export default function CreateSubTourModal({
    open,
    onOpenChange,
    onCreateSubTour,
    parentTourName,
}: CreateSubTourModalProps) {
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Sub-tour name is required');
            return;
        }

        setIsSubmitting(true);
        try {
            await onCreateSubTour(name);
            setName('');
            onOpenChange(false);
        } catch (error: unknown) {
            // Extract validation error message from server response if available
            if (
                error &&
                typeof error === 'object' &&
                'response' in error &&
                error.response &&
                typeof error.response === 'object' &&
                'data' in error.response
            ) {
                const responseData = error.response.data as {
                    message?: string;
                    errors?: Record<string, string[]>;
                };
                if (responseData.errors?.name?.[0]) {
                    setError(responseData.errors.name[0]);
                } else if (responseData.message) {
                    setError(responseData.message);
                } else {
                    setError('Failed to create sub-tour. Please try again.');
                }
            } else {
                setError('Failed to create sub-tour. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create sub-tour</DialogTitle>
                    <DialogDescription>
                        Create a sub-tour within "{parentTourName}" to organize
                        markers.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                                placeholder="e.g., Morning sightseeing"
                                disabled={isSubmitting}
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
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create sub-tour'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
