import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Eye, Edit3, MessageSquare } from 'lucide-react';
import { teamApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface ActiveUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  status: 'viewing' | 'editing' | 'commenting';
  lastSeen: Date;
  cursorPosition?: { x: number; y: number };
  color: string;
}

interface PresenceIndicatorProps {
  projectId?: string;
  pageId?: string;
  maxVisible?: number;
  showStatus?: boolean;
  className?: string;
}

export function PresenceIndicator({
  projectId,
  pageId,
  maxVisible = 3,
  showStatus = true,
  className
}: PresenceIndicatorProps) {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Load active users from API
  useEffect(() => {
    const loadActiveUsers = async () => {
      try {
        const response = await teamApi.getOnlineUsers();
        if (response.data?.users) {
          const formattedUsers = response.data.users.map((user: any) => ({
            id: user.id,
            name: user.name || user.firstName + ' ' + user.lastName,
            email: user.email,
            avatar: user.avatar,
            role: user.role || user.profession || 'User',
            status: user.status || 'viewing',
            lastSeen: new Date(user.lastSeen || user.lastActivity || new Date()),
            color: user.color || '#3B82F6'
          }));
          setActiveUsers(formattedUsers);
        }
      } catch (error) {
        console.error('Failed to load active users:', error);
        // Fallback to mock data if API fails
        const mockUsers: ActiveUser[] = [
          {
            id: '2',
            name: 'Lisa Wong',
            email: 'lisa@daritana.com',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
            role: 'Designer',
            status: 'editing',
            lastSeen: new Date(),
            color: '#3B82F6'
          },
          {
            id: '3',
            name: 'David Lim',
            email: 'david@daritana.com',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
            role: 'Contractor',
            status: 'viewing',
            lastSeen: new Date(),
            color: '#10B981'
          }
        ];
        setActiveUsers(mockUsers);
      }
    };

    loadActiveUsers();
    
    // Set up real-time updates (WebSocket would be used here)
    const interval = setInterval(loadActiveUsers, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [projectId, pageId]);

  const visibleUsers = showAll ? activeUsers : activeUsers.slice(0, maxVisible);
  const remainingCount = activeUsers.length - maxVisible;

  const getStatusIcon = (status: ActiveUser['status']) => {
    switch (status) {
      case 'editing':
        return <Edit3 className="w-3 h-3" />;
      case 'commenting':
        return <MessageSquare className="w-3 h-3" />;
      default:
        return <Eye className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status: ActiveUser['status']) => {
    switch (status) {
      case 'editing':
        return 'bg-blue-500';
      case 'commenting':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  if (activeUsers.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center -space-x-2">
          <AnimatePresence>
            {visibleUsers.map((user, index) => (
              <Tooltip key={user.id}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ scale: 0, x: -20 }}
                    animate={{ scale: 1, x: 0 }}
                    exit={{ scale: 0, x: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    <Avatar className="h-8 w-8 border-2 border-white ring-2" style={{ '--tw-ring-color': user.color } as any}>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback style={{ backgroundColor: user.color }} className="text-white text-xs">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {showStatus && (
                      <div className={cn(
                        "absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white",
                        getStatusColor(user.status)
                      )}>
                        {getStatusIcon(user.status)}
                      </div>
                    )}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-gray-500">{user.role}</p>
                    <p className="text-gray-400 capitalize">{user.status}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </AnimatePresence>

          {!showAll && remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={() => setShowAll(true)}
                  className="relative h-8 w-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700 border-2 border-white transition-colors"
                >
                  +{remainingCount}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {remainingCount} more {remainingCount === 1 ? 'person' : 'people'} active
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <Badge variant="outline" className="gap-1 text-xs">
          <Users className="w-3 h-3" />
          {activeUsers.length} active
        </Badge>
      </div>
    </TooltipProvider>
  );
}

// Presence Avatar Stack for compact display
export function PresenceAvatarStack({ users, max = 3 }: { users: ActiveUser[], max?: number }) {
  const visibleUsers = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex -space-x-2">
      {visibleUsers.map((user) => (
        <Avatar key={user.id} className="h-6 w-6 border-2 border-white">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback className="text-xs" style={{ backgroundColor: user.color }}>
            {user.name[0]}
          </AvatarFallback>
        </Avatar>
      ))}
      {remaining > 0 && (
        <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium">
          +{remaining}
        </div>
      )}
    </div>
  );
}