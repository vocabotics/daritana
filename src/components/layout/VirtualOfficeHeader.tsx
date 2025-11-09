import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Circle, 
  Users, 
  Activity,
  Wifi,
  WifiOff,
  Coffee,
  Clock,
  Building,
  Home,
  Car,
  Globe,
  Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { wsService } from '@/services/websocket.service';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

interface OnlineUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy';
  location?: string;
  currentPage?: string;
  lastActivity?: Date;
}

const locationIcons: Record<string, React.ReactNode> = {
  office: <Building className="h-3 w-3" />,
  home: <Home className="h-3 w-3" />,
  remote: <Globe className="h-3 w-3" />,
  commuting: <Car className="h-3 w-3" />,
  'on-site': <MapPin className="h-3 w-3" />,
};

const statusColors = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-gray-400',
};

const statusLabels = {
  online: 'Available',
  away: 'Away',
  busy: 'Do not disturb',
  offline: 'Offline',
};

export function VirtualOfficeHeader() {
  const { user } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [currentUserStatus, setCurrentUserStatus] = useState<'online' | 'away' | 'busy'>('online');
  const [currentLocation, setCurrentLocation] = useState('office');
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    if (user) {
      // SECURITY: WebSocket uses HTTP-Only cookies for auth (no token needed)
      wsService.connect(user.id);

      // Listen for connection status
      wsService.on('connection', (data: any) => {
        setIsConnected(data.status === 'connected');
        if (data.status === 'connected') {
          setPulseAnimation(true);
          setTimeout(() => setPulseAnimation(false), 2000);
        }
      });

      // Listen for presence updates
      wsService.on('presence:list', (users: any[]) => {
        const onlineUsersList = users
          .filter(u => u.status !== 'offline' && u.userId !== user.id)
          .map(u => ({
            id: u.userId,
            name: u.name,
            avatar: u.avatar,
            status: u.status,
            location: u.location,
            currentPage: u.currentPage,
            lastActivity: u.lastSeen ? new Date(u.lastSeen) : undefined,
          }));
        setOnlineUsers(onlineUsersList);
      });

      wsService.on('presence:user_joined', (userData: any) => {
        if (userData.userId !== user.id) {
          setOnlineUsers(prev => [...prev, {
            id: userData.userId,
            name: userData.name,
            avatar: userData.avatar,
            status: userData.status,
            location: userData.location,
            currentPage: userData.currentPage,
          }]);
          setPulseAnimation(true);
          setTimeout(() => setPulseAnimation(false), 2000);
        }
      });

      wsService.on('presence:user_left', (data: any) => {
        setOnlineUsers(prev => prev.filter(u => u.id !== data.userId));
      });

      // Update user location based on time of day
      const updateLocationBasedOnTime = () => {
        const hour = new Date().getHours();
        if (hour >= 9 && hour < 18) {
          setCurrentLocation('office');
        } else if (hour >= 18 && hour < 22) {
          setCurrentLocation('home');
        } else {
          setCurrentLocation('home');
        }
      };

      updateLocationBasedOnTime();
      const interval = setInterval(updateLocationBasedOnTime, 60000); // Check every minute

      return () => {
        clearInterval(interval);
        wsService.disconnect();
      };
    }
  }, [user]);

  const handleStatusChange = (status: 'online' | 'away' | 'busy') => {
    setCurrentUserStatus(status);
    wsService.updateUserStatus(status);
  };

  const handleLocationChange = (location: string) => {
    setCurrentLocation(location);
    wsService.updateUserLocation(location);
  };

  const displayedUsers = showAllUsers ? onlineUsers : onlineUsers.slice(0, 3);
  const additionalUsersCount = onlineUsers.length - 3;

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-white border-b border-gray-100">
      {/* Connection Status */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all",
              isConnected ? "bg-green-50" : "bg-red-50",
              pulseAnimation && "animate-pulse"
            )}>
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Virtual Office</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-medium text-red-700">Connecting...</span>
                </>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isConnected ? 'Connected to Virtual Office' : 'Connecting to Virtual Office...'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Current User Status & Location */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
              statusColors[currentUserStatus]
            )} />
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <select
                value={currentUserStatus}
                onChange={(e) => handleStatusChange(e.target.value as any)}
                className="text-xs font-medium bg-transparent border-none outline-none cursor-pointer hover:bg-gray-50 rounded px-1"
              >
                <option value="online">Available</option>
                <option value="away">Away</option>
                <option value="busy">Do not disturb</option>
              </select>
            </div>
            
            <div className="flex items-center gap-1">
              {locationIcons[currentLocation]}
              <select
                value={currentLocation}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="text-xs text-gray-500 bg-transparent border-none outline-none cursor-pointer hover:bg-gray-50 rounded px-1"
              >
                <option value="office">Office</option>
                <option value="home">Working from Home</option>
                <option value="remote">Remote</option>
                <option value="on-site">On-site</option>
                <option value="commuting">Commuting</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="h-6 w-px bg-gray-200" />

      {/* Active Users */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Activity className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-600">
            {onlineUsers.length + 1} active
          </span>
        </div>

        {/* User Avatars */}
        <div className="flex items-center -space-x-2">
          <AnimatePresence>
            {displayedUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative">
                        <Avatar className="h-7 w-7 border-2 border-white">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="text-xs">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white",
                          statusColors[user.status]
                        )} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-gray-500">{statusLabels[user.status]}</p>
                        {user.location && (
                          <p className="text-gray-400 flex items-center gap-1 mt-1">
                            {locationIcons[user.location]}
                            {user.location}
                          </p>
                        )}
                        {user.currentPage && (
                          <p className="text-gray-400 mt-1">📍 {user.currentPage}</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.div>
            ))}
          </AnimatePresence>

          {additionalUsersCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowAllUsers(!showAllUsers)}
                    className="relative flex items-center justify-center h-7 w-7 rounded-full bg-gray-100 border-2 border-white text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    +{additionalUsersCount}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{additionalUsersCount} more online</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <div className="h-6 w-px bg-gray-200" />

      {/* Current Time */}
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-gray-400" />
        <span className="text-xs font-medium text-gray-600">
          {new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          })}
        </span>
      </div>

      {/* Activity Sparkle */}
      {pulseAnimation && (
        <motion.div
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: [1, 1.2, 1], rotate: 360 }}
          transition={{ duration: 0.5 }}
        >
          <Sparkles className="h-4 w-4 text-yellow-500" />
        </motion.div>
      )}
    </div>
  );
}

export default VirtualOfficeHeader;