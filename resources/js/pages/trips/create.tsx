import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { COUNTRIES } from '@/lib/countries';
import { store as tripsStore } from '@/routes/trips';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Map',
        href: '/',
    },
    {
        title: 'Create trip',
        href: '/trips/create',
    },
];

export default function CreateTrip() {
    const [name, setName] = useState('');
    const [country, setCountry] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            await fetch(tripsStore.url(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    name: name.trim(),
                    country: country || null,
                }),
            });

            // Navigate back to map after successful creation
            router.visit('/');
        } catch (error) {
            console.error('Failed to create trip:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.visit('/');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create trip" />
            <div className="flex h-full flex-1 items-center justify-center p-4">
                <div className="w-full max-w-2xl space-y-6 rounded-xl border border-sidebar-border/70 bg-card p-6 dark:border-sidebar-border">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Create new trip
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Fill in the details to create your trip
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    data-testid="trip-name-input"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Summer 2024, Japan Trip"
                                    disabled={isSubmitting}
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Select
                                    value={country}
                                    onValueChange={setCountry}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger
                                        id="country"
                                        data-testid="trip-country-select"
                                    >
                                        <SelectValue placeholder="Select a country..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COUNTRIES.map((c) => (
                                            <SelectItem
                                                key={c.code}
                                                value={c.code}
                                            >
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Search results will be filtered to this
                                    country
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Image</Label>
                                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/10">
                                    <p className="text-sm text-muted-foreground">
                                        Placeholder for image upload
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Viewport</Label>
                                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/10">
                                    <p className="text-sm text-muted-foreground">
                                        Placeholder for viewport settings
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={isSubmitting}
                                data-testid="cancel-button"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !name.trim()}
                                data-testid="save-button"
                            >
                                {isSubmitting ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
