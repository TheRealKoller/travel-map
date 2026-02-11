import { cn } from '@/lib/utils';
import { List, Map, Navigation } from 'lucide-react';

export type PanelType = 'markers' | 'tours' | 'routes';

interface MobileBottomNavigationProps {
    activePanel: PanelType;
    onPanelChange: (panel: PanelType) => void;
    className?: string;
}

export default function MobileBottomNavigation({
    activePanel,
    onPanelChange,
    className,
}: MobileBottomNavigationProps) {
    const panels: { value: PanelType; label: string; icon: typeof List }[] = [
        { value: 'markers', label: 'Markers', icon: Map },
        { value: 'tours', label: 'Tours', icon: List },
        { value: 'routes', label: 'Routes', icon: Navigation },
    ];

    return (
        <nav
            className={cn(
                'fixed right-0 bottom-0 left-0 z-50 border-t border-gray-200 bg-white shadow-lg md:hidden',
                className,
            )}
            data-testid="mobile-bottom-navigation"
        >
            <div className="flex h-16 items-center justify-around">
                {panels.map(({ value, label, icon: Icon }) => {
                    const isActive = activePanel === value;
                    return (
                        <button
                            key={value}
                            onClick={() => onPanelChange(value)}
                            className={cn(
                                'flex flex-1 flex-col items-center justify-center gap-1 px-3 py-2 transition-colors',
                                isActive
                                    ? 'text-blue-600'
                                    : 'text-gray-600 hover:text-gray-900',
                            )}
                            data-testid={`nav-${value}`}
                            aria-label={label}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <Icon
                                className={cn(
                                    'h-6 w-6',
                                    isActive && 'stroke-[2.5]',
                                )}
                            />
                            <span
                                className={cn(
                                    'text-xs',
                                    isActive ? 'font-semibold' : 'font-medium',
                                )}
                            >
                                {label}
                            </span>
                            {isActive && (
                                <div
                                    className="absolute bottom-0 h-1 w-12 rounded-t-full bg-blue-600"
                                    data-testid={`active-indicator-${value}`}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
