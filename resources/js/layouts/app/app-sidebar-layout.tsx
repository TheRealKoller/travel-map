import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { useSidebar } from '@/components/ui/sidebar';
import { type BreadcrumbItem } from '@/types';
import { Trip } from '@/types/trip';
import { router } from '@inertiajs/react';
import { type PropsWithChildren, useEffect } from 'react';

interface AppSidebarLayoutContentProps extends PropsWithChildren {
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

function AppSidebarLayoutContent({
    children,
    breadcrumbs = [],
    trips,
    selectedTripId,
    onSelectTrip,
    onCreateTrip,
    onRenameTrip,
    onDeleteTrip,
    onTripImageFetched,
    updateTripViewport,
}: AppSidebarLayoutContentProps) {
    const { setOpen, isMobile } = useSidebar();

    // Close sidebar on navigation (only on desktop)
    useEffect(() => {
        const handleNavigation = () => {
            if (!isMobile) {
                setOpen(false);
            }
        };

        const removeListener = router.on('navigate', handleNavigation);
        return () => removeListener();
    }, [setOpen, isMobile]);

    return (
        <>
            <AppSidebar
                trips={trips}
                selectedTripId={selectedTripId}
                onSelectTrip={onSelectTrip}
                onCreateTrip={onCreateTrip}
                onRenameTrip={onRenameTrip}
                onDeleteTrip={onDeleteTrip}
                onTripImageFetched={onTripImageFetched}
                updateTripViewport={updateTripViewport}
            />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </>
    );
}

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
    trips,
    selectedTripId,
    onSelectTrip,
    onCreateTrip,
    onRenameTrip,
    onDeleteTrip,
    onTripImageFetched,
    updateTripViewport,
}: AppSidebarLayoutContentProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebarLayoutContent
                breadcrumbs={breadcrumbs}
                trips={trips}
                selectedTripId={selectedTripId}
                onSelectTrip={onSelectTrip}
                onCreateTrip={onCreateTrip}
                onRenameTrip={onRenameTrip}
                onDeleteTrip={onDeleteTrip}
                onTripImageFetched={onTripImageFetched}
                updateTripViewport={updateTripViewport}
            >
                {children}
            </AppSidebarLayoutContent>
        </AppShell>
    );
}
