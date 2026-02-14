import { SidebarTrigger } from '@/components/ui/sidebar';
import { useLanguage } from '@/hooks/use-language';
import { SearchBoxRetrieveResponse } from '@mapbox/search-js-core';
import { SearchBox } from '@mapbox/search-js-react';
import mapboxgl from 'mapbox-gl';
import { useMemo } from 'react';

interface ToolbarProps {
    onSearchResult: (result: SearchBoxRetrieveResponse) => void;
    countries?: string[];
    bbox?: [number, number, number, number];
}

/**
 * Toolbar component positioned at the top of the map
 * Contains search functionality and navigation toggle
 */
export function Toolbar({ onSearchResult, countries, bbox }: ToolbarProps) {
    const { language } = useLanguage();

    // Validate and memoize bbox to avoid unnecessary re-renders
    const validatedBbox = useMemo(() => {
        if (bbox && bbox.every((val) => isFinite(val))) {
            return bbox;
        }
        return undefined;
    }, [bbox]);

    // Memoize language configuration with English as fallback
    const languageConfig = useMemo(() => {
        return language === 'de' ? 'de,en' : 'en';
    }, [language]);

    const accessToken = mapboxgl.accessToken || '';

    return (
        <div
            className="fixed top-0 right-0 left-0 z-30 flex items-center gap-4 bg-white/80 p-4 shadow-sm backdrop-blur-md dark:bg-gray-900/80"
            data-testid="map-toolbar"
        >
            {/* Navigation/Menu Toggle */}
            <div className="flex items-center">
                <SidebarTrigger
                    className="h-10 w-10"
                    data-testid="sidebar-trigger"
                />
            </div>

            {/* Search Box */}
            {accessToken && (
                <div className="max-w-md flex-1">
                    <SearchBox
                        accessToken={accessToken}
                        options={{
                            language: languageConfig,
                            bbox: validatedBbox,
                            country: countries?.join(','),
                        }}
                        placeholder="Search for places..."
                        onRetrieve={onSearchResult}
                        theme={{
                            variables: {
                                fontFamily: 'inherit',
                                unit: '14px',
                                borderRadius: '8px',
                            },
                        }}
                    />
                </div>
            )}
        </div>
    );
}
