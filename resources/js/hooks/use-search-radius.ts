import { useEffect, useRef, useState } from 'react';

export function useSearchRadius(initialRadius: number = 5) {
    const [searchRadius, setSearchRadius] = useState<number>(initialRadius);
    const searchRadiusRef = useRef<number>(initialRadius);

    // Update search radius ref when radius changes
    useEffect(() => {
        searchRadiusRef.current = searchRadius;
    }, [searchRadius]);

    return {
        searchRadius,
        setSearchRadius,
        searchRadiusRef,
    } as const;
}
