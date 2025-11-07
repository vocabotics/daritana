import React, { useState, useEffect } from 'react'
import { useResponsive } from '@/hooks/useResponsive'
import { UnifiedHeader } from './UnifiedHeader'
import { Sidebar } from './Sidebar'
import { CommandPalette } from '@/components/context/CommandPalette'
import { BreadcrumbToolbarProvider } from '@/components/context/BreadcrumbNavigation'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ResponsiveLayoutProps {
  children: React.ReactNode
  toolbar?: React.ReactNode
}

export function ResponsiveLayout({ children, toolbar }: ResponsiveLayoutProps) {
  const { isMobile, isTablet } = useResponsive()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar when switching to desktop
  useEffect(() => {
    if (!isMobile && !isTablet) {
      setSidebarOpen(false)
    }
  }, [isMobile, isTablet])

  // Add keyboard shortcut for Command Palette (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        // Trigger command palette toggle
        const event = new CustomEvent('toggle-command-palette')
        window.dispatchEvent(event)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close sidebar when navigating on mobile
  useEffect(() => {
    const handleRouteChange = () => {
      if (isMobile) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [isMobile])

  return (
    <BreadcrumbToolbarProvider value={toolbar}>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Global Command Palette */}
        <CommandPalette />

      {/* Desktop Sidebar - Fixed to left */}
      {!isMobile && !isTablet && (
        <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40">
          <Sidebar />
        </div>
      )}

      {/* Mobile/Tablet Header */}
      {(isMobile || isTablet) && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            
            <div className="flex items-center gap-2">
              <img 
                src="/logo.png" 
                alt="Daritana" 
                className="h-8"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <span className="font-semibold text-lg">daritana</span>
            </div>
            
            <div className="w-10" /> {/* Spacer for center alignment */}
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && (
        <>
          <div
            className={cn(
              "fixed inset-0 bg-black/50 z-40 transition-opacity",
              sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={() => setSidebarOpen(false)}
          />
          
          <div
            className={cn(
              "fixed left-0 top-0 h-full w-64 bg-white z-50 transform transition-transform border-r border-gray-200",
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <Sidebar />
          </div>
        </>
      )}

      {/* Tablet Sidebar */}
      {isTablet && (
        <div
          className={cn(
            "fixed left-0 top-[57px] h-[calc(100%-57px)] w-64 bg-white border-r border-gray-200 z-30 transform transition-transform",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Sidebar />
        </div>
      )}

      {/* Desktop Header - Fixed at top, full width minus sidebar */}
      {!isMobile && !isTablet && (
        <div className="fixed top-0 left-64 right-0 z-30">
          <UnifiedHeader />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Main Content */}
        <main
          className={cn(
            "flex-1 transition-all duration-300",
            {
              "ml-0": isMobile || (isTablet && !sidebarOpen),
              "ml-64": (isTablet && sidebarOpen) || (!isMobile && !isTablet),
              "pt-[57px]": isMobile || isTablet,
              "pt-[60px]": !isMobile && !isTablet, // Single unified header bar
            }
          )}
        >
          <div className={cn(
            "h-full",
            {
              "p-3": isMobile,
              "p-4": isTablet,
              "p-6": !isMobile && !isTablet,
            }
          )}>
            {children}
          </div>
        </main>
      </div>
      </div>
    </BreadcrumbToolbarProvider>
  )
}