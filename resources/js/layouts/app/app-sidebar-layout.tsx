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
}

function AppSidebarLayoutContent({
    children,
    breadcrumbs = [],
    trips,
    selectedTripId,
    onSelectTrip,
    onCreateTrip,
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
}: AppSidebarLayoutContentProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebarLayoutContent
                breadcrumbs={breadcrumbs}
                trips={trips}
                selectedTripId={selectedTripId}
                onSelectTrip={onSelectTrip}
                onCreateTrip={onCreateTrip}
            >
                {children}
            </AppSidebarLayoutContent>
        </AppShell>
    );
}
