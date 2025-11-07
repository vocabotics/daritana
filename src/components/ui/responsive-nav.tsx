// Responsive Navigation Component with 2025 Design Patterns
import * as React from 'react';
import { cn } from '@/lib/utils';
import { 
  Menu, X, Home, Briefcase, Calendar, Users, FileText, 
  Settings, Bell, Search, User, LogOut, ChevronDown,
  Sun, Moon, Monitor, Globe, Palette, Accessibility
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { AdvancedButton } from './advanced-button';

interface NavItem {
  id: string;
  label: string;
  labelMs?: string; // Malay translation
  labelZh?: string; // Chinese translation
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
  children?: NavItem[];
  requiredRoles?: string[];
}

interface ResponsiveNavProps {
  items: NavItem[];
  logo?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'floating' | 'transparent' | 'glass';
  position?: 'fixed' | 'sticky' | 'relative';
  showSearch?: boolean;
  showNotifications?: boolean;
  showLanguageSelector?: boolean;
  showThemeSelector?: boolean;
  onThemeChange?: (theme: string) => void;
  onLanguageChange?: (lang: string) => void;
}

export const ResponsiveNav: React.FC<ResponsiveNavProps> = ({
  items,
  logo,
  className,
  variant = 'default',
  position = 'sticky',
  showSearch = true,
  showNotifications = true,
  showLanguageSelector = true,
  showThemeSelector = true,
  onThemeChange,
  onLanguageChange,
}) => {
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = React.useState('light');
  const [currentLanguage, setCurrentLanguage] = React.useState('en');
  const [notificationCount] = React.useState(3);
  
  // Filter items based on user role
  const filteredItems = React.useMemo(() => {
    if (!user) return [];
    
    return items.filter(item => {
      if (!item.requiredRoles || item.requiredRoles.length === 0) return true;
      return item.requiredRoles.includes(user.role);
    });
  }, [items, user]);
  
  // Handle theme change
  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    onThemeChange?.(theme);
  };
  
  // Handle language change
  const handleLanguageChange = (lang: string) => {
    setCurrentLanguage(lang);
    onLanguageChange?.(lang);
  };
  
  // Get nav label based on current language
  const getLabel = (item: NavItem) => {
    switch (currentLanguage) {
      case 'ms':
        return item.labelMs || item.label;
      case 'zh':
        return item.labelZh || item.label;
      default:
        return item.label;
    }
  };
  
  // Navigation variants
  const navVariants = {
    default: 'bg-background border-b',
    floating: 'bg-card shadow-lg mx-4 mt-4 rounded-xl',
    transparent: 'bg-transparent backdrop-blur-sm',
    glass: 'glass-morphism border-b border-white/10',
  };
  
  const navClasses = cn(
    'w-full z-50 transition-all duration-200',
    position === 'fixed' && 'fixed top-0 left-0 right-0',
    position === 'sticky' && 'sticky top-0',
    navVariants[variant],
    className
  );
  
  return (
    <>
      <nav className={navClasses} role="navigation" aria-label="Main navigation">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Desktop Menu */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              {logo && (
                <div className="flex-shrink-0">
                  {logo}
                </div>
              )}
              
              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-1">
                {filteredItems.map((item) => (
                  <div key={item.id} className="relative">
                    {item.children ? (
                      <button
                        className={cn(
                          'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                          'hover:bg-accent hover:text-accent-foreground',
                          activeDropdown === item.id && 'bg-accent text-accent-foreground'
                        )}
                        onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                        aria-expanded={activeDropdown === item.id}
                        aria-haspopup="true"
                      >
                        {item.icon}
                        <span>{getLabel(item)}</span>
                        <ChevronDown className={cn(
                          'h-4 w-4 transition-transform',
                          activeDropdown === item.id && 'rotate-180'
                        )} />
                      </button>
                    ) : (
                      <a
                        href={item.href}
                        className={cn(
                          'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                          'hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        {item.icon}
                        <span>{getLabel(item)}</span>
                        {item.badge && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </a>
                    )}
                    
                    {/* Dropdown Menu */}
                    {item.children && activeDropdown === item.id && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-card rounded-md shadow-lg border animate-slide-down">
                        {item.children.map((child) => (
                          <a
                            key={child.id}
                            href={child.href}
                            className="flex items-center space-x-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors first:rounded-t-md last:rounded-b-md"
                            onClick={() => setActiveDropdown(null)}
                          >
                            {child.icon}
                            <span>{getLabel(child)}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right Side Actions */}
            <div className="flex items-center space-x-2">
              {/* Search */}
              {showSearch && (
                <div className="hidden md:block">
                  {isSearchOpen ? (
                    <div className="flex items-center space-x-2 animate-slide-down">
                      <input
                        type="search"
                        placeholder="Search..."
                        className="px-3 py-1.5 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        autoFocus
                        onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                      />
                      <button
                        onClick={() => setIsSearchOpen(false)}
                        className="p-1.5 hover:bg-accent rounded-md transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsSearchOpen(true)}
                      className="p-2 hover:bg-accent rounded-md transition-colors"
                      aria-label="Search"
                    >
                      <Search className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}
              
              {/* Language Selector */}
              {showLanguageSelector && (
                <div className="hidden md:block relative">
                  <button
                    className="p-2 hover:bg-accent rounded-md transition-colors"
                    onClick={() => setActiveDropdown(activeDropdown === 'language' ? null : 'language')}
                    aria-label="Select language"
                  >
                    <Globe className="h-5 w-5" />
                  </button>
                  
                  {activeDropdown === 'language' && (
                    <div className="absolute top-full right-0 mt-1 w-40 bg-card rounded-md shadow-lg border animate-slide-down">
                      <button
                        onClick={() => handleLanguageChange('en')}
                        className={cn(
                          'w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors',
                          currentLanguage === 'en' && 'bg-accent'
                        )}
                      >
                        English
                      </button>
                      <button
                        onClick={() => handleLanguageChange('ms')}
                        className={cn(
                          'w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors',
                          currentLanguage === 'ms' && 'bg-accent'
                        )}
                      >
                        Bahasa Melayu
                      </button>
                      <button
                        onClick={() => handleLanguageChange('zh')}
                        className={cn(
                          'w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors',
                          currentLanguage === 'zh' && 'bg-accent'
                        )}
                      >
                        中文
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Theme Selector */}
              {showThemeSelector && (
                <div className="hidden md:block relative">
                  <button
                    className="p-2 hover:bg-accent rounded-md transition-colors"
                    onClick={() => setActiveDropdown(activeDropdown === 'theme' ? null : 'theme')}
                    aria-label="Select theme"
                  >
                    <Palette className="h-5 w-5" />
                  </button>
                  
                  {activeDropdown === 'theme' && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-card rounded-md shadow-lg border animate-slide-down">
                      <button
                        onClick={() => handleThemeChange('light')}
                        className={cn(
                          'w-full flex items-center space-x-2 px-4 py-2 text-sm hover:bg-accent transition-colors',
                          currentTheme === 'light' && 'bg-accent'
                        )}
                      >
                        <Sun className="h-4 w-4" />
                        <span>Light</span>
                      </button>
                      <button
                        onClick={() => handleThemeChange('dark')}
                        className={cn(
                          'w-full flex items-center space-x-2 px-4 py-2 text-sm hover:bg-accent transition-colors',
                          currentTheme === 'dark' && 'bg-accent'
                        )}
                      >
                        <Moon className="h-4 w-4" />
                        <span>Dark</span>
                      </button>
                      <button
                        onClick={() => handleThemeChange('system')}
                        className={cn(
                          'w-full flex items-center space-x-2 px-4 py-2 text-sm hover:bg-accent transition-colors',
                          currentTheme === 'system' && 'bg-accent'
                        )}
                      >
                        <Monitor className="h-4 w-4" />
                        <span>System</span>
                      </button>
                      <button
                        onClick={() => handleThemeChange('blueprint')}
                        className={cn(
                          'w-full flex items-center space-x-2 px-4 py-2 text-sm hover:bg-accent transition-colors',
                          currentTheme === 'blueprint' && 'bg-accent'
                        )}
                      >
                        <FileText className="h-4 w-4" />
                        <span>Blueprint</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Notifications */}
              {showNotifications && (
                <button
                  className="relative p-2 hover:bg-accent rounded-md transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-destructive text-destructive-foreground rounded-full">
                      {notificationCount}
                    </span>
                  )}
                </button>
              )}
              
              {/* User Menu */}
              {user && (
                <div className="hidden md:block relative">
                  <button
                    className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md transition-colors"
                    onClick={() => setActiveDropdown(activeDropdown === 'user' ? null : 'user')}
                  >
                    <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                  </button>
                  
                  {activeDropdown === 'user' && (
                    <div className="absolute top-full right-0 mt-1 w-56 bg-card rounded-md shadow-lg border animate-slide-down">
                      <div className="px-4 py-3 border-b">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <a
                        href="/settings"
                        className="flex items-center space-x-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </a>
                      <button
                        onClick={logout}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden p-2 hover:bg-accent rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Mobile Menu Panel */}
      <div
        className={cn(
          'lg:hidden fixed top-0 right-0 h-full w-80 bg-background z-50 transform transition-transform duration-300 overflow-y-auto',
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-accent rounded-md transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Mobile Search */}
          {showSearch && (
            <div className="mb-4">
              <input
                type="search"
                placeholder="Search..."
                className="w-full px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
          
          {/* Mobile Navigation Items */}
          <div className="space-y-1">
            {filteredItems.map((item) => (
              <div key={item.id}>
                <a
                  href={item.href}
                  className="flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium hover:bg-accent transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center space-x-3">
                    {item.icon}
                    <span>{getLabel(item)}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                      {item.badge}
                    </span>
                  )}
                </a>
              </div>
            ))}
          </div>
          
          {/* Mobile User Info */}
          {user && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <a
                  href="/settings"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </a>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Bottom Navigation for Mobile (PWA)
interface BottomNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string | number;
}

interface BottomNavProps {
  items: BottomNavItem[];
  activeItem?: string;
  className?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  items,
  activeItem,
  className,
}) => {
  return (
    <nav
      className={cn(
        'md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50',
        className
      )}
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className={cn(
              'relative flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors',
              activeItem === item.id
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="relative">
              {item.icon}
              {item.badge && (
                <span className="absolute -top-1 -right-1 px-1 text-xs bg-destructive text-destructive-foreground rounded-full">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
};

export default ResponsiveNav;