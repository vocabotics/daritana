import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { teamApi } from '@/lib/api';
import { toast } from 'sonner';

interface Cursor {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
  lastUpdate: number;
}

interface LiveCursorsProps {
  roomId: string;
  userName: string;
  userId: string;
  color?: string;
  enabled?: boolean;
  className?: string;
}

export function LiveCursors({
  roomId,
  userName,
  userId,
  color = '#3B82F6',
  enabled = true,
  className
}: LiveCursorsProps) {
  const [cursors, setCursors] = useState<Map<string, Cursor>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const lastEmitRef = useRef<number>(0);

  // Load live cursors from API
  useEffect(() => {
    if (!enabled) return;

    const loadLiveCursors = async () => {
      try {
        // In a real implementation, this would be WebSocket-based
        // For now, we'll use the team API to get online users
        const response = await teamApi.getOnlineUsers();
        if (response.data?.users) {
          const liveCursors = new Map<string, Cursor>();
          
          response.data.users.forEach((user: any) => {
            if (user.id !== userId) { // Don't show own cursor
              const cursor: Cursor = {
                userId: user.id,
                userName: user.name || user.firstName + ' ' + user.lastName,
                x: user.cursorPosition?.x || Math.random() * (window.innerWidth - 100),
                y: user.cursorPosition?.y || Math.random() * (window.innerHeight - 100),
                color: user.color || '#10B981',
                lastUpdate: Date.now()
              };
              liveCursors.set(user.id, cursor);
            }
          });
          
          setCursors(liveCursors);
        }
      } catch (error) {
        console.error('Failed to load live cursors:', error);
        // Fallback to mock data
        const mockCursors = new Map<string, Cursor>();
        const mockUser: Cursor = {
          userId: 'mock-user-1',
          userName: 'Lisa Wong',
          x: Math.random() * (window.innerWidth - 100),
          y: Math.random() * (window.innerHeight - 100),
          color: '#10B981',
          lastUpdate: Date.now()
        };
        mockCursors.set(mockUser.userId, mockUser);
        setCursors(mockCursors);
      }
    };

    loadLiveCursors();
    
    // Refresh cursors periodically
    const interval = setInterval(loadLiveCursors, 2000);
    return () => clearInterval(interval);
  }, [enabled, roomId, userId]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!enabled) return;

    const now = Date.now();
    // Throttle cursor updates to 60fps
    if (now - lastEmitRef.current < 16) return;
    lastEmitRef.current = now;

    // In production, emit cursor position via WebSocket
    // For now, just update local display
    const cursor: Cursor = {
      userId,
      userName,
      x: e.clientX,
      y: e.clientY,
      color,
      lastUpdate: now
    };

    // Simulate broadcasting to others
    console.log('Cursor position:', cursor);
  }, [enabled, userId, userName, color]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove, enabled]);

  // Clean up stale cursors
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCursors(prev => {
        const updated = new Map(prev);
        for (const [id, cursor] of updated) {
          if (now - cursor.lastUpdate > 5000) {
            updated.delete(id);
          }
        }
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!enabled) return null;

  return (
    <div ref={containerRef} className={cn("pointer-events-none fixed inset-0 z-50", className)}>
      <AnimatePresence>
        {Array.from(cursors.values()).map((cursor) => (
          <CursorPointer key={cursor.userId} cursor={cursor} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function CursorPointer({ cursor }: { cursor: Cursor }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        x: cursor.x,
        y: cursor.y
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ 
        type: "spring",
        damping: 30,
        stiffness: 200,
        mass: 0.5
      }}
      className="absolute pointer-events-none"
      style={{ left: 0, top: 0 }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        <path
          d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
          fill={cursor.color}
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <div
        className="absolute left-6 top-5 px-2 py-1 rounded-md text-xs text-white font-medium whitespace-nowrap"
        style={{ backgroundColor: cursor.color }}
      >
        {cursor.userName}
      </div>
    </motion.div>
  );
}

// Cursor Trail Component for drawing/annotation mode
export function CursorTrail({ 
  color = '#3B82F6',
  enabled = false 
}: { 
  color?: string;
  enabled?: boolean;
}) {
  const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setTrail([]);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const point = {
        x: e.clientX,
        y: e.clientY,
        id: idRef.current++
      };

      setTrail(prev => [...prev.slice(-20), point]);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      <AnimatePresence>
        {trail.map((point, index) => (
          <motion.div
            key={point.id}
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 0, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute rounded-full"
            style={{
              left: point.x - 4,
              top: point.y - 4,
              width: 8,
              height: 8,
              backgroundColor: color,
              opacity: (index / trail.length) * 0.5
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}