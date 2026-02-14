import { cn } from '@/lib/utils';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { X } from 'lucide-react';
import { ReactNode, useEffect, useRef, useState } from 'react';

interface DraggableSheetProps {
    isOpen: boolean;
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
    isOpen,
    onClose,
    title,
    children,
    snapPoints = [0.5, 0.9], // Default: 50% and 90% of viewport
    initialSnapPoint = 0,
}: DraggableSheetProps) {
    const controls = useAnimation();
    const sheetRef = useRef<HTMLDivElement>(null);
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

    // Open/close animation
    useEffect(() => {
        if (isOpen) {
            controls.start({
                y: getSnapPosition(currentSnapIndex),
                transition: { type: 'spring', damping: 30, stiffness: 300 },
            });
        } else {
            controls.start({
                y: getViewportHeight(),
                transition: { type: 'spring', damping: 30, stiffness: 300 },
            });
        }
    }, [isOpen, currentSnapIndex, controls]);

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
        controls.start({
            y: getSnapPosition(nearestSnapIndex),
            transition: { type: 'spring', damping: 30, stiffness: 300 },
        });
    };

    if (!isOpen) return null;

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
            />

            {/* Draggable Sheet */}
            <motion.div
                ref={sheetRef}
                drag="y"
                dragConstraints={{
                    top: getSnapPosition(snapPoints.length - 1),
                    bottom: getViewportHeight(),
                }}
                dragElastic={0.1}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                animate={controls}
                initial={{ y: getViewportHeight() }}
                className={cn(
                    'fixed inset-x-0 z-40 flex flex-col rounded-t-2xl bg-background shadow-lg',
                    'max-h-[95vh]',
                )}
                style={{
                    touchAction: 'none',
                    top: 0,
                }}
            >
                {/* Drag Handle */}
                <div className="flex w-full cursor-grab items-center justify-center py-3 active:cursor-grabbing">
                    <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 pb-3">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button
                        onClick={onClose}
                        className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
                    >
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close</span>
                    </button>
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
