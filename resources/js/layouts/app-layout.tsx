import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { Trip } from '@/types/trip';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    trips?: Trip[];
    selectedTripId?: number | null;
    onSelectTrip?: (tripId: number) => void;
    onCreateTrip?: () => void;
    onRenameTrip?: (tripId: number) => void;
    onDeleteTrip?: (tripId: number) => void;
    onTripImageFetched?: (tripId: number, imageUrl: string) => void;
    updateTripViewport?: (
        tripId: number,
        viewport: { latitude: number; longitude: number; zoom: number },
    ) => Promise<Trip>;
}

export default ({
    children,
    breadcrumbs,
    trips,
    selectedTripId,
    onSelectTrip,
    onCreateTrip,
    onRenameTrip,
    onDeleteTrip,
    onTripImageFetched,
    updateTripViewport,
    ...props
}: AppLayoutProps) => (
    <AppLayoutTemplate
        breadcrumbs={breadcrumbs}
        trips={trips}
        selectedTripId={selectedTripId}
        onSelectTrip={onSelectTrip}
        onCreateTrip={onCreateTrip}
        onRenameTrip={onRenameTrip}
        onDeleteTrip={onDeleteTrip}
        onTripImageFetched={onTripImageFetched}
        updateTripViewport={updateTripViewport}
        {...props}
    >
        {children}
    </AppLayoutTemplate>
);
