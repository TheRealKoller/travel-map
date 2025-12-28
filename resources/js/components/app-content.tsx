import { SidebarInset, useSidebar } from '@/components/ui/sidebar';
import * as React from 'react';

interface AppContentProps extends React.ComponentProps<'main'> {
    variant?: 'header' | 'sidebar';
}

export function AppContent({
    variant = 'header',
    children,
    ...props
}: AppContentProps) {
    if (variant === 'sidebar') {
        return (
            <SidebarContentWithOverlay {...props}>
                {children}
            </SidebarContentWithOverlay>
        );
    }

    return (
        <main
            className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-4 rounded-xl"
            {...props}
        >
            {children}
        </main>
    );
}

function SidebarContentWithOverlay({
    children,
    ...props
}: React.ComponentProps<'main'>) {
    const { open, setOpen, isMobile } = useSidebar();

    const handleOverlayClick = () => {
        if (open && !isMobile) {
            setOpen(false);
        }
    };

    return (
        <>
            {/* Overlay when sidebar is open on desktop */}
            {open && !isMobile && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 transition-opacity md:block"
                    onClick={handleOverlayClick}
                    aria-hidden="true"
                />
            )}
            <SidebarInset className="z-0" {...props}>
                {children}
            </SidebarInset>
        </>
    );
}
