import { type MarkerData, MarkerType } from '@/types/marker';
import { type Route } from '@/types/route';
import { type Tour } from '@/types/tour';
import { type Trip } from '@/types/trip';
import axios from 'axios';
import {
    type Dispatch,
    type SetStateAction,
    useCallback,
    useEffect,
    useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const SYNC_INTERVAL_MS = 20_000; // 20 seconds

interface RawMarker {
    id: string;
    latitude: number;
    longitude: number;
    name: string;
    type: MarkerType;
    notes: string | null;
    url: string | null;
    image_url: string | null;
    is_unesco: boolean;
    ai_enriched: boolean;
    estimated_hours: number | null;
}

interface UseSyncOptions {
    selectedTripId: number | null;
    selectedTrip: Trip | undefined;
    setMarkers: Dispatch<SetStateAction<MarkerData[]>>;
    setRoutes: Dispatch<SetStateAction<Route[]>>;
    onToursUpdate: (tours: Tour[]) => void;
    tours: Tour[];
    selectedMarkerId: string | null;
    expandedRoutes: Set<number>;
    /**
     * Called when the sync response contains a marker that doesn't exist locally
     * yet. The caller is responsible for creating the Mapbox instance and adding
     * it to the map before returning the full MarkerData object.
     */
    onAddMarker: (raw: RawMarker) => MarkerData | null;
}

interface SyncResponse {
    markers: RawMarker[];
    routes: Route[];
    tours: Tour[];
    deleted_marker_ids: string[];
    deleted_route_ids: number[];
    deleted_tour_ids: number[];
}

export function useSync({
    selectedTripId,
    selectedTrip,
    setMarkers,
    setRoutes,
    onToursUpdate,
    tours,
    selectedMarkerId,
    expandedRoutes,
    onAddMarker,
}: UseSyncOptions) {
    const { t } = useTranslation();
    const lastSyncedAtRef = useRef<string>(new Date().toISOString());
    const isSyncingRef = useRef(false);

    // Whether polling should be active: trip must have at least one collaborator
    const hasCollaborators =
        selectedTrip !== undefined &&
        (selectedTrip.shared_users_count ?? 0) > 0;

    const applySync = useCallback(
        (data: SyncResponse) => {
            // ── Markers ──────────────────────────────────────────────────────────
            if (data.markers.length > 0 || data.deleted_marker_ids.length > 0) {
                setMarkers((prev) => {
                    let updated = [...prev];

                    // Apply updates / additions
                    for (const serverMarker of data.markers) {
                        const existing = updated.find(
                            (m) => m.id === serverMarker.id,
                        );

                        if (existing) {
                            // Update position on map if coordinates changed
                            if (
                                existing.lat !== serverMarker.latitude ||
                                existing.lng !== serverMarker.longitude
                            ) {
                                existing.marker.setLngLat([
                                    serverMarker.longitude,
                                    serverMarker.latitude,
                                ]);
                            }

                            // Show conflict toast if this marker is currently open in the form
                            if (selectedMarkerId === serverMarker.id) {
                                toast.warning(
                                    t(
                                        'sync.conflict.marker',
                                        'Another user has modified this marker.',
                                    ),
                                );
                            }

                            updated = updated.map((m) =>
                                m.id === serverMarker.id
                                    ? {
                                          ...m,
                                          lat: serverMarker.latitude,
                                          lng: serverMarker.longitude,
                                          name: serverMarker.name ?? m.name,
                                          type:
                                              (serverMarker.type as MarkerType) ??
                                              m.type,
                                          notes: serverMarker.notes ?? m.notes,
                                          url: serverMarker.url ?? m.url,
                                          imageUrl:
                                              serverMarker.image_url ??
                                              m.imageUrl,
                                          isUnesco:
                                              serverMarker.is_unesco ??
                                              m.isUnesco,
                                          aiEnriched:
                                              serverMarker.ai_enriched ??
                                              m.aiEnriched,
                                          estimatedHours:
                                              serverMarker.estimated_hours ??
                                              m.estimatedHours,
                                      }
                                    : m,
                            );
                        } else {
                            // New marker — delegate Mapbox instance creation to caller
                            const markerData = onAddMarker(serverMarker);
                            if (markerData) {
                                updated.push(markerData);
                            }
                        }
                    }

                    // Remove deleted markers
                    for (const deletedId of data.deleted_marker_ids) {
                        const toRemove = updated.find(
                            (m) => m.id === deletedId,
                        );
                        if (toRemove) {
                            toRemove.marker.remove();
                        }
                    }
                    updated = updated.filter(
                        (m) => !data.deleted_marker_ids.includes(m.id),
                    );

                    return updated;
                });
            }

            // ── Routes ───────────────────────────────────────────────────────────
            if (data.routes.length > 0 || data.deleted_route_ids.length > 0) {
                setRoutes((prev) => {
                    // Check for conflict on expanded routes
                    for (const syncedRoute of data.routes) {
                        if (expandedRoutes.has(syncedRoute.id)) {
                            toast.warning(
                                t(
                                    'sync.conflict.route',
                                    'Another user has modified a route you have open.',
                                ),
                            );
                            break;
                        }
                    }

                    const updatedMap = new Map(
                        prev.map((r) => [r.id, r] as [number, Route]),
                    );
                    for (const syncedRoute of data.routes) {
                        updatedMap.set(syncedRoute.id, syncedRoute);
                    }
                    for (const deletedId of data.deleted_route_ids) {
                        updatedMap.delete(deletedId);
                    }

                    return Array.from(updatedMap.values());
                });
            }

            // ── Tours ────────────────────────────────────────────────────────────
            if (data.tours.length > 0 || data.deleted_tour_ids.length > 0) {
                const updatedMap = new Map(
                    tours.map((t) => [t.id, t] as [number, Tour]),
                );
                for (const syncedTour of data.tours) {
                    updatedMap.set(syncedTour.id, syncedTour);
                }
                for (const deletedId of data.deleted_tour_ids) {
                    updatedMap.delete(deletedId);
                }
                onToursUpdate(Array.from(updatedMap.values()));
            }
        },
        [
            setMarkers,
            setRoutes,
            onToursUpdate,
            tours,
            selectedMarkerId,
            expandedRoutes,
            onAddMarker,
            t,
        ],
    );

    useEffect(() => {
        if (!selectedTripId || !hasCollaborators) return;

        const poll = async () => {
            // Skip if tab is hidden
            if (document.visibilityState === 'hidden') return;
            // Skip if a sync is already in progress
            if (isSyncingRef.current) return;

            isSyncingRef.current = true;
            const since = lastSyncedAtRef.current;

            try {
                // Record the time before the request so we don't miss items
                // created/updated while the request is in flight
                const requestedAt = new Date().toISOString();

                const response = await axios.get<SyncResponse>(
                    `/trips/${selectedTripId}/sync`,
                    { params: { since } },
                );

                applySync(response.data);
                lastSyncedAtRef.current = requestedAt;
            } catch (error) {
                console.error('[useSync] polling error:', error);
            } finally {
                isSyncingRef.current = false;
            }
        };

        const intervalId = setInterval(poll, SYNC_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [selectedTripId, hasCollaborators, applySync]);
}
