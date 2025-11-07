import React from 'react';
import { useProjectContextStore } from '@/store/projectContextStore';
import { motion } from 'framer-motion';
import { ArrowLeft, Layers, Users, Calendar, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ContextualPageWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  contextualInfo?: boolean;
  fullHeight?: boolean;
}

export function ContextualPageWrapper({ 
  children, 
  title,
  description,
  actions,
  contextualInfo = true,
  fullHeight = true
}: ContextualPageWrapperProps) {
  const { mode, currentProject, switchToGlobal } = useProjectContextStore();

  const isProjectMode = mode === 'project' && currentProject;

  return (
    <div className={cn(
      "flex flex-col w-full",
      fullHeight ? "h-full min-h-screen" : "min-h-0"
    )}>
      {/* Contextual Header */}
      {contextualInfo && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          {isProjectMode ? (
            // Project Context Header
            <div className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg"
                    style={{ backgroundColor: currentProject.color }}
                  >
                    {currentProject.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl font-bold text-gray-900">
                        {title || currentProject.name}
                      </h1>
                      <Badge 
                        variant={currentProject.status === 'active' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {currentProject.status}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-3">
                      {description || currentProject.description}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{currentProject.teamMembers?.length || 0} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Due {new Date(currentProject.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>{currentProject.progress}% complete</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {actions}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={switchToGlobal}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Global
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Global Context Header - Only show if title or description provided
            (title || description) && (
              <div className="flex items-center justify-between mb-6">
                <div>
                  {title && (
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {title}
                    </h1>
                  )}
                  {description && (
                    <p className="text-gray-600">{description}</p>
                  )}
                </div>
                {actions && (
                  <div className="flex items-center gap-3">
                    {actions}
                  </div>
                )}
              </div>
            )
          )}
        </motion.div>
      )}

      {/* Page Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          "flex-1 w-full",
          fullHeight && "min-h-0"
        )}
      >
        {children}
      </motion.div>
    </div>
  );
}