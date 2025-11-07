import React, { useRef, useState, ReactNode } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';

interface TouchGestureProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPullToRefresh?: () => Promise<void>;
  threshold?: number;
}

export function TouchGestures({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPullToRefresh,
  threshold = 50
}: TouchGestureProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const controls = useAnimation();
  const pullDistance = useRef(0);

  const handleDragEnd = async (_: any, info: PanInfo) => {
    const { offset, velocity } = info;

    // Pull to refresh
    if (onPullToRefresh && offset.y > threshold * 2 && !isRefreshing) {
      setIsRefreshing(true);
      await controls.start({ y: 60 });
      
      try {
        await onPullToRefresh();
      } finally {
        await controls.start({ y: 0 });
        setIsRefreshing(false);
      }
      return;
    }

    // Swipe detection
    if (Math.abs(offset.x) > Math.abs(offset.y)) {
      // Horizontal swipe
      if (offset.x > threshold && onSwipeRight) {
        onSwipeRight();
      } else if (offset.x < -threshold && onSwipeLeft) {
        onSwipeLeft();
      }
    } else {
      // Vertical swipe
      if (offset.y > threshold && onSwipeDown && !onPullToRefresh) {
        onSwipeDown();
      } else if (offset.y < -threshold && onSwipeUp) {
        onSwipeUp();
      }
    }

    // Reset position
    controls.start({ x: 0, y: 0 });
  };

  const handleDrag = (_: any, info: PanInfo) => {
    pullDistance.current = info.offset.y;
  };

  return (
    <motion.div
      drag
      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
      dragElastic={0.2}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      animate={controls}
      className="touch-none"
    >
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 flex justify-center py-4 z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      )}
      {children}
    </motion.div>
  );
}

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  className = ''
}: SwipeableCardProps) {
  const [exitX, setExitX] = useState(0);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100 && onSwipeRight) {
      setExitX(300);
      onSwipeRight();
    } else if (info.offset.x < -100 && onSwipeLeft) {
      setExitX(-300);
      onSwipeLeft();
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 1 }}
      animate={{ x: exitX, opacity: exitX !== 0 ? 0 : 1 }}
      transition={{ duration: 0.3 }}
      className={`cursor-grab active:cursor-grabbing ${className}`}
    >
      {children}
    </motion.div>
  );
}

interface PinchZoomProps {
  children: ReactNode;
  minScale?: number;
  maxScale?: number;
}

export function PinchZoom({ 
  children, 
  minScale = 0.5, 
  maxScale = 3 
}: PinchZoomProps) {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let initialDistance = 0;
    let initialScale = 1;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        initialScale = scale;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDistance > 0) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        const newScale = Math.min(
          Math.max(initialScale * (currentDistance / initialDistance), minScale),
          maxScale
        );
        setScale(newScale);
      }
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [scale, minScale, maxScale]);

  return (
    <div ref={containerRef} className="overflow-hidden">
      <motion.div
        animate={{ scale }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}