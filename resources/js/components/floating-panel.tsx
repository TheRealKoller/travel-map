import { X } from 'lucide-react';
import { ReactNode } from 'react';
import { Button } from './ui/button';

export type PanelPosition = 'left' | 'right';

interface FloatingPanelProps {
    /** Unique identifier for the panel */
    id: string;
    /** Panel title displayed in header */
    title: string;
    /** Position of the panel (left or right side of screen) */
    position: PanelPosition;
    /** Whether the panel is currently open */
    isOpen: boolean;
    /** Callback when panel should be closed */
    onClose: () => void;
    /** Panel content */
    children: ReactNode;
    /** Optional custom width (defaults to 400px) */
    width?: number;
    /** Optional custom z-index */
    zIndex?: number;
}

/**
 * Floating Panel Component
 *
 * A reusable panel component that slides in from the left or right side of the screen.
 * Used for desktop layout to display markers, tours, routes, and AI output.
 *
 * Features:
 * - Smooth slide-in/out animations
 * - Configurable position (left/right)
 * - Semi-transparent background with backdrop blur
 * - Close button in header
 * - Scrollable content area
 */
export function FloatingPanel({
    id,
    title,
    position,
    isOpen,
    onClose,
    children,
    width = 400,
    zIndex = 20,
}: FloatingPanelProps) {
    // Calculate transform for slide animation
    const translateX = position === 'left' ? '-100%' : '100%';

    return (
        <div
            data-testid={`floating-panel-${id}`}
            role="complementary"
            aria-label={`${title} panel`}
            className={`fixed top-16 bottom-0 ${position === 'left' ? 'left-0' : 'right-0'} transition-transform duration-300 ease-in-out`}
            style={{
                width: `${width}px`,
                transform: isOpen
                    ? 'translateX(0)'
                    : `translateX(${translateX})`,
                zIndex,
                willChange: 'transform',
            }}
        >
            {/* Panel Container */}
            <div className="flex h-full flex-col bg-white/95 shadow-lg backdrop-blur-md dark:bg-gray-900/95">
                {/* Panel Header */}
                <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {title}
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8"
                        data-testid={`close-panel-${id}`}
                        aria-label={`Close ${title} panel`}
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-y-auto p-4">{children}</div>
            </div>
        </div>
    );
}
