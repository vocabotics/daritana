import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  FolderOpen, 
  CheckSquare, 
  Calendar,
  Users,
  FileText,
  DollarSign,
  ShoppingCart,
  BarChart3,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  User,
  LogOut,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useResponsive } from '@/hooks/usePWA';
import { cn } from '@/lib/utils';

interface MobileNavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  badge?: number;
  roles?: string[];
}

export const MobileNav: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { isMobile, isTablet } = useResponsive();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navItems: MobileNavItem[] = [
    { icon: <Home size={20} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <FolderOpen size={20} />, label: 'Projects', path: '/projects', badge: 3 },
    { icon: <CheckSquare size={20} />, label: 'Tasks', path: '/kanban', badge: 12 },
    { icon: <Calendar size={20} />, label: 'Timeline', path: '/timeline' },
    { icon: <Users size={20} />, label: 'Team', path: '/team' },
    { icon: <FileText size={20} />, label: 'Files', path: '/files' },
    { icon: <DollarSign size={20} />, label: 'Financial', path: '/financial', roles: ['admin', 'project_lead'] },
    { icon: <ShoppingCart size={20} />, label: 'Marketplace', path: '/marketplace' },
    { icon: <BarChart3 size={20} />, label: 'Analytics', path: '/analytics', roles: ['admin', 'project_lead'] },
    { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.roles || item.roles.includes(user?.role || '')
  );

  const bottomNavItems = [
    { icon: <Home size={22} />, label: 'Home', path: '/dashboard' },
    { icon: <FolderOpen size={22} />, label: 'Projects', path: '/projects' },
    { icon: <Plus size={22} />, label: 'Add', path: '#', isAction: true },
    { icon: <CheckSquare size={22} />, label: 'Tasks', path: '/kanban' },
    { icon: <User size={22} />, label: 'Profile', path: '/profile' },
  ];

  const handleQuickAction = () => {
    // Show quick action menu
    const actions = [
      { label: 'New Project', action: () => console.log('New project') },
      { label: 'New Task', action: () => console.log('New task') },
      { label: 'Upload File', action: () => console.log('Upload file') },
    ];
    
    // This would open a modal or action sheet
    console.log('Quick actions:', actions);
  };

  if (!isMobile && !isTablet) return null;

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 lg:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <Link to="/dashboard" className="flex items-center">
              <span className="text-xl font-bold text-blue-600">d</span>
              <span className="text-lg font-light">aritana</span>
            </Link>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>
            
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Side Menu Sheet */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
          <SheetHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle>Menu</SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>
          
          {/* User Profile Section */}
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {user?.role}
                </Badge>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto">
            <div className="p-2">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    location.pathname === item.path
                      ? "bg-blue-50 text-blue-600"
                      : "hover:bg-gray-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                logout();
                setIsMenuOpen(false);
              }}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Bottom Navigation (Mobile Only) */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
          <div className="flex items-center justify-around h-16">
            {bottomNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              
              if (item.isAction) {
                return (
                  <button
                    key={item.label}
                    onClick={handleQuickAction}
                    className="flex flex-col items-center justify-center p-2"
                  >
                    <div className="bg-blue-600 text-white rounded-full p-2">
                      {item.icon}
                    </div>
                  </button>
                );
              }
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 min-w-[64px]",
                    isActive ? "text-blue-600" : "text-gray-500"
                  )}
                >
                  {item.icon}
                  <span className="text-xs mt-1">{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-blue-600"></span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Search Modal */}
      <Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <SheetContent side="top" className="h-auto">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects, tasks, files..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            
            {/* Quick Search Results */}
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-500">Recent searches</p>
              <div className="space-y-1">
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded">
                  KLCC Tower Project
                </button>
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded">
                  Design Brief Template
                </button>
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded">
                  Q4 Financial Report
                </button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};