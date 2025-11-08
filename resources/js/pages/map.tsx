import { Head } from '@inertiajs/react';
import TravelMap from '@/components/travel-map';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Map',
        href: '/',
    },
];

export default function MapPage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Map" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <TravelMap />
            </div>
        </AppLayout>
    );
}
