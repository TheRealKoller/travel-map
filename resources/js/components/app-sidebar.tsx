import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import TripSelector from '@/components/trip-selector';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Trip } from '@/types/trip';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Luggage, Map } from 'lucide-react';
import AppLogo from './app-logo';
import { MapboxUsageProgressBar } from './mapbox-usage-progress-bar';

const mainNavItems: NavItem[] = [
    {
        title: 'Map',
        href: '/',
        icon: Map,
    },
    {
        title: 'Trips',
        href: '/trips',
        icon: Luggage,
    },
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

interface AppSidebarProps {
    trips?: Trip[];
    selectedTripId?: number | null;
    onSelectTrip?: (tripId: number) => void;
    onRenameTrip?: (tripId: number) => void;
    onDeleteTrip?: (tripId: number) => void;
    onTripImageFetched?: (tripId: number, imageUrl: string) => void;
    updateTripViewport?: (
        tripId: number,
        viewport: { latitude: number; longitude: number; zoom: number },
    ) => Promise<Trip>;
}

export function AppSidebar({
    trips = [],
    selectedTripId = null,
    onSelectTrip = () => {},
    onRenameTrip,
    onDeleteTrip,
    onTripImageFetched,
}: AppSidebarProps) {
    const handleSetViewport = (tripId: number) => {
        // Dispatch a custom event that the map component will listen to
        window.dispatchEvent(
            new CustomEvent('trip:set-viewport', { detail: { tripId } }),
        );
    };

    return (
        <Sidebar collapsible="offcanvas" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <MapboxUsageProgressBar />
                <NavMain items={mainNavItems} />
                <TripSelector
                    trips={trips}
                    selectedTripId={selectedTripId}
                    onSelectTrip={onSelectTrip}
                    onRenameTrip={onRenameTrip}
                    onDeleteTrip={onDeleteTrip}
                    onSetViewport={handleSetViewport}
                    onTripImageFetched={onTripImageFetched}
                />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
