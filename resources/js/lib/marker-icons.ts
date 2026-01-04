import { MarkerType } from '@/types/marker';
import {
    Building,
    Building2,
    Church,
    Eye,
    HelpCircle,
    Hotel,
    Landmark,
    Lightbulb,
    type LucideIcon,
    MapPin,
    Mountain,
    Palmtree,
    PartyPopper,
    Utensils,
} from 'lucide-react';

/**
 * Map MarkerType enum values to lucide-react icon components
 */
export const markerTypeIcons: Record<MarkerType, LucideIcon> = {
    [MarkerType.Restaurant]: Utensils,
    [MarkerType.PointOfInterest]: MapPin,
    [MarkerType.Question]: HelpCircle,
    [MarkerType.Tip]: Lightbulb,
    [MarkerType.Hotel]: Hotel,
    [MarkerType.Museum]: Building,
    [MarkerType.Ruin]: Building2,
    [MarkerType.TempleChurch]: Church,
    [MarkerType.FestivalParty]: PartyPopper,
    [MarkerType.Leisure]: Palmtree,
    [MarkerType.Sightseeing]: Eye,
    [MarkerType.NaturalAttraction]: Mountain,
};

/**
 * Icon to display for UNESCO World Heritage Sites
 */
export const UnescoIcon: LucideIcon = Landmark;

/**
 * Get the icon component for a given marker type
 */
export function getMarkerTypeIcon(type: MarkerType): LucideIcon {
    return markerTypeIcons[type] || MapPin;
}
