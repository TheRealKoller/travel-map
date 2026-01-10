import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tour } from '@/types/tour';
import { Plus } from 'lucide-react';

interface TourTabsProps {
    tours: Tour[];
    selectedTourId: number | null;
    onSelectTour: (tourId: number | null) => void;
    onCreateTour: () => void;
    children: React.ReactNode;
}

export default function TourTabs({
    tours,
    selectedTourId,
    onSelectTour,
    onCreateTour,
    children,
}: TourTabsProps) {
    const handleTabChange = (value: string) => {
        if (value === 'all') {
            onSelectTour(null);
        } else if (value === 'create') {
            onCreateTour();
        } else {
            onSelectTour(parseInt(value));
        }
    };

    return (
        <Tabs
            value={selectedTourId === null ? 'all' : selectedTourId.toString()}
            onValueChange={handleTabChange}
            className="w-full"
        >
            <TabsList className="mb-3 flex w-full justify-start overflow-x-auto">
                <TabsTrigger value="all" data-testid="tour-tab-all-markers">
                    All markers
                </TabsTrigger>
                {tours.map((tour) => (
                    <TabsTrigger
                        key={tour.id}
                        value={tour.id.toString()}
                        data-testid="tour-tab"
                    >
                        {tour.name}
                    </TabsTrigger>
                ))}
                <TabsTrigger
                    value="create"
                    className="ml-2"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.preventDefault();
                        onCreateTour();
                    }}
                    data-testid="tour-tab-create-new"
                >
                    <Plus className="h-4 w-4" />
                </TabsTrigger>
            </TabsList>
            <TabsContent value="all">{children}</TabsContent>
            {tours.map((tour) => (
                <TabsContent key={tour.id} value={tour.id.toString()}>
                    {children}
                </TabsContent>
            ))}
        </Tabs>
    );
}
