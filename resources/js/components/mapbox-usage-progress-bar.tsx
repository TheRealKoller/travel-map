import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { useEffect, useState } from 'react';

interface MapboxUsageStats {
    period: string;
    count: number;
    limit: number;
    remaining: number;
}

export function MapboxUsageProgressBar() {
    const [stats, setStats] = useState<MapboxUsageStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUsageStats = async () => {
            try {
                const response = await axios.get('/mapbox/usage');
                setStats(response.data);
            } catch (error) {
                console.error('Failed to fetch Mapbox usage stats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsageStats();
        // Refresh stats every 30 seconds
        const interval = setInterval(fetchUsageStats, 30000);

        return () => clearInterval(interval);
    }, []);

    if (isLoading || !stats) {
        return null;
    }

    const percentageUsed = (stats.count / stats.limit) * 100;
    const percentageRemaining =
        ((stats.limit - stats.count) / stats.limit) * 100;

    // Determine color based on remaining percentage
    const getColorClass = () => {
        if (percentageRemaining <= 10) {
            return 'bg-red-500';
        }
        if (percentageRemaining <= 30) {
            return 'bg-yellow-500';
        }
        return 'bg-green-500';
    };

    return (
        <div
            className="absolute top-4 right-4 left-4 z-20 rounded-lg bg-background/95 p-3 shadow-md backdrop-blur-sm"
            data-testid="mapbox-usage-progress-bar"
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Mapbox API usage</span>
                        <span data-testid="mapbox-usage-stats">
                            {stats.count.toLocaleString()} /{' '}
                            {stats.limit.toLocaleString()}
                        </span>
                    </div>
                    <Progress
                        value={percentageUsed}
                        className="h-2"
                        indicatorClassName={cn(getColorClass())}
                        data-testid="mapbox-usage-progress"
                    />
                </div>
            </div>
        </div>
    );
}
