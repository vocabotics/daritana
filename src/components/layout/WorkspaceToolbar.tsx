import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface WorkspaceToolbarProps {
  children: React.ReactNode;
  className?: string;
}

export function WorkspaceToolbar({ children, className }: WorkspaceToolbarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between min-h-[60px]",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

interface WorkspaceToolbarLeftProps {
  children: React.ReactNode;
}

export function WorkspaceToolbarLeft({ children }: WorkspaceToolbarLeftProps) {
  return (
    <div className="flex items-center gap-3">
      {children}
    </div>
  );
}

interface WorkspaceToolbarRightProps {
  children: React.ReactNode;
}

export function WorkspaceToolbarRight({ children }: WorkspaceToolbarRightProps) {
  return (
    <div className="flex items-center gap-3">
      {children}
    </div>
  );
}