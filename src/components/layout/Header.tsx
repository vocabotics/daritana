import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, LogOut, Settings, User, HelpCircle, Palette, Command, TestTube2 } from 'lucide-react';
import { VirtualOfficeHeader } from './VirtualOfficeHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { HeaderLanguageSwitcher, MobileLanguageSwitcher } from '@/components/ui/language-switcher';
import { useAuthStore } from '@/store/authStore';
import { useDemoStore } from '@/store/demoStore';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { RealtimeNotifications } from '@/components/realtime/RealtimeNotifications';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ProjectContextSwitcher } from '@/components/context/ProjectContextSwitcher';
import { BreadcrumbNavigation } from '@/components/context/BreadcrumbNavigation';
import { useProjectContextStore } from '@/store/projectContextStore';
import { cn } from '@/lib/utils';
import { PresenceIndicator } from '@/components/collaboration/PresenceIndicator';
import { searchService } from '@/services/search.service';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { toggleCommandPalette, contextTransitioning } = useProjectContextStore();
  const { isEnabled: isDemoMode, toggle: toggleDemoMode } = useDemoStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Fetch suggestions when query changes
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
      setIsSearching(true);
      setShowSuggestions(false);
      
      try {
        const results = await searchService.search(searchQuery);
        navigate('/search-results', { state: { query: searchQuery, results } });
        toast.success(t('search.resultsFound', { count: results.total, query: searchQuery }) || `Found ${results.total} results for "${searchQuery}"`);
      } catch (error) {
        toast.error(t('errors.searchFailed') || 'Search failed. Please try again.');
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    if (suggestion.type === 'project') {
      navigate(`/projects/${suggestion.id}`);
    } else if (suggestion.type === 'task') {
      navigate(`/tasks?id=${suggestion.id}`);
    }
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleCommandPalette = () => {
    toggleCommandPalette();
  };
  
  if (!user) return null;
  
  return (
    <header className={cn(
      "bg-white border-b border-gray-200 transition-all duration-300",
      contextTransitioning && "opacity-95"
    )}>
      {/* Virtual Office Status Bar */}
      <VirtualOfficeHeader />
      
      {/* Main Header Bar */}
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Context Switcher and Search */}
          <div className="flex items-center gap-4 flex-1">
            <ProjectContextSwitcher />
            
            {/* Global Search */}
            <div className="flex-1 max-w-md" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t('navigation.search') + '...' || 'Search projects, tasks, or team members...'}
                  className="pl-10 pr-12 architect-border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {/* Command Palette Hint */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCommandPalette}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 px-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <Command className="w-3 h-3 mr-1" />
                  ⌘K
                </Button>
                
                {/* Search Suggestions Dropdown */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
                    >
                      <div className="py-2">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={`${suggestion.type}-${suggestion.id}`}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                          >
                            <span className="text-gray-400">
                              {suggestion.icon === 'folder' ? '📁' : '✅'}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{suggestion.text}</p>
                              <p className="text-xs text-gray-500 capitalize">{suggestion.type}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading indicator */}
                {isSearching && (
                  <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </form>
            </div>
          </div>
          
          {/* Right Section - Actions and User Menu */}
          <div className="flex items-center space-x-3">
            {/* Quick Actions */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCommandPalette}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Command className="w-4 h-4" />
              <span>{t('navigation.quickActions')}</span>
            </Button>
            
            {/* Presence Indicator - Show who's online */}
            <div className="hidden lg:block">
              <PresenceIndicator 
                projectId={useProjectContextStore.getState().currentProject?.id}
                maxVisible={3}
                showStatus={true}
              />
            </div>
            
            <RealtimeNotifications />
            <NotificationCenter />
            
            {/* Language Switcher - Desktop */}
            <HeaderLanguageSwitcher />
            
            {/* Language Switcher - Mobile */}
            <MobileLanguageSwitcher />
            
            {/* Demo Mode Toggle */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-gray-50/50">
              <TestTube2 className={cn(
                "w-4 h-4 transition-colors",
                isDemoMode ? "text-orange-600" : "text-gray-400"
              )} />
              <span className="text-sm font-medium text-gray-700">{t('demo.title')}</span>
              <Switch
                checked={isDemoMode}
                onCheckedChange={(checked) => {
                  toggleDemoMode();
                  toast.info(checked ? t('demo.enabled') : t('demo.disabled'));
                }}
                className="scale-75"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3 hover:bg-gray-50 px-3 py-2">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
                  </div>
                  <img
                    className="h-8 w-8 rounded-full ring-2 ring-gray-200 ring-offset-2"
                    src={user.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&face`}
                    alt={user.name}
                  />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => {
                  navigate('/profile');
                  toast.info(t('navigation.profile'));
                }}>
                  <User className="mr-2 h-4 w-4" />
                  {t('common.profile')}
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => {
                  navigate('/settings');
                  toast.info(t('navigation.settings'));
                }}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t('navigation.settings')}
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={handleCommandPalette}>
                  <Command className="mr-2 h-4 w-4" />
                  {t('navigation.commandPalette')}
                  <span className="ml-auto text-xs text-gray-400">⌘K</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => {
                  window.open('https://docs.daritana.com/help', '_blank');
                  toast.info(t('navigation.help'));
                }}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  {t('navigation.help')}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('auth.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation - Now just toolbar */}
      <div className="px-6 py-2 border-t border-gray-100 bg-white min-h-[40px] flex items-center">
        <BreadcrumbNavigation />
      </div>
    </header>
  );
}