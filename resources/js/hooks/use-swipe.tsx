import { useEffect, useRef } from 'react';

interface SwipeConfig {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    threshold?: number;
}

export function useSwipe(config: SwipeConfig) {
    const {
        onSwipeLeft,
        onSwipeRight,
        onSwipeUp,
        onSwipeDown,
        threshold = 50,
    } = config;

    const touchStartX = useRef<number>(0);
    const touchStartY = useRef<number>(0);
    const touchEndX = useRef<number>(0);
    const touchEndY = useRef<number>(0);

    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            touchStartX.current = e.changedTouches[0].screenX;
            touchStartY.current = e.changedTouches[0].screenY;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            touchEndX.current = e.changedTouches[0].screenX;
            touchEndY.current = e.changedTouches[0].screenY;
            handleSwipe();
        };

        const handleSwipe = () => {
            const deltaX = touchEndX.current - touchStartX.current;
            const deltaY = touchEndY.current - touchStartY.current;

            // Determine if horizontal or vertical swipe
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (Math.abs(deltaX) > threshold) {
                    if (deltaX > 0 && onSwipeRight) {
                        onSwipeRight();
                    } else if (deltaX < 0 && onSwipeLeft) {
                        onSwipeLeft();
                    }
                }
            } else {
                // Vertical swipe
                if (Math.abs(deltaY) > threshold) {
                    if (deltaY > 0 && onSwipeDown) {
                        onSwipeDown();
                    } else if (deltaY < 0 && onSwipeUp) {
                        onSwipeUp();
                    }
                }
            }
        };

        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);
}
