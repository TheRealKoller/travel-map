import { MarkerData, MarkerType } from '@/types/marker';

interface MarkerFormProps {
    marker: MarkerData | null;
    onUpdateName: (id: string, name: string) => void;
    onUpdateType: (id: string, type: MarkerType) => void;
}

export default function MarkerForm({ marker, onUpdateName, onUpdateType }: MarkerFormProps) {
    if (!marker) {
        return (
            <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-xl font-semibold mb-4">Marker Details</h2>
                <p className="text-gray-500">Select a marker to edit its details</p>
            </div>
        );
    }

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdateName(marker.id, e.target.value);
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onUpdateType(marker.id, e.target.value as MarkerType);
    };

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">Marker Details</h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="marker-name" className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                    </label>
                    <input
                        id="marker-name"
                        type="text"
                        value={marker.name}
                        onChange={handleNameChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter marker name"
                    />
                </div>
                <div>
                    <label htmlFor="marker-type" className="block text-sm font-medium text-gray-700 mb-2">
                        Type
                    </label>
                    <select
                        id="marker-type"
                        value={marker.type}
                        onChange={handleTypeChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value={MarkerType.Restaurant}>Restaurant</option>
                        <option value={MarkerType.PointOfInterest}>Point of Interest</option>
                        <option value={MarkerType.Question}>Question</option>
                        <option value={MarkerType.Tip}>Tip</option>
                        <option value={MarkerType.Hotel}>Hotel</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Coordinates
                    </label>
                    <p className="text-sm text-gray-600">
                        <span className="font-medium">Latitude:</span> {marker.lat.toFixed(6)}
                    </p>
                    <p className="text-sm text-gray-600">
                        <span className="font-medium">Longitude:</span> {marker.lng.toFixed(6)}
                    </p>
                </div>
            </div>
        </div>
    );
}
