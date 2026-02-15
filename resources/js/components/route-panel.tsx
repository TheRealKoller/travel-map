import DeleteRouteDialog from '@/components/delete-route-dialog';
import OptimizeTourDialog from '@/components/optimize-tour-dialog';
import { AlternativeRoutesList } from '@/components/route-panel/alternative-routes-list';
import { TransitDetailsView } from '@/components/route-panel/transit-details-view';
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
import {
    calculateAverageSpeed,
    getFilteredRoutes as getFilteredRoutesUtil,
} from '@/lib/route-calculations';
import { formatDuration } from '@/lib/route-formatting';
import { getTransportColor, getTransportIcon } from '@/lib/transport-utils';
import { MarkerData } from '@/types/marker';
import { Route, TransportMode } from '@/types/route';
import { Tour } from '@/types/tour';
import axios from 'axios';
import {
    ArrowDownUp,
    Bike,
    Car,
    ChevronDown,
    ChevronUp,
    PersonStanding,
    Train,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface RoutePanelProps {
    tripId: number;
    tourId?: number | null;
    markers: MarkerData[];
    routes: Route[];
    onRoutesUpdate: (routes: Route[]) => void;
    initialStartMarkerId?: string;
    initialEndMarkerId?: string;
    tours?: Tour[];
    highlightedRouteId?: number | null;
    expandedRoutes: Set<number>;
    onExpandedRoutesChange: (expandedRoutes: Set<number>) => void;
    onHighlightedRouteIdChange?: (routeId: number | null) => void;
    onTourUpdate?: (tour: Tour) => void;
}

export default function RoutePanel({
    tripId,
    tourId,
    markers,
    routes,
    onRoutesUpdate,
    initialStartMarkerId = '',
    initialEndMarkerId = '',
    tours = [],
    highlightedRouteId = null,
    expandedRoutes,
    onExpandedRoutesChange,
    onHighlightedRouteIdChange,
    onTourUpdate,
}: RoutePanelProps) {
    const [startMarkerId, setStartMarkerId] =
        useState<string>(initialStartMarkerId);
    const [endMarkerId, setEndMarkerId] = useState<string>(initialEndMarkerId);
    const [transportMode, setTransportMode] =
        useState<TransportMode>('driving-car');
    const [isCreating, setIsCreating] = useState(false);
    const [isSorting, setIsSorting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleteRouteId, setDeleteRouteId] = useState<number | null>(null);
    const [showOptimizeTourDialog, setShowOptimizeTourDialog] = useState(false);

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
        setDeleteRouteId(routeId);
    };

    const handleConfirmDeleteRoute = async () => {
        if (deleteRouteId === null) return;

        try {
            await axios.delete(`/routes/${deleteRouteId}`);
            onRoutesUpdate(routes.filter((r) => r.id !== deleteRouteId));
            setDeleteRouteId(null);
        } catch (err) {
            console.error('Failed to delete route:', err);
            toast.error('Failed to delete route. Please try again.');
            setDeleteRouteId(null);
        }
    };

    const handleSortMarkers = async () => {
        if (!tourId) {
            return;
        }

        const tour = tours.find((t) => t.id === tourId);
        if (!tour || !tour.markers || tour.markers.length < 2) {
            toast.error('Tour must have at least 2 markers to sort.');
            return;
        }

        if (tour.markers.length > 25) {
            toast.error(
                'Tour has too many markers. Maximum is 25 markers for automatic sorting.',
            );
            return;
        }

        setShowOptimizeTourDialog(true);
    };

    const handleConfirmOptimizeTour = async () => {
        if (!tourId) {
            setShowOptimizeTourDialog(false);
            return;
        }

        const tour = tours.find((t) => t.id === tourId);
        if (!tour) {
            setShowOptimizeTourDialog(false);
            return;
        }

        setIsSorting(true);
        setError(null);

        try {
            const response = await axios.post(
                `/tours/${tourId}/markers/sort`,
                {},
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                },
            );

            // Update the tour with the sorted markers
            if (onTourUpdate && response.data) {
                onTourUpdate(response.data);
            }

            // Show success message
            toast.success('Markers sorted successfully!');
            setShowOptimizeTourDialog(false);
        } catch (err) {
            console.error('Failed to sort markers:', err);
            if (axios.isAxiosError(err)) {
                if (err.response?.data?.error) {
                    setError(err.response.data.error);
                } else {
                    setError('Failed to sort markers. Please try again.');
                }
            } else {
                setError('Failed to sort markers. Please try again.');
            }
            setShowOptimizeTourDialog(false);
        } finally {
            setIsSorting(false);
        }
    };

    const toggleRouteExpansion = (routeId: number) => {
        const isCurrentlyExpanded = expandedRoutes.has(routeId);

        // If expanding, close all others and open only this one
        // If collapsing, just close this one
        const newSet = new Set<number>();
        if (!isCurrentlyExpanded) {
            newSet.add(routeId);
        }
        onExpandedRoutesChange(newSet);

        // When expanding a route, highlight it. When collapsing, remove highlight
        if (onHighlightedRouteIdChange) {
            onHighlightedRouteIdChange(!isCurrentlyExpanded ? routeId : null);
        }
    };

    const filteredRoutes = getFilteredRoutesUtil(routes, tourId, tours);

    return (
        <div className="space-y-3 p-3 sm:space-y-4 sm:p-3 md:p-4">
            <Card className="p-3 sm:p-3 md:p-4">
                <h3 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">
                    Create Route
                </h3>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="start-marker">Start Marker</Label>
                        <Select
                            value={startMarkerId || ''}
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
                            value={endMarkerId || ''}
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

            {tourId && tours.find((t) => t.id === tourId) && (
                <Card className="p-4">
                    <h3 className="mb-4 text-lg font-semibold">
                        Tour optimization
                    </h3>

                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Automatically reorder markers in your tour to
                            minimize walking distance between locations.
                        </p>

                        <Button
                            onClick={handleSortMarkers}
                            disabled={
                                isSorting ||
                                !tours.find((t) => t.id === tourId)?.markers ||
                                (tours.find((t) => t.id === tourId)?.markers
                                    ?.length ?? 0) < 2
                            }
                            variant="outline"
                            className="w-full"
                            data-testid="sort-markers-button"
                        >
                            <ArrowDownUp className="mr-2 h-4 w-4" />
                            {isSorting
                                ? 'Sorting markers...'
                                : 'Sort markers by distance'}
                        </Button>

                        <p className="text-xs text-muted-foreground">
                            Uses Mapbox Matrix API to calculate walking
                            distances and finds the optimal order.
                        </p>
                    </div>
                </Card>
            )}

            {filteredRoutes.length > 0 && (
                <Card className="p-3 sm:p-3 md:p-4">
                    <h3 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">
                        Routes ({filteredRoutes.length})
                    </h3>

                    <div className="space-y-3 sm:space-y-3">
                        {filteredRoutes.map((route) => {
                            const isExpanded = expandedRoutes.has(route.id);
                            const isHighlighted =
                                highlightedRouteId === route.id;
                            return (
                                <Collapsible
                                    key={route.id}
                                    open={isExpanded}
                                    onOpenChange={() =>
                                        toggleRouteExpansion(route.id)
                                    }
                                >
                                    <div
                                        className={`rounded-lg border ${
                                            isHighlighted
                                                ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
                                                : ''
                                        }`}
                                    >
                                        {/* Route header - always visible */}
                                        <div className="flex items-start justify-between p-3 sm:p-3">
                                            <CollapsibleTrigger
                                                className="flex flex-1 cursor-pointer items-start gap-2 sm:gap-2"
                                                data-testid={`route-${route.id}-trigger`}
                                            >
                                                <div className="min-w-0 flex-1 space-y-1 sm:space-y-1">
                                                    <div className="flex items-center gap-2 font-medium sm:gap-2">
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
                                                        <span className="truncate text-xs leading-snug sm:text-sm">
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
                                                className="ml-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                data-testid={`route-${route.id}-delete`}
                                            >
                                                <Trash2 className="h-5 w-5" />
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
                                                        <>
                                                            {route.transit_details ? (
                                                                <>
                                                                    <TransitDetailsView
                                                                        transitDetails={
                                                                            route.transit_details
                                                                        }
                                                                    />
                                                                    <AlternativeRoutesList
                                                                        alternatives={
                                                                            route.alternatives
                                                                        }
                                                                    />
                                                                </>
                                                            ) : (
                                                                <div className="mt-3 rounded bg-blue-50 p-2 text-xs dark:bg-blue-900/20">
                                                                    <div className="font-medium text-blue-900 dark:text-blue-300">
                                                                        ℹ️
                                                                        Public
                                                                        transport
                                                                        information
                                                                    </div>
                                                                    <div className="mt-1 text-blue-800 dark:text-blue-400">
                                                                        This
                                                                        route
                                                                        uses
                                                                        public
                                                                        transport
                                                                        mode.
                                                                        Detailed
                                                                        information
                                                                        about
                                                                        specific
                                                                        transport
                                                                        types,
                                                                        transfers,
                                                                        and
                                                                        schedules
                                                                        may not
                                                                        be
                                                                        available
                                                                        through
                                                                        the
                                                                        current
                                                                        routing
                                                                        provider.
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
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

            <DeleteRouteDialog
                open={deleteRouteId !== null}
                onOpenChange={(open) => {
                    if (!open) setDeleteRouteId(null);
                }}
                onConfirm={handleConfirmDeleteRoute}
            />

            <OptimizeTourDialog
                open={showOptimizeTourDialog}
                onOpenChange={setShowOptimizeTourDialog}
                onConfirm={handleConfirmOptimizeTour}
                markerCount={
                    tourId
                        ? tours.find((t) => t.id === tourId)?.markers?.length ||
                          0
                        : 0
                }
            />
        </div>
    );
}
