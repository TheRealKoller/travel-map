import { Button } from '@/components/ui/button';
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
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface PlaceType {
    value: string;
    label: string;
}

interface MapOptionsMenuProps {
    isSearchMode: boolean;
    onSearchModeChange: (enabled: boolean) => void;
    searchCoordinates: { lat: number; lng: number } | null;
    searchRadius: number;
    onSearchRadiusChange: (radius: number) => void;
    searchResultCount: number | null;
    isSearching: boolean;
    searchError: string | null;
    placeTypes: PlaceType[];
    selectedPlaceType: string;
    onPlaceTypeChange: (placeType: string) => void;
}

export default function MapOptionsMenu({
    isSearchMode,
    onSearchModeChange,
    searchCoordinates,
    searchRadius,
    onSearchRadiusChange,
    searchResultCount,
    isSearching,
    searchError,
    placeTypes,
    selectedPlaceType,
    onPlaceTypeChange,
}: MapOptionsMenuProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="absolute top-[60px] right-4 z-[1000]">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <div className="flex flex-col rounded-lg border bg-white shadow-lg">
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex w-full items-center justify-between gap-2 px-4 py-3"
                        >
                            <span className="font-medium">Optionen</span>
                            {isOpen ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent
                        className="flex flex-col border-t"
                        style={{
                            maxHeight: isOpen ? 'calc(100vh - 220px)' : '0',
                        }}
                    >
                        <Tabs
                            defaultValue="radius-search"
                            className="flex h-full flex-col"
                        >
                            <TabsList className="m-2 justify-start">
                                <TabsTrigger value="radius-search">
                                    Umkreissuche
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent
                                value="radius-search"
                                className="flex-1 overflow-y-auto px-4 pb-3"
                            >
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <Label
                                            id="search-mode-label"
                                            className="text-sm font-medium"
                                        >
                                            Umkreissuche
                                        </Label>
                                        <Button
                                            id="search-mode"
                                            variant={
                                                isSearchMode
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            onClick={() =>
                                                onSearchModeChange(
                                                    !isSearchMode,
                                                )
                                            }
                                            aria-labelledby="search-mode-label"
                                            aria-pressed={isSearchMode}
                                            className="w-full"
                                        >
                                            {isSearchMode
                                                ? 'Aktiv - Klicke auf die Karte'
                                                : 'Umkreissuche aktivieren'}
                                        </Button>
                                    </div>
                                    {isSearchMode && (
                                        <>
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="place-type"
                                                    className="text-sm font-medium"
                                                >
                                                    Typ des Ortes
                                                </Label>
                                                <Select
                                                    value={selectedPlaceType}
                                                    onValueChange={
                                                        onPlaceTypeChange
                                                    }
                                                >
                                                    <SelectTrigger
                                                        id="place-type"
                                                        className="w-full"
                                                    >
                                                        <SelectValue placeholder="Typ auswählen" />
                                                    </SelectTrigger>
                                                    <SelectContent className="z-[1100]">
                                                        {placeTypes.map(
                                                            (type) => (
                                                                <SelectItem
                                                                    key={
                                                                        type.value
                                                                    }
                                                                    value={
                                                                        type.value
                                                                    }
                                                                >
                                                                    {type.label}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="search-radius"
                                                    className="text-sm font-medium"
                                                >
                                                    Suchradius: {searchRadius}{' '}
                                                    km
                                                </Label>
                                                <Slider
                                                    id="search-radius"
                                                    min={1}
                                                    max={100}
                                                    step={1}
                                                    value={[searchRadius]}
                                                    onValueChange={(values) =>
                                                        onSearchRadiusChange(
                                                            values[0],
                                                        )
                                                    }
                                                    className="w-full"
                                                    aria-label="Search radius in kilometers"
                                                />
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>1 km</span>
                                                    <span>100 km</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {searchCoordinates && (
                                        <div className="rounded-md bg-muted p-3">
                                            <p className="text-sm font-medium">
                                                Koordinaten:
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Lat:{' '}
                                                {searchCoordinates.lat.toFixed(
                                                    6,
                                                )}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Lng:{' '}
                                                {searchCoordinates.lng.toFixed(
                                                    6,
                                                )}
                                            </p>
                                        </div>
                                    )}
                                    {isSearching && (
                                        <div className="rounded-md bg-blue-50 p-3 text-center">
                                            <p className="text-sm text-blue-600">
                                                Suche läuft...
                                            </p>
                                        </div>
                                    )}
                                    {searchError && (
                                        <div className="rounded-md bg-red-50 p-3">
                                            <p className="text-sm font-medium text-red-600">
                                                Fehler:
                                            </p>
                                            <p className="text-sm text-red-500">
                                                {searchError}
                                            </p>
                                        </div>
                                    )}
                                    {!isSearching &&
                                        !searchError &&
                                        searchResultCount !== null && (
                                            <div className="rounded-md bg-green-50 p-3">
                                                <p className="text-sm font-medium text-green-800">
                                                    Ergebnisse gefunden:
                                                </p>
                                                <p className="text-lg font-bold text-green-600">
                                                    {searchResultCount}
                                                </p>
                                            </div>
                                        )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CollapsibleContent>
                </div>
            </Collapsible>
        </div>
    );
}
