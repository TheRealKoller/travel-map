import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';

interface AppShellProps {
    children: React.ReactNode;
    variant?: 'header' | 'sidebar';
}

export function AppShell({ children, variant = 'header' }: AppShellProps) {
    if (variant === 'header') {
        return (
            <>
                <div className="flex min-h-screen w-full flex-col">
                    {children}
                </div>
                <Toaster />
            </>
        );
    }

    return (
        <>
            <SidebarProvider defaultOpen={false}>{children}</SidebarProvider>
            <Toaster />
        </>
    );
}
