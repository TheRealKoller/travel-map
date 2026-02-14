import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Slider } from '@/components/ui/slider';
import { useLanguage } from '@/hooks/use-language';
import { SearchBoxRetrieveResponse } from '@mapbox/search-js-core';
import { SearchBox } from '@mapbox/search-js-react';
import { Settings } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import { useMemo, useState } from 'react';

interface PlaceType {
    value: string;
    label: string;
}

interface ToolbarProps {
    onSearchResult: (result: SearchBoxRetrieveResponse) => void;
    countries?: string[];
    bbox?: [number, number, number, number];
    // Radius search props
    isSearchMode?: boolean;
    onSearchModeChange?: (enabled: boolean) => void;
    searchRadius?: number;
    onSearchRadiusChange?: (radius: number) => void;
    placeTypes?: PlaceType[];
    selectedPlaceType?: string;
    onPlaceTypeChange?: (placeType: string) => void;
}

/**
 * Toolbar component positioned at the top of the map
 * Contains search functionality, navigation toggle, and radius search options
 */
export function Toolbar({
    onSearchResult,
    countries,
    bbox,
    isSearchMode = false,
    onSearchModeChange,
    searchRadius = 10,
    onSearchRadiusChange,
    placeTypes = [],
    selectedPlaceType = '',
    onPlaceTypeChange,
}: ToolbarProps) {
    const { language } = useLanguage();
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);

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

            {/* Options Button for Radius Search */}
            {onSearchModeChange &&
                onSearchRadiusChange &&
                onPlaceTypeChange && (
                    <DropdownMenu
                        open={isOptionsOpen}
                        onOpenChange={setIsOptionsOpen}
                    >
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant={isSearchMode ? 'default' : 'outline'}
                                size="icon"
                                className="h-10 w-10"
                                title="Suchoptionen"
                            >
                                <Settings className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-80" align="end">
                            <div className="space-y-4 p-4">
                                <div className="space-y-2">
                                    <DropdownMenuLabel className="p-0">
                                        Umkreissuche
                                    </DropdownMenuLabel>
                                    <p className="text-sm text-muted-foreground">
                                        Klicke auf die Karte, um Orte in der
                                        Nähe zu finden
                                    </p>
                                </div>

                                <DropdownMenuSeparator />

                                {/* Search Mode Toggle */}
                                <div className="space-y-2">
                                    <Button
                                        variant={
                                            isSearchMode ? 'default' : 'outline'
                                        }
                                        onClick={() =>
                                            onSearchModeChange(!isSearchMode)
                                        }
                                        className="w-full"
                                    >
                                        {isSearchMode
                                            ? 'Aktiv - Klicke auf die Karte'
                                            : 'Umkreissuche aktivieren'}
                                    </Button>
                                </div>

                                {/* Place Type Selector */}
                                {placeTypes.length > 0 && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Typ des Ortes
                                        </label>
                                        <Select
                                            value={selectedPlaceType}
                                            onValueChange={onPlaceTypeChange}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Typ auswählen" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {placeTypes.map((type) => (
                                                    <SelectItem
                                                        key={type.value}
                                                        value={type.value}
                                                    >
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Search Radius Slider */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium">
                                            Suchradius
                                        </label>
                                        <span className="text-sm text-muted-foreground">
                                            {searchRadius} km
                                        </span>
                                    </div>
                                    <Slider
                                        min={1}
                                        max={100}
                                        step={1}
                                        value={[searchRadius]}
                                        onValueChange={(values) =>
                                            onSearchRadiusChange(values[0])
                                        }
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>1 km</span>
                                        <span>100 km</span>
                                    </div>
                                </div>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
        </div>
    );
}
