import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, LogOut, Settings, User, HelpCircle, Command, 
  Bell, MapPin, Circle, Users, Wifi, WifiOff, Home, Building,
  Globe, Car, Coffee, Clock, Activity, ChevronDown, Sparkles,
  Plus, Calendar, FileText, Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { RealtimeNotifications } from '@/components/realtime/RealtimeNotifications';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ProjectContextSwitcher } from '@/components/context/ProjectContextSwitcher';
import { BreadcrumbNavigation } from '@/components/context/BreadcrumbNavigation';
import { useProjectContextStore } from '@/store/projectContextStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { wsService } from '@/services/websocket.service';
import { searchService } from '@/services/search.service';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface OnlineUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy';
  location?: string;
}

const statusColors = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-gray-400',
};

const locationIcons: Record<string, React.ReactNode> = {
  office: <Building className="h-3 w-3" />,
  home: <Home className="h-3 w-3" />,
  remote: <Globe className="h-3 w-3" />,
  commuting: <Car className="h-3 w-3" />,
};

export function UnifiedHeader() {
  const { user, logout } = useAuthStore();
  const { toggleCommandPalette, contextTransitioning } = useProjectContextStore();
  const { openCreateProjectModal } = useUIStore();
  const navigate = useNavigate();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Presence state
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [currentUserStatus, setCurrentUserStatus] = useState<'online' | 'away' | 'busy'>('online');
  const [currentLocation, setCurrentLocation] = useState('office');

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    if (user) {
      wsService.connect(user.id, localStorage.getItem('access_token') || '');
      
      wsService.on('connection', (data: any) => {
        setIsConnected(data.status === 'connected');
      });

      wsService.on('presence:list', (users: any[]) => {
        const onlineUsersList = users
          .filter(u => u.status !== 'offline' && u.userId !== user.id)
          .map(u => ({
            id: u.userId,
            name: u.name,
            avatar: u.avatar,
            status: u.status,
            location: u.location,
          }));
        setOnlineUsers(onlineUsersList);
      });

      return () => {
        wsService.disconnect();
      };
    }
  }, [user]);

  // Search functionality
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length >= 2) {
        try {
          const results = await searchService.getSuggestions(searchQuery);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Failed to fetch suggestions:', error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      try {
        const results = await searchService.search(searchQuery);
        navigate('/search-results', { state: { query: searchQuery, results } });
        toast.success(`Found ${results.total} results`);
      } catch (error) {
        toast.error('Search failed. Please try again.');
      }
    }
  };

  const handleStatusChange = (status: 'online' | 'away' | 'busy') => {
    setCurrentUserStatus(status);
    wsService.updateUserStatus(status);
    toast.success(`Status updated to ${status}`);
  };

  const handleLocationChange = (location: string) => {
    setCurrentLocation(location);
    wsService.updateUserLocation(location);
    toast.success(`Location updated to ${location}`);
  };

  if (!user) return null;

  return (
    <header className={cn(
      "bg-white border-b border-gray-200 transition-all duration-300",
      contextTransitioning && "opacity-95"
    )}>
      <div className="px-4 lg:px-6 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Left Section - Context Switcher, Search */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Project Context Switcher */}
            <div className="hidden md:block">
              <ProjectContextSwitcher />
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg hidden lg:block" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search everything..."
                  className="pl-10 pr-20 h-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <kbd className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-0.5 text-xs text-gray-500 bg-gray-100 rounded">
                  ⌘K
                </kbd>
                
                {/* Search Suggestions */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                    >
                      {suggestions.map((suggestion) => (
                        <button
                          key={`${suggestion.type}-${suggestion.id}`}
                          type="button"
                          onClick={() => {
                            navigate(suggestion.link);
                            setSearchQuery('');
                            setShowSuggestions(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                        >
                          <span className="text-gray-400 text-sm">
                            {suggestion.icon}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{suggestion.text}</p>
                            <p className="text-xs text-gray-500">{suggestion.type}</p>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </div>

          {/* Center Section - Quick Actions */}
          <div className="hidden xl:flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={openCreateProjectModal}
              className="h-8 px-3 text-xs font-medium"
            >
              <Plus className="h-3 w-3 mr-1" />
              New Project
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/calendar')}
              className="h-8 px-3 text-xs font-medium"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Calendar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/tasks')}
              className="h-8 px-3 text-xs font-medium"
            >
              <FileText className="h-3 w-3 mr-1" />
              Tasks
            </Button>
          </div>

          {/* Right Section - Status, Team, Notifications, User */}
          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors",
                    isConnected ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                  )}>
                    {isConnected ? (
                      <Wifi className="h-3 w-3" />
                    ) : (
                      <WifiOff className="h-3 w-3" />
                    )}
                    <span className="hidden sm:inline">
                      {isConnected ? 'Live' : 'Offline'}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isConnected ? 'Connected to real-time updates' : 'Reconnecting...'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Team Presence */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 relative"
                    onClick={() => navigate('/team')}
                  >
                    <Users className="h-4 w-4" />
                    <span className="ml-1 text-xs font-medium">{onlineUsers.length}</span>
                    {onlineUsers.length > 0 && (
                      <span className="absolute top-1 right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-medium">{onlineUsers.length} team members online</p>
                    {onlineUsers.slice(0, 3).map(user => (
                      <div key={user.id} className="flex items-center gap-2 text-xs">
                        <Circle className={cn("h-2 w-2 fill-current", statusColors[user.status])} />
                        <span>{user.name}</span>
                      </div>
                    ))}
                    {onlineUsers.length > 3 && (
                      <p className="text-xs text-gray-500">+{onlineUsers.length - 3} more</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Notifications - Single Bell */}
            <NotificationCenter />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 gap-2">
                  <div className="relative">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Circle className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-3 w-3 border-2 border-white fill-current",
                      statusColors[currentUserStatus]
                    )} />
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-medium leading-none">{user.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {locationIcons[currentLocation]}
                      <p className="text-xs text-gray-500 capitalize">{currentLocation}</p>
                    </div>
                  </div>
                  <ChevronDown className="h-3 w-3 text-gray-500 hidden lg:block" />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-64">
                {/* Status Section */}
                <DropdownMenuLabel className="text-xs text-gray-500">STATUS</DropdownMenuLabel>
                <div className="grid grid-cols-3 gap-1 p-2">
                  {(['online', 'away', 'busy'] as const).map(status => (
                    <Button
                      key={status}
                      variant={currentUserStatus === status ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs capitalize"
                      onClick={() => handleStatusChange(status)}
                    >
                      <div className={cn("h-2 w-2 mr-1 rounded-full", statusColors[status])} />
                      {status}
                    </Button>
                  ))}
                </div>
                
                {/* Location Section */}
                <DropdownMenuLabel className="text-xs text-gray-500">LOCATION</DropdownMenuLabel>
                <div className="grid grid-cols-2 gap-1 p-2">
                  {Object.entries(locationIcons).slice(0, 4).map(([location, icon]) => (
                    <Button
                      key={location}
                      variant={currentLocation === location ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleLocationChange(location)}
                    >
                      {icon}
                      <span className="ml-1 capitalize">{location}</span>
                    </Button>
                  ))}
                </div>
                
                <DropdownMenuSeparator />
                
                {/* Menu Items */}
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Preferences
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={toggleCommandPalette}>
                  <Command className="mr-2 h-4 w-4" />
                  Command Palette
                  <span className="ml-auto text-xs text-gray-400">⌘K</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => window.open('https://help.daritana.com', '_blank')}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help & Support
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {/* Toolbar/Breadcrumb Navigation - Contains page-specific tabs and controls */}
      <div className="border-t border-gray-100 bg-gray-50 px-4 lg:px-6 py-2">
        <BreadcrumbNavigation />
      </div>
    </header>
  );
}