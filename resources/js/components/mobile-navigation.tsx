import { MobilePanelType } from '@/hooks/use-mobile-panels';
import { cn } from '@/lib/utils';
import { Bot, List, Map as MapIcon, Route as RouteIcon } from 'lucide-react';

interface MobileNavigationProps {
    activePanel: MobilePanelType;
    onPanelChange: (panel: Exclude<MobilePanelType, null>) => void;
}

interface NavItem {
    id: Exclude<MobilePanelType, null>;
    icon: typeof List;
    label: string;
}

const navItems: NavItem[] = [
    { id: 'markers', icon: List, label: 'Markers' },
    { id: 'tours', icon: MapIcon, label: 'Tours' },
    { id: 'routes', icon: RouteIcon, label: 'Routes' },
    { id: 'ai', icon: Bot, label: 'AI' },
];

/**
 * MobileNavigation - Bottom navigation bar for mobile view (Phase 3)
 *
 * Features:
 * - Fixed at bottom of screen
 * - Icons for each panel type
 * - Active state styling
 * - Touch-friendly sizing
 */
export function MobileNavigation({
    activePanel,
    onPanelChange,
}: MobileNavigationProps) {
    return (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex items-center justify-around">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePanel === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onPanelChange(item.id)}
                            className={cn(
                                'flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors',
                                'hover:bg-accent/50',
                                isActive
                                    ? 'text-primary'
                                    : 'text-muted-foreground',
                            )}
                        >
                            <Icon
                                className={cn(
                                    'h-6 w-6',
                                    isActive && 'fill-current',
                                )}
                            />
                            <span className="text-xs font-medium">
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
