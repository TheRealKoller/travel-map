import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { ReactNode, useState } from 'react';

interface DraggableSheetProps {
    onClose: () => void;
    title: string;
    children: ReactNode;
    snapPoints?: number[]; // Percentages of viewport height (e.g., [0.3, 0.6, 0.9])
    initialSnapPoint?: number; // Index of initial snap point
}

/**
 * DraggableSheet - Mobile bottom sheet component with drag gestures
 *
 * Features:
 * - Draggable handle for easy interaction
 * - Snap points for different heights
 * - Swipe down to close
 * - Smooth animations
 * - Semi-transparent overlay
 */
export function DraggableSheet({
    onClose,
    title,
    children,
    snapPoints = [0.5, 0.9], // Default: 50% and 90% of viewport
    initialSnapPoint = 0,
}: DraggableSheetProps) {
    const [currentSnapIndex, setCurrentSnapIndex] = useState(initialSnapPoint);
    const [isDragging, setIsDragging] = useState(false);

    // Get viewport height
    const getViewportHeight = () => {
        return typeof window !== 'undefined' ? window.innerHeight : 800;
    };

    // Calculate pixel position from snap point percentage
    const getSnapPosition = (index: number) => {
        const vh = getViewportHeight();
        const percentage = snapPoints[index];
        return vh * (1 - percentage);
    };

    // Handle drag end - snap to nearest snap point or close
    const handleDragEnd = (
        event: MouseEvent | TouchEvent | PointerEvent,
        info: PanInfo,
    ) => {
        setIsDragging(false);
        const vh = getViewportHeight();
        const currentY = info.point.y;
        const velocity = info.velocity.y;

        // If dragged down quickly or past 80% of screen, close
        if (velocity > 500 || currentY > vh * 0.8) {
            onClose();
            return;
        }

        // Find nearest snap point
        let nearestSnapIndex = 0;
        let minDistance = Infinity;

        snapPoints.forEach((_, index) => {
            const snapY = getSnapPosition(index);
            const distance = Math.abs(currentY - snapY);
            if (distance < minDistance) {
                minDistance = distance;
                nearestSnapIndex = index;
            }
        });

        setCurrentSnapIndex(nearestSnapIndex);
    };

    const vh = getViewportHeight();
    const snapY = getSnapPosition(currentSnapIndex);

    // Calculate the actual height of the sheet based on current snap position.
    // This ensures the content area matches the visible portion of the sheet,
    // preventing scroll issues where content extends beyond the viewport.
    // Example: At 70% snap on 844px screen: snapY=253px, sheetHeight=591px
    const sheetHeight = vh - snapY;

    return (
        <>
            {/* Overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black"
                onClick={onClose}
                data-testid="sheet-backdrop"
                aria-hidden="true"
                style={{ willChange: 'opacity' }}
            />

            {/* Draggable Sheet */}
            <motion.div
                drag="y"
                dragConstraints={{
                    top: getSnapPosition(snapPoints.length - 1),
                    bottom: vh,
                }}
                dragElastic={0.1}
                dragMomentum={false}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                initial={{ y: vh }}
                animate={{ y: snapY }}
                exit={{ y: vh }}
                transition={{
                    type: 'spring',
                    damping: 30,
                    stiffness: 300,
                }}
                className={cn(
                    'fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-white shadow-lg dark:bg-gray-900',
                    'overflow-hidden',
                )}
                style={{
                    top: 0,
                    // Use calculated height instead of 100vh to match visible area
                    // This prevents bottom content from being cut off during scroll
                    height: `${sheetHeight}px`,
                    willChange: 'transform',
                }}
                data-testid="draggable-sheet"
                role="dialog"
                aria-label={title}
            >
                {/* Drag Handle */}
                <div
                    className="flex w-full cursor-grab items-center justify-center py-3 active:cursor-grabbing"
                    data-testid="drag-handle"
                    role="button"
                    tabIndex={0}
                    aria-label="Drag to adjust sheet position"
                >
                    <div
                        className="h-1.5 w-12 rounded-full bg-muted-foreground/30"
                        aria-hidden="true"
                    />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-4 pb-3 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {title}
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8"
                        data-testid="close-button"
                        aria-label={`Close ${title} panel`}
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                </div>

                {/* Content */}
                <div
                    className={cn(
                        'flex-1 overflow-y-auto',
                        isDragging && 'pointer-events-none',
                    )}
                >
                    {children}
                </div>
            </motion.div>
        </>
    );
}
