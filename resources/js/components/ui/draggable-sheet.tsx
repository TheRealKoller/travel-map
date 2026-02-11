import { cn } from '@/lib/utils';
import { GripHorizontal } from 'lucide-react';
import * as React from 'react';

type SnapPoint = 'closed' | 'peek' | 'half' | 'full';

interface DraggableSheetProps {
    children: React.ReactNode;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    snapPoint?: SnapPoint;
    onSnapPointChange?: (snapPoint: SnapPoint) => void;
    className?: string;
    title?: string;
    peekHeight?: number; // Height in px when peeking
    halfHeight?: number; // Height in % when half open
}

export function DraggableSheet({
    children,
    isOpen,
    onOpenChange,
    snapPoint = 'peek',
    onSnapPointChange,
    className,
    title,
    peekHeight = 60,
    halfHeight = 50,
}: DraggableSheetProps) {
    const sheetRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [startY, setStartY] = React.useState(0);
    const [currentHeight, setCurrentHeight] = React.useState(0);
    const [internalSnapPoint, setInternalSnapPoint] =
        React.useState<SnapPoint>(snapPoint);

    // Update internal snap point when prop changes
    React.useEffect(() => {
        setInternalSnapPoint(snapPoint);
    }, [snapPoint]);

    // Get height value for a snap point
    const getSnapPointHeight = React.useCallback(
        (point: SnapPoint): string => {
            const windowHeight = window.innerHeight;
            switch (point) {
                case 'closed':
                    return '0px';
                case 'peek':
                    return `${peekHeight}px`;
                case 'half':
                    return `${(windowHeight * halfHeight) / 100}px`;
                case 'full':
                    return `${windowHeight * 0.9}px`;
                default:
                    return '0px';
            }
        },
        [peekHeight, halfHeight],
    );

    const findClosestSnapPoint = React.useCallback(
        (height: number): SnapPoint => {
            const windowHeight = window.innerHeight;
            const points: { point: SnapPoint; height: number }[] = [
                { point: 'closed', height: 0 },
                { point: 'peek', height: peekHeight },
                { point: 'half', height: (windowHeight * halfHeight) / 100 },
                { point: 'full', height: windowHeight * 0.9 },
            ];

            let closest = points[0];
            let minDiff = Math.abs(height - closest.height);

            for (const point of points) {
                const diff = Math.abs(height - point.height);
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = point;
                }
            }

            return closest.point;
        },
        [peekHeight, halfHeight],
    );

    const handleTouchStart = (e: React.TouchEvent) => {
        if (!sheetRef.current) return;
        setIsDragging(true);
        setStartY(e.touches[0].clientY);
        setCurrentHeight(sheetRef.current.offsetHeight);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || !sheetRef.current) return;

        const deltaY = startY - e.touches[0].clientY;
        const newHeight = Math.max(
            0,
            Math.min(window.innerHeight * 0.9, currentHeight + deltaY),
        );

        sheetRef.current.style.height = `${newHeight}px`;
        sheetRef.current.style.transition = 'none';
    };

    const handleTouchEnd = () => {
        if (!isDragging || !sheetRef.current) return;

        setIsDragging(false);
        const currentHeightValue = sheetRef.current.offsetHeight;
        const closestPoint = findClosestSnapPoint(currentHeightValue);

        // Snap to closest point
        setInternalSnapPoint(closestPoint);
        onSnapPointChange?.(closestPoint);

        if (closestPoint === 'closed') {
            onOpenChange(false);
        } else if (!isOpen) {
            onOpenChange(true);
        }

        // Reset transition for smooth snap
        sheetRef.current.style.transition = '';
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!sheetRef.current) return;
        setIsDragging(true);
        setStartY(e.clientY);
        setCurrentHeight(sheetRef.current.offsetHeight);
    };

    const handleMouseMove = React.useCallback(
        (e: MouseEvent) => {
            if (!isDragging || !sheetRef.current) return;

            const deltaY = startY - e.clientY;
            const newHeight = Math.max(
                0,
                Math.min(window.innerHeight * 0.9, currentHeight + deltaY),
            );

            sheetRef.current.style.height = `${newHeight}px`;
            sheetRef.current.style.transition = 'none';
        },
        [isDragging, startY, currentHeight],
    );

    const handleMouseUp = React.useCallback(() => {
        if (!isDragging || !sheetRef.current) return;

        setIsDragging(false);
        const currentHeightValue = sheetRef.current.offsetHeight;
        const closestPoint = findClosestSnapPoint(currentHeightValue);

        // Snap to closest point
        setInternalSnapPoint(closestPoint);
        onSnapPointChange?.(closestPoint);

        if (closestPoint === 'closed') {
            onOpenChange(false);
        } else if (!isOpen) {
            onOpenChange(true);
        }

        // Reset transition for smooth snap
        sheetRef.current.style.transition = '';
    }, [isDragging, onOpenChange, onSnapPointChange, isOpen, findClosestSnapPoint]);

    React.useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    if (!isOpen && internalSnapPoint === 'closed') {
        return null;
    }

    return (
        <>
            {/* Backdrop */}
            {isOpen && internalSnapPoint !== 'peek' && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 md:hidden"
                    onClick={() => {
                        setInternalSnapPoint('peek');
                        onSnapPointChange?.('peek');
                    }}
                    data-testid="sheet-backdrop"
                />
            )}

            {/* Sheet */}
            <div
                ref={sheetRef}
                className={cn(
                    'fixed right-0 bottom-0 left-0 z-50 flex flex-col rounded-t-2xl bg-white shadow-2xl transition-all duration-300 ease-out md:hidden',
                    className,
                )}
                style={{
                    height: getSnapPointHeight(internalSnapPoint),
                }}
                data-testid="draggable-sheet"
            >
                {/* Drag Handle */}
                <div
                    className="flex cursor-grab flex-col items-center py-3 active:cursor-grabbing"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleMouseDown}
                    data-testid="drag-handle"
                >
                    <div className="h-1.5 w-12 rounded-full bg-gray-300" />
                    {title && internalSnapPoint === 'peek' && (
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">
                            {title}
                        </h3>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    {children}
                </div>
            </div>
        </>
    );
}

export function DragHandle() {
    return (
        <div
            className="flex items-center justify-center py-2"
            data-testid="drag-handle-icon"
        >
            <GripHorizontal className="h-5 w-5 text-gray-400" />
        </div>
    );
}
