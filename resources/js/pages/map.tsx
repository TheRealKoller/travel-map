import { Head, Link } from '@inertiajs/react';
import TravelMap from '@/components/travel-map';

export default function MapPage() {
    return (
        <>
            <Head title="Travelmap" />
            <div className="min-h-screen bg-gray-50 p-5">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-5">
                        <h1 className="text-3xl font-bold">Travelmap</h1>
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="px-5 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Logout
                        </Link>
                    </div>
                    <TravelMap />
                </div>
            </div>
        </>
    );
}
