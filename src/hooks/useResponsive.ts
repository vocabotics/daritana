import { useState, useEffect } from 'react'

export const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
} as const

export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (windowSize.width < breakpoints.mobile) {
      setDevice('mobile')
    } else if (windowSize.width < breakpoints.tablet) {
      setDevice('tablet')
    } else {
      setDevice('desktop')
    }
  }, [windowSize.width])

  const isMobile = device === 'mobile'
  const isTablet = device === 'tablet'
  const isDesktop = device === 'desktop'
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  return {
    windowSize,
    device,
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    isLandscape: windowSize.width > windowSize.height,
    isPortrait: windowSize.height > windowSize.width,
  }
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    
    if (media.addEventListener) {
      media.addEventListener('change', listener)
    } else {
      media.addListener(listener)
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener)
      } else {
        media.removeListener(listener)
      }
    }
  }, [matches, query])

  return matches
}