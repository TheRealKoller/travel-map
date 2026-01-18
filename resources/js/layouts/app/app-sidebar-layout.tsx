import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { useSidebar } from '@/components/ui/sidebar';
import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import { type PropsWithChildren, useEffect } from 'react';

interface AppSidebarLayoutContentProps extends PropsWithChildren {
    breadcrumbs?: BreadcrumbItem[];
}

function AppSidebarLayoutContent({
    children,
    breadcrumbs = [],
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
            <AppSidebar />
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
}: AppSidebarLayoutContentProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebarLayoutContent breadcrumbs={breadcrumbs}>
                {children}
            </AppSidebarLayoutContent>
        </AppShell>
    );
}
