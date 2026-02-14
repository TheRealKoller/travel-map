import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface TabButtonProps {
    icon: LucideIcon;
    label: string;
    isActive: boolean;
    onClick: () => void;
    position: 'left' | 'right';
    className?: string;
}

/**
 * TabButton Component
 *
 * A vertical tab button that floats on the edge of the screen.
 * Used to trigger floating panels in desktop view.
 *
 * Features:
 * - Icon + label display
 * - Active state styling
 * - Position-aware (left/right side)
 * - Hover effects
 */
export function TabButton({
    icon: Icon,
    label,
    isActive,
    onClick,
    position,
    className,
}: TabButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                // Base styles
                'group flex items-center gap-2 px-3 py-2.5',
                'transition-all duration-200 ease-in-out',
                'text-sm font-medium',

                // Border and background
                'border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80',

                // Position-specific border radius
                position === 'left'
                    ? 'rounded-r-lg border-l-0'
                    : 'rounded-l-lg border-r-0',

                // Active state
                isActive
                    ? 'border-primary text-primary shadow-md'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:bg-accent/50 hover:text-foreground',

                // Active click effect
                'active:scale-95',

                // Hover effects
                'hover:shadow-md',

                // Focus styles
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',

                className,
            )}
            aria-pressed={isActive}
            aria-label={label}
        >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">{label}</span>
        </button>
    );
}
