import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface MapOptionsMenuProps {
    isSearchMode: boolean;
    onSearchModeChange: (enabled: boolean) => void;
    searchCoordinates: { lat: number; lng: number } | null;
}

export default function MapOptionsMenu({
    isSearchMode,
    onSearchModeChange,
    searchCoordinates,
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
                                    <div className="flex items-center justify-between">
                                        <Label
                                            htmlFor="search-mode"
                                            className="cursor-pointer"
                                        >
                                            Suchmodus:{' '}
                                            {isSearchMode ? 'On' : 'Off'}
                                        </Label>
                                        <Switch
                                            id="search-mode"
                                            checked={isSearchMode}
                                            onCheckedChange={onSearchModeChange}
                                            aria-label="Radius search mode toggle"
                                        />
                                    </div>
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
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CollapsibleContent>
                </div>
            </Collapsible>
        </div>
    );
}
