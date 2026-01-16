import {
    createMarkerElement,
    getMarkerTypeFromMapboxClass,
} from '@/lib/marker-utils';
import { MarkerData, MarkerType } from '@/types/marker';
import mapboxgl, {
    FeatureSelector,
    GeoJSONFeature,
    TargetFeature,
} from 'mapbox-gl';
import { useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface UseMapInteractionsOptions {
    mapInstance: mapboxgl.Map | null;
    isSearchModeRef: React.MutableRefObject<boolean>;
    onMarkerCreated: (marker: MarkerData) => void;
    onMarkerSelected: (markerId: string) => void;
}

export function useMapInteractions({
    mapInstance,
    isSearchModeRef,
    onMarkerCreated,
    onMarkerSelected,
}: UseMapInteractionsOptions) {
    useEffect(() => {
        if (!mapInstance) return;

        let hoveredPlace:
            | TargetFeature
            | FeatureSelector
            | GeoJSONFeature
            | null
            | undefined = null;

        // POI interactions
        mapInstance.addInteraction('poi-click', {
            type: 'click',
            target: { featuresetId: 'poi', importId: 'basemap' },
            handler: ({ feature, lngLat, preventDefault }) => {
                console.log('POI clicked:', feature);
                preventDefault();

                if (!feature || !lngLat) return;

                // Extract information from the feature
                const vectorTileProps =
                    (
                        feature as unknown as {
                            _vectorTileFeature?: {
                                properties?: Record<string, unknown>;
                            };
                        }
                    )._vectorTileFeature?.properties || {};
                const properties = {
                    ...feature.properties,
                    ...vectorTileProps,
                };
                const name =
                    '' +
                    (properties.name_de ||
                        properties.name_en ||
                        properties.name ||
                        'POI');
                const mapboxClass = '' + (properties.class || properties.type);
                const markerType = getMarkerTypeFromMapboxClass(mapboxClass);

                const [lng, lat] = [lngLat.lng, lngLat.lat];
                const markerEl = createMarkerElement(markerType);

                const newMarker = new mapboxgl.Marker(markerEl)
                    .setLngLat([lng, lat])
                    .addTo(mapInstance);

                const markerId = uuidv4();
                const markerData: MarkerData = {
                    id: markerId,
                    lat: lat,
                    lng: lng,
                    name: name,
                    type: markerType,
                    notes: '',
                    url: '',
                    isUnesco: false,
                    aiEnriched: false,
                    marker: newMarker,
                    isSaved: false,
                };

                const popup = new mapboxgl.Popup({ offset: 25 }).setText(name);
                newMarker.setPopup(popup);

                markerEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    onMarkerSelected(markerId);
                });

                onMarkerCreated(markerData);
                onMarkerSelected(markerId);
            },
        });

        mapInstance.addInteraction('poi-mouseenter', {
            type: 'mouseenter',
            target: { featuresetId: 'poi', importId: 'basemap' },
            handler: () => {
                mapInstance.getCanvas().style.cursor = 'pointer';
            },
        });

        mapInstance.addInteraction('poi-mouseleave', {
            type: 'mouseleave',
            target: { featuresetId: 'poi', importId: 'basemap' },
            handler: () => {
                if (isSearchModeRef.current) {
                    mapInstance.getCanvas().style.cursor = 'zoom-in';
                } else {
                    mapInstance.getCanvas().style.cursor = 'crosshair';
                }
                return false;
            },
        });

        // Place labels interactions
        mapInstance.addInteraction('place-labels-click', {
            type: 'click',
            target: { featuresetId: 'place-labels', importId: 'basemap' },
            handler: ({ feature, lngLat, preventDefault }) => {
                console.log('place-labels clicked:', feature);
                preventDefault();

                if (!feature || !lngLat) return;

                const vectorTileProps =
                    (
                        feature as unknown as {
                            _vectorTileFeature?: {
                                properties?: Record<string, unknown>;
                            };
                        }
                    )._vectorTileFeature?.properties || {};
                const properties = {
                    ...feature.properties,
                    ...vectorTileProps,
                };
                const name =
                    '' +
                    (properties.name_de ||
                        properties.name_en ||
                        properties.name ||
                        'Place');

                let markerType = MarkerType.PointOfInterest;
                const placeClass = '' + properties.class;
                if (placeClass === 'city') {
                    markerType = MarkerType.City;
                } else if (placeClass === 'town' || placeClass === 'village') {
                    markerType = MarkerType.Village;
                }

                const [lng, lat] = [lngLat.lng, lngLat.lat];
                const markerEl = createMarkerElement(markerType);

                const newMarker = new mapboxgl.Marker(markerEl)
                    .setLngLat([lng, lat])
                    .addTo(mapInstance);

                const markerId = uuidv4();
                const markerData: MarkerData = {
                    id: markerId,
                    lat: lat,
                    lng: lng,
                    name: name,
                    type: markerType,
                    notes: '',
                    url: '',
                    isUnesco: false,
                    aiEnriched: false,
                    marker: newMarker,
                    isSaved: false,
                };

                const popup = new mapboxgl.Popup({ offset: 25 }).setText(name);
                newMarker.setPopup(popup);

                markerEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    onMarkerSelected(markerId);
                });

                onMarkerCreated(markerData);
                onMarkerSelected(markerId);
            },
        });

        mapInstance.addInteraction('place-labels-mouseenter', {
            type: 'mouseenter',
            target: { featuresetId: 'place-labels', importId: 'basemap' },
            handler: ({ feature }) => {
                if (feature == undefined) return;
                if (hoveredPlace && hoveredPlace.id === feature.id) return;

                if (hoveredPlace) {
                    mapInstance.setFeatureState(hoveredPlace, {
                        highlight: false,
                    });
                }

                hoveredPlace = feature;
                mapInstance.setFeatureState(feature, { highlight: true });
                mapInstance.getCanvas().style.cursor = 'pointer';
            },
        });

        mapInstance.addInteraction('place-labels-mouseleave', {
            type: 'mouseleave',
            target: { featuresetId: 'place-labels', importId: 'basemap' },
            handler: () => {
                if (hoveredPlace) {
                    mapInstance.setFeatureState(hoveredPlace, {
                        highlight: false,
                    });
                    hoveredPlace = null;
                }
                if (isSearchModeRef.current) {
                    mapInstance.getCanvas().style.cursor = 'zoom-in';
                } else {
                    mapInstance.getCanvas().style.cursor = 'crosshair';
                }
                return false;
            },
        });

        // Landmark icons interactions
        mapInstance.addInteraction('landmark-icons-click', {
            type: 'click',
            target: { featuresetId: 'landmark-icons', importId: 'basemap' },
            handler: ({ feature, lngLat, preventDefault }) => {
                console.log('landmark-icons clicked:', feature);
                preventDefault();

                if (!feature || !lngLat) return;

                const vectorTileProps =
                    (
                        feature as unknown as {
                            _vectorTileFeature?: {
                                properties?: Record<string, unknown>;
                            };
                        }
                    )._vectorTileFeature?.properties || {};
                const properties = {
                    ...feature.properties,
                    ...vectorTileProps,
                };
                const name =
                    '' +
                    (properties.name_de ||
                        properties.name_en ||
                        properties.name ||
                        'Landmark');
                const mapboxClass = '' + (properties.class || properties.type);
                const markerType = getMarkerTypeFromMapboxClass(mapboxClass);

                const [lng, lat] = [lngLat.lng, lngLat.lat];
                const markerEl = createMarkerElement(markerType);

                const newMarker = new mapboxgl.Marker(markerEl)
                    .setLngLat([lng, lat])
                    .addTo(mapInstance);

                const markerId = uuidv4();
                const markerData: MarkerData = {
                    id: markerId,
                    lat: lat,
                    lng: lng,
                    name: name,
                    type: markerType,
                    notes: '',
                    url: '',
                    isUnesco: false,
                    aiEnriched: false,
                    marker: newMarker,
                    isSaved: false,
                };

                const popup = new mapboxgl.Popup({ offset: 25 }).setText(name);
                newMarker.setPopup(popup);

                markerEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    onMarkerSelected(markerId);
                });

                onMarkerCreated(markerData);
                onMarkerSelected(markerId);
            },
        });

        mapInstance.addInteraction('landmark-icons-mouseenter', {
            type: 'mouseenter',
            target: { featuresetId: 'landmark-icons', importId: 'basemap' },
            handler: () => {
                mapInstance.getCanvas().style.cursor = 'pointer';
            },
        });

        mapInstance.addInteraction('landmark-icons-mouseleave', {
            type: 'mouseleave',
            target: { featuresetId: 'landmark-icons', importId: 'basemap' },
            handler: () => {
                if (isSearchModeRef.current) {
                    mapInstance.getCanvas().style.cursor = 'zoom-in';
                } else {
                    mapInstance.getCanvas().style.cursor = 'crosshair';
                }
                return false;
            },
        });

        // Handle clicks on empty map areas (not on POIs or markers)
        const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
            // Check if any POI, place-label or landmark features were clicked
            const features = mapInstance.queryRenderedFeatures(e.point);
            const hasInteractiveFeature = features.some((f) => {
                const feat = f as TargetFeature;
                const target = feat.target as { featuresetId?: string };
                return (
                    target?.featuresetId === 'poi' ||
                    target?.featuresetId === 'place_label' ||
                    target?.featuresetId === 'landmark'
                );
            });

            if (hasInteractiveFeature) {
                return;
            }

            // Create a marker at the clicked location
            const defaultType = MarkerType.PointOfInterest;
            const markerEl = createMarkerElement(defaultType);

            const marker = new mapboxgl.Marker(markerEl)
                .setLngLat(e.lngLat)
                .addTo(mapInstance);

            const markerId = uuidv4();
            const markerData: MarkerData = {
                id: markerId,
                lat: e.lngLat.lat,
                lng: e.lngLat.lng,
                name: '',
                type: defaultType,
                notes: '',
                url: '',
                isUnesco: false,
                aiEnriched: false,
                marker: marker,
                isSaved: false,
            };

            const popup = new mapboxgl.Popup({ offset: 25 }).setText(
                'New Location',
            );
            marker.setPopup(popup);

            markerEl.addEventListener('click', (clickEvent) => {
                clickEvent.stopPropagation();
                onMarkerSelected(markerId);
            });

            onMarkerCreated(markerData);
            onMarkerSelected(markerId);
        };

        mapInstance.on('click', handleMapClick);

        // Cleanup function
        return () => {
            mapInstance.off('click', handleMapClick);
        };
    }, [mapInstance, isSearchModeRef, onMarkerCreated, onMarkerSelected]);
}
