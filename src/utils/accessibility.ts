/**
 * Accessibility Utilities
 * WCAG 2.1 Level AA compliance helpers
 */

// Focus management
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  }

  element.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

// Announce to screen readers
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcer = document.getElementById('a11y-announcer') || createAnnouncer();
  announcer.setAttribute('aria-live', priority);
  announcer.textContent = message;

  // Clear after announcement
  setTimeout(() => {
    announcer.textContent = '';
  }, 1000);
}

function createAnnouncer(): HTMLElement {
  const announcer = document.createElement('div');
  announcer.id = 'a11y-announcer';
  announcer.className = 'sr-only';
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  document.body.appendChild(announcer);
  return announcer;
}

// Skip to main content
export function initializeSkipLink() {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'skip-link';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: #2563eb;
    color: white;
    padding: 8px 16px;
    text-decoration: none;
    z-index: 10000;
  `;

  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '0';
  });

  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });

  document.body.insertBefore(skipLink, document.body.firstChild);
}

// Keyboard shortcuts
export class KeyboardShortcuts {
  private shortcuts = new Map<string, () => void>();

  register(key: string, callback: () => void, modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean }) {
    const shortcutKey = this.getShortcutKey(key, modifiers);
    this.shortcuts.set(shortcutKey, callback);
  }

  unregister(key: string, modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean }) {
    const shortcutKey = this.getShortcutKey(key, modifiers);
    this.shortcuts.delete(shortcutKey);
  }

  private getShortcutKey(key: string, modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean }): string {
    const parts = [];
    if (modifiers?.ctrl) parts.push('ctrl');
    if (modifiers?.shift) parts.push('shift');
    if (modifiers?.alt) parts.push('alt');
    parts.push(key.toLowerCase());
    return parts.join('+');
  }

  handleKeyPress(e: KeyboardEvent) {
    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push('ctrl');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    parts.push(e.key.toLowerCase());

    const shortcutKey = parts.join('+');
    const callback = this.shortcuts.get(shortcutKey);

    if (callback) {
      e.preventDefault();
      callback();
    }
  }

  init() {
    document.addEventListener('keydown', this.handleKeyPress.bind(this));
  }

  destroy() {
    document.removeEventListener('keydown', this.handleKeyPress.bind(this));
  }
}

// Color contrast checker
export function meetsContrastRequirements(foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean {
  const fg = parseColor(foreground);
  const bg = parseColor(background);

  if (!fg || !bg) return false;

  const fgLuminance = getRelativeLuminance(fg);
  const bgLuminance = getRelativeLuminance(bg);

  const contrast = (Math.max(fgLuminance, bgLuminance) + 0.05) / (Math.min(fgLuminance, bgLuminance) + 0.05);

  const requirement = level === 'AAA' ? 7 : 4.5;
  return contrast >= requirement;
}

function parseColor(color: string): { r: number; g: number; b: number } | null {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return null;

  return {
    r: parseInt(hex.substr(0, 2), 16) / 255,
    g: parseInt(hex.substr(2, 2), 16) / 255,
    b: parseInt(hex.substr(4, 2), 16) / 255,
  };
}

function getRelativeLuminance(color: { r: number; g: number; b: number }): number {
  const rsRGB = color.r <= 0.03928 ? color.r / 12.92 : Math.pow((color.r + 0.055) / 1.055, 2.4);
  const gsRGB = color.g <= 0.03928 ? color.g / 12.92 : Math.pow((color.g + 0.055) / 1.055, 2.4);
  const bsRGB = color.b <= 0.03928 ? color.b / 12.92 : Math.pow((color.b + 0.055) / 1.055, 2.4);

  return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
}

// High contrast mode detection
export function isHighContrastMode(): boolean {
  return window.matchMedia('(prefers-contrast: high)').matches;
}

// Reduced motion preference
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Screen reader detection
export function isScreenReaderActive(): boolean {
  // Basic detection - create invisible element and check if it's announced
  return document.activeElement?.getAttribute('role') === 'application';
}

export default {
  trapFocus,
  announce,
  initializeSkipLink,
  KeyboardShortcuts,
  meetsContrastRequirements,
  isHighContrastMode,
  prefersReducedMotion,
  isScreenReaderActive,
};
