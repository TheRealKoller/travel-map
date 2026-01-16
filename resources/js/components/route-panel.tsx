import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { MarkerData } from '@/types/marker';
import { Route, TransportMode } from '@/types/route';
import axios from 'axios';
import {
    Bike,
    Car,
    ChevronDown,
    ChevronUp,
    PersonStanding,
    Train,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface RoutePanelProps {
    tripId: number;
    tourId?: number | null;
    markers: MarkerData[];
    routes: Route[];
    onRoutesUpdate: (routes: Route[]) => void;
    initialStartMarkerId?: string;
    initialEndMarkerId?: string;
}

export default function RoutePanel({
    tripId,
    tourId,
    markers,
    routes,
    onRoutesUpdate,
    initialStartMarkerId = '',
    initialEndMarkerId = '',
}: RoutePanelProps) {
    const [startMarkerId, setStartMarkerId] =
        useState<string>(initialStartMarkerId);
    const [endMarkerId, setEndMarkerId] = useState<string>(initialEndMarkerId);
    const [transportMode, setTransportMode] =
        useState<TransportMode>('driving-car');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedRoutes, setExpandedRoutes] = useState<Set<number>>(
        new Set(),
    );

    // Update marker IDs when initialStartMarkerId or initialEndMarkerId changes
    useEffect(() => {
        if (initialStartMarkerId) {
            setStartMarkerId(initialStartMarkerId);
        }
        if (initialEndMarkerId) {
            setEndMarkerId(initialEndMarkerId);
        }
    }, [initialStartMarkerId, initialEndMarkerId]);

    const handleCreateRoute = async () => {
        if (!startMarkerId || !endMarkerId) {
            setError('Please select both start and end markers');
            return;
        }

        if (startMarkerId === endMarkerId) {
            setError('Start and end markers must be different');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const response = await axios.post(
                '/routes',
                {
                    trip_id: tripId,
                    tour_id: tourId,
                    start_marker_id: startMarkerId,
                    end_marker_id: endMarkerId,
                    transport_mode: transportMode,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                },
            );

            // Add new route to the list
            onRoutesUpdate([...routes, response.data]);

            // Reset form
            setStartMarkerId('');
            setEndMarkerId('');
            setTransportMode('driving-car');
        } catch (err) {
            console.error('Failed to create route:', err);
            console.error('Request payload:', {
                trip_id: tripId,
                start_marker_id: startMarkerId,
                end_marker_id: endMarkerId,
                transport_mode: transportMode,
            });
            if (axios.isAxiosError(err)) {
                console.error('Response status:', err.response?.status);
                console.error('Response data:', err.response?.data);
                if (err.response?.data?.message) {
                    setError(err.response.data.message);
                } else if (err.response?.data?.error) {
                    setError(err.response.data.error);
                } else {
                    setError('Failed to create route. Please try again.');
                }
            } else {
                setError('Failed to create route. Please try again.');
            }
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteRoute = async (routeId: number) => {
        if (
            !confirm(
                'Are you sure you want to delete this route? This action cannot be undone.',
            )
        ) {
            return;
        }

        try {
            await axios.delete(`/routes/${routeId}`);
            onRoutesUpdate(routes.filter((r) => r.id !== routeId));
        } catch (err) {
            console.error('Failed to delete route:', err);
            alert('Failed to delete route. Please try again.');
        }
    };

    const getTransportIcon = (mode: TransportMode) => {
        switch (mode) {
            case 'driving-car':
                return <Car className="h-4 w-4" />;
            case 'cycling-regular':
                return <Bike className="h-4 w-4" />;
            case 'foot-walking':
                return <PersonStanding className="h-4 w-4" />;
            case 'public-transport':
                return <Train className="h-4 w-4" />;
        }
    };

    const getTransportColor = (mode: TransportMode) => {
        switch (mode) {
            case 'driving-car':
                return 'text-red-600';
            case 'cycling-regular':
                return 'text-orange-600';
            case 'foot-walking':
                return 'text-green-600';
            case 'public-transport':
                return 'text-blue-600';
        }
    };

    const formatDuration = (minutes: number): string => {
        const totalMinutes = Math.round(minutes);

        // More than a day (1440 minutes)
        if (totalMinutes >= 1440) {
            const days = Math.floor(totalMinutes / 1440);
            const remainingMinutes = totalMinutes % 1440;
            const hours = Math.floor(remainingMinutes / 60);
            const mins = remainingMinutes % 60;

            if (hours === 0 && mins === 0) {
                return `${days}d`;
            } else if (hours === 0) {
                return `${days}d ${mins}min`;
            } else if (mins === 0) {
                return `${days}d ${hours}h`;
            }
            return `${days}d ${hours}h ${mins}min`;
        }

        // More than an hour (60 minutes)
        if (totalMinutes >= 60) {
            const hours = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;

            if (mins === 0) {
                return `${hours}h`;
            }
            return `${hours}h ${mins}min`;
        }

        // Less than an hour
        return `${totalMinutes} min`;
    };

    const calculateAverageSpeed = (
        distanceKm: number,
        durationMinutes: number,
    ): string => {
        // Validate inputs
        if (durationMinutes <= 0 || distanceKm < 0) return '0 km/h';
        const durationHours = durationMinutes / 60;
        const speed = distanceKm / durationHours;
        return `${speed.toFixed(1)} km/h`;
    };

    const toggleRouteExpansion = (routeId: number) => {
        setExpandedRoutes((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(routeId)) {
                newSet.delete(routeId);
            } else {
                newSet.add(routeId);
            }
            return newSet;
        });
    };

    return (
        <div className="space-y-4">
            <Card className="p-4">
                <h3 className="mb-4 text-lg font-semibold">Create Route</h3>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="start-marker">Start Marker</Label>
                        <Select
                            value={startMarkerId}
                            onValueChange={setStartMarkerId}
                        >
                            <SelectTrigger id="start-marker">
                                <SelectValue placeholder="Select start marker" />
                            </SelectTrigger>
                            <SelectContent>
                                {markers
                                    .filter((m) => m.isSaved)
                                    .map((marker) => (
                                        <SelectItem
                                            key={marker.id}
                                            value={marker.id}
                                        >
                                            {marker.name || 'Unnamed Location'}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="end-marker">End Marker</Label>
                        <Select
                            value={endMarkerId}
                            onValueChange={setEndMarkerId}
                        >
                            <SelectTrigger id="end-marker">
                                <SelectValue placeholder="Select end marker" />
                            </SelectTrigger>
                            <SelectContent>
                                {markers
                                    .filter((m) => m.isSaved)
                                    .map((marker) => (
                                        <SelectItem
                                            key={marker.id}
                                            value={marker.id}
                                        >
                                            {marker.name || 'Unnamed Location'}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="transport-mode">Transport Mode</Label>
                        <Select
                            value={transportMode}
                            onValueChange={(value) =>
                                setTransportMode(value as TransportMode)
                            }
                        >
                            <SelectTrigger id="transport-mode">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="driving-car">
                                    <div className="flex items-center gap-2">
                                        <Car className="h-4 w-4" />
                                        <span>Car</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="cycling-regular">
                                    <div className="flex items-center gap-2">
                                        <Bike className="h-4 w-4" />
                                        <span>Bicycle</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="foot-walking">
                                    <div className="flex items-center gap-2">
                                        <PersonStanding className="h-4 w-4" />
                                        <span>Walking</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="public-transport">
                                    <div className="flex items-center gap-2">
                                        <Train className="h-4 w-4" />
                                        <span>Public Transport</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <Button
                        onClick={handleCreateRoute}
                        disabled={isCreating || !startMarkerId || !endMarkerId}
                        className="w-full"
                    >
                        {isCreating ? 'Creating...' : 'Calculate Route'}
                    </Button>
                </div>
            </Card>

            {routes.length > 0 && (
                <Card className="p-4">
                    <h3 className="mb-4 text-lg font-semibold">
                        Routes ({routes.length})
                    </h3>

                    <div className="space-y-3">
                        {routes.map((route) => {
                            const isExpanded = expandedRoutes.has(route.id);
                            return (
                                <Collapsible
                                    key={route.id}
                                    open={isExpanded}
                                    onOpenChange={() =>
                                        toggleRouteExpansion(route.id)
                                    }
                                >
                                    <div className="rounded-lg border">
                                        {/* Route header - always visible */}
                                        <div className="flex items-start justify-between p-3">
                                            <CollapsibleTrigger
                                                className="flex flex-1 cursor-pointer items-start gap-2"
                                                data-testid={`route-${route.id}-trigger`}
                                            >
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2 font-medium">
                                                        <span
                                                            className={getTransportColor(
                                                                route
                                                                    .transport_mode
                                                                    .value,
                                                            )}
                                                        >
                                                            {getTransportIcon(
                                                                route
                                                                    .transport_mode
                                                                    .value,
                                                            )}
                                                        </span>
                                                        <span className="text-sm">
                                                            {
                                                                route
                                                                    .start_marker
                                                                    .name
                                                            }{' '}
                                                            →{' '}
                                                            {
                                                                route.end_marker
                                                                    .name
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {route.distance.km.toFixed(
                                                            2,
                                                        )}{' '}
                                                        km •{' '}
                                                        {formatDuration(
                                                            route.duration
                                                                .minutes,
                                                        )}{' '}
                                                        •{' '}
                                                        {
                                                            route.transport_mode
                                                                .label
                                                        }
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </div>
                                            </CollapsibleTrigger>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    handleDeleteRoute(route.id)
                                                }
                                                className="ml-2 h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                data-testid={`route-${route.id}-delete`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* Collapsible route details */}
                                        <CollapsibleContent>
                                            <div className="space-y-3 border-t px-3 pt-3 pb-3">
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-semibold">
                                                        Route details
                                                    </h4>

                                                    {/* Distance and Duration */}
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div>
                                                            <span className="font-medium text-muted-foreground">
                                                                Distance:
                                                            </span>
                                                            <div className="mt-1">
                                                                {route.distance.km.toFixed(
                                                                    2,
                                                                )}{' '}
                                                                km
                                                                <span className="ml-1 text-muted-foreground">
                                                                    (
                                                                    {route.distance.meters.toLocaleString()}{' '}
                                                                    m)
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-muted-foreground">
                                                                Duration:
                                                            </span>
                                                            <div className="mt-1">
                                                                {formatDuration(
                                                                    route
                                                                        .duration
                                                                        .minutes,
                                                                )}
                                                                <span className="ml-1 text-muted-foreground">
                                                                    (
                                                                    {route.duration.seconds.toLocaleString()}{' '}
                                                                    sec)
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Average Speed */}
                                                    <div className="text-xs">
                                                        <span className="font-medium text-muted-foreground">
                                                            Average speed:
                                                        </span>
                                                        <div className="mt-1">
                                                            {calculateAverageSpeed(
                                                                route.distance
                                                                    .km,
                                                                route.duration
                                                                    .minutes,
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Route Complexity */}
                                                    <div className="text-xs">
                                                        <span className="font-medium text-muted-foreground">
                                                            Route points:
                                                        </span>
                                                        <div className="mt-1">
                                                            {
                                                                route.geometry
                                                                    .length
                                                            }{' '}
                                                            coordinates
                                                        </div>
                                                    </div>

                                                    {/* Transport Mode Specific Info */}
                                                    {route.transport_mode
                                                        .value ===
                                                        'public-transport' && (
                                                        <div className="mt-3 rounded bg-blue-50 p-2 text-xs dark:bg-blue-900/20">
                                                            <div className="font-medium text-blue-900 dark:text-blue-300">
                                                                ℹ️ Public
                                                                transport
                                                                information
                                                            </div>
                                                            <div className="mt-1 text-blue-800 dark:text-blue-400">
                                                                This route uses
                                                                public transport
                                                                mode. Detailed
                                                                information
                                                                about specific
                                                                transport types,
                                                                transfers, and
                                                                schedules may
                                                                not be available
                                                                through the
                                                                current routing
                                                                provider.
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Warning */}
                                                {route.warning && (
                                                    <div className="rounded border-l-4 border-yellow-500 bg-yellow-50 p-2 text-xs text-yellow-800 dark:border-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
                                                        <div className="font-medium">
                                                            ⚠️ Warning
                                                        </div>
                                                        <div className="mt-1">
                                                            {route.warning}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </CollapsibleContent>
                                    </div>
                                </Collapsible>
                            );
                        })}
                    </div>
                </Card>
            )}
        </div>
    );
}
