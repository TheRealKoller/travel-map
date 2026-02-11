# Mobile Collapsible Panels Implementation

## Overview

This document describes the implementation of collapsible panels for mobile devices in the Travel Map application, addressing the requirements specified in the issue "Collapsible Panels für Mobile".

## Features Implemented

### ✅ Completed Requirements

1. **Marker List as Expandable Bottom Sheet**
   - Implemented as a draggable bottom sheet
   - Supports multiple snap points (peek, half, full)
   - Includes visible drag handle

2. **Tour Panel as Drawer**
   - Converted to draggable sheet for mobile
   - Maintains functionality from desktop version
   - Smooth open/close transitions

3. **Route Panel as Overlay/Modal**
   - Implemented as draggable sheet with backdrop
   - Only shown when a trip is selected
   - Full functionality preserved

4. **Drag Handles**
   - Clearly visible horizontal grip icon
   - Located at the top of each panel
   - Responds to both touch and mouse events

5. **Snap Points**
   - **Peek** (80px): Shows panel title and allows quick access
   - **Half** (50% of screen): Comfortable viewing height
   - **Full** (90% of screen): Maximum content visibility
   - **Closed**: Panel completely hidden

6. **Swipe Gestures**
   - Touch-based dragging supported
   - Mouse-based dragging supported (for testing)
   - Smooth animations during drag
   - Snaps to closest point on release

7. **Map Visibility**
   - Map takes full height on mobile
   - Backdrop overlay when panels are expanded
   - Map remains partially visible at all snap points
   - Bottom navigation bar preserved

8. **Smooth Animations**
   - CSS transitions for all state changes
   - 300ms duration for natural feel
   - Ease-out timing function

## Technical Implementation

### New Components

#### 1. `DraggableSheet` Component
**Location:** `resources/js/components/ui/draggable-sheet.tsx`

**Features:**
- Touch and mouse drag support
- Four snap points (closed, peek, half, full)
- Automatic snap to closest point
- Backdrop overlay for expanded state
- Configurable peek and half heights
- Mobile-only (hidden on desktop)

**Props:**
```typescript
interface DraggableSheetProps {
    children: React.ReactNode;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    snapPoint?: SnapPoint;
    onSnapPointChange?: (snapPoint: SnapPoint) => void;
    className?: string;
    title?: string;
    peekHeight?: number;  // Default: 60px
    halfHeight?: number;  // Default: 50%
}
```

**Usage Example:**
```tsx
<DraggableSheet
    isOpen={panelStates.markers.isOpen}
    onOpenChange={(open) =>
        open ? openPanel('markers', 'half') : closePanel('markers')
    }
    snapPoint={panelStates.markers.snapPoint}
    onSnapPointChange={(snapPoint) =>
        updatePanelSnapPoint('markers', snapPoint)
    }
    title="Markers"
    peekHeight={80}
    halfHeight={50}
>
    {/* Panel content */}
</DraggableSheet>
```

#### 2. `useMobilePanels` Hook
**Location:** `resources/js/hooks/use-mobile-panels.ts`

**Purpose:** Manages state for all mobile panels

**Features:**
- Tracks open/closed state per panel
- Manages snap points per panel
- Provides functions to manipulate panel states

**API:**
```typescript
const {
    activePanel,        // Currently active panel
    setActivePanel,     // Set active panel
    panelStates,        // State object for all panels
    openPanel,          // Open a panel to a specific snap point
    closePanel,         // Close a panel
    updatePanelSnapPoint, // Update panel's snap point
    togglePanel,        // Toggle panel open/closed
} = useMobilePanels();
```

### Modified Components

#### 1. `TravelMap` Component
**Changes:**
- Added draggable sheets for mobile panels
- Desktop layout preserved with static panels
- Map height adjusted for mobile (full height)
- Added bottom padding for mobile navigation
- Integrated panel state management

**Key Changes:**
- Mobile panels now use `DraggableSheet` component
- Desktop panels remain as static divs
- Map takes full viewport height on mobile
- Bottom navigation receives panel states

#### 2. `MobileBottomNavigation` Component
**Changes:**
- Accepts `panelStates` prop
- Shows visual indicator for open panels
- Updated styling to highlight active/open panels

## Behavior

### Mobile (< 768px)

1. **Map**: Takes full screen height
2. **Panels**: Implemented as draggable sheets
3. **Navigation**: Fixed bottom bar with 3 tabs
4. **Interactions**:
   - Tap navigation button → Opens panel to half
   - Drag panel up → Expands to full
   - Drag panel down → Collapses to peek or closes
   - Tap backdrop → Collapses to peek

### Desktop (≥ 768px)

1. **Layout**: Unchanged, uses row layout
2. **Panels**: Static side panels
3. **Interactions**: Collapse/expand buttons
4. **Mobile features**: Hidden via `md:hidden` classes

## Styling

### Responsive Classes
- Mobile panels: Visible below `md` breakpoint
- Desktop panels: Hidden below `md` breakpoint (`hidden md:flex`)
- Navigation: `md:hidden` for mobile-only

### Animations
- Transition duration: 300ms
- Timing function: ease-out
- Properties: height, opacity, transform

### Z-index Layers
- Bottom navigation: z-30
- Backdrop: z-40
- Draggable sheets: z-50

## Testing

### All Tests Pass
✅ 468 PHP tests passed
✅ TypeScript compilation successful
✅ ESLint checks passed
✅ Prettier formatting applied
✅ PHP CS Fixer applied
✅ CodeQL security scan passed (0 alerts)

### Manual Testing Checklist

To test the implementation:

1. **Open the map page on mobile viewport** (< 768px)
   - Verify map takes full height
   - Verify bottom navigation is visible

2. **Test Marker Panel**
   - Tap "Markers" in bottom navigation
   - Panel should open to half height
   - Drag up to expand to full
   - Drag down to collapse to peek
   - Drag down further to close

3. **Test Tour Panel**
   - Tap "Tours" in bottom navigation
   - Panel should open to half height
   - Test drag gestures
   - Verify backdrop appears when expanded

4. **Test Route Panel**
   - Tap "Routes" in bottom navigation
   - Panel should open to half height
   - Test drag gestures

5. **Test Desktop Layout**
   - Resize to desktop (≥ 768px)
   - Verify static panels appear
   - Verify mobile sheets are hidden
   - Verify collapse buttons work

## Browser Compatibility

- **Touch Events**: Safari, Chrome Mobile, Firefox Mobile
- **Mouse Events**: Chrome, Firefox, Safari desktop
- **CSS Transitions**: All modern browsers
- **Flexbox**: All modern browsers

## Performance Considerations

- **Drag Performance**: Uses `requestAnimationFrame` implicitly via React
- **Transition Performance**: Hardware-accelerated CSS transitions
- **Memory**: Minimal state per panel
- **Re-renders**: Optimized with `useCallback` hooks

## Future Enhancements

Potential improvements for future iterations:

1. **Velocity-based snapping**: Consider drag velocity when snapping
2. **Custom snap points**: Allow configurable snap heights
3. **Keyboard accessibility**: Add keyboard navigation support
4. **Persistent state**: Remember last snap point per panel
5. **Haptic feedback**: Add vibration on snap (mobile devices)

## Files Changed

### New Files
- `resources/js/components/ui/draggable-sheet.tsx` (238 lines)
- `resources/js/hooks/use-mobile-panels.ts` (79 lines)

### Modified Files
- `resources/js/components/travel-map.tsx` (+163, -40)
- `resources/js/components/mobile-bottom-navigation.tsx` (+22, -9)

### Total Impact
- **Added:** 502 lines
- **Removed:** 40 lines
- **Net Change:** +462 lines

## Acceptance Criteria Met

✅ Panels can be opened/closed through swipe gestures
✅ Drag handle is clearly visible
✅ Map remains partially visible when panel is open
✅ Smooth animations when opening/closing
✅ All panels work on mobile (markers, tours, routes)
✅ Desktop layout unaffected

## Security

- ✅ No security vulnerabilities detected (CodeQL scan)
- ✅ No external dependencies added
- ✅ Uses existing UI patterns
- ✅ No user input validation issues
