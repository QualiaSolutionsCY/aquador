'use client';

import { useRef, useEffect, useCallback, useState } from 'react';

export type SwipeDirection = 'left' | 'right' | null;

export interface SwipeGestureOptions {
  threshold?: number;
  velocityThreshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  enabled?: boolean;
}

interface TouchPosition {
  x: number;
  y: number;
  time: number;
}

export interface SwipeGestureResult {
  ref: React.RefObject<HTMLDivElement | null>;
  isSwiping: boolean;
  swipeDirection: SwipeDirection;
  swipeProgress: number; // 0 to 1, tracks how far the swipe has progressed
}

export function useSwipeGesture(options: SwipeGestureOptions = {}): SwipeGestureResult {
  const {
    threshold = 50,
    velocityThreshold = 300,
    onSwipeLeft,
    onSwipeRight,
    enabled = true,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const touchStartRef = useRef<TouchPosition | null>(null);
  const currentTouchRef = useRef<TouchPosition | null>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled || e.touches.length > 1) {
        // Ignore multi-touch
        return;
      }

      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      currentTouchRef.current = touchStartRef.current;
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !touchStartRef.current || e.touches.length > 1) {
        return;
      }

      const touch = e.touches[0];
      const startPos = touchStartRef.current;
      const deltaX = touch.clientX - startPos.x;
      const deltaY = touch.clientY - startPos.y;

      currentTouchRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };

      // Only track horizontal swipes (horizontal movement > vertical movement)
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        setIsSwiping(true);
        setSwipeDirection(deltaX > 0 ? 'right' : 'left');

        // Calculate progress (capped at 1.0 for threshold distance)
        const progress = Math.min(Math.abs(deltaX) / threshold, 1);
        setSwipeProgress(progress);
      }
    },
    [enabled, threshold]
  );

  const handleTouchEnd = useCallback(() => {
    if (!enabled || !touchStartRef.current || !currentTouchRef.current) {
      setIsSwiping(false);
      setSwipeDirection(null);
      setSwipeProgress(0);
      return;
    }

    const startPos = touchStartRef.current;
    const endPos = currentTouchRef.current;
    const deltaX = endPos.x - startPos.x;
    const deltaY = endPos.y - startPos.y;
    const deltaTime = endPos.time - startPos.time;

    // Check if this was a horizontal swipe
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);

    if (isHorizontalSwipe) {
      // Check distance threshold
      const distanceMet = Math.abs(deltaX) >= threshold;

      // Check velocity threshold (pixels per millisecond, must complete within velocityThreshold ms)
      const velocityMet = deltaTime <= velocityThreshold;

      if (distanceMet && velocityMet) {
        // Valid swipe detected
        if (deltaX > 0) {
          // Swipe right
          onSwipeRight?.();
        } else {
          // Swipe left
          onSwipeLeft?.();
        }
      }
    }

    // Reset state
    setIsSwiping(false);
    setSwipeDirection(null);
    setSwipeProgress(0);
    touchStartRef.current = null;
    currentTouchRef.current = null;
  }, [enabled, threshold, velocityThreshold, onSwipeLeft, onSwipeRight]);

  const handleTouchCancel = useCallback(() => {
    setIsSwiping(false);
    setSwipeDirection(null);
    setSwipeProgress(0);
    touchStartRef.current = null;
    currentTouchRef.current = null;
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) {
      return;
    }

    // Use passive: false to allow preventDefault if needed in the future
    const options: AddEventListenerOptions = { passive: true };

    element.addEventListener('touchstart', handleTouchStart, options);
    element.addEventListener('touchmove', handleTouchMove, options);
    element.addEventListener('touchend', handleTouchEnd, options);
    element.addEventListener('touchcancel', handleTouchCancel, options);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);

  return {
    ref,
    isSwiping,
    swipeDirection,
    swipeProgress,
  };
}
