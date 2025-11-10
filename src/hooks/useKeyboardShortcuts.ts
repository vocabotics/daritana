import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  category?: string;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Hook to register keyboard shortcuts
 * @param options Configuration for shortcuts
 */
export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const matchingShortcut = shortcuts.find((shortcut) => {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;
        const metaMatches = shortcut.meta ? event.metaKey : !event.metaKey;

        return keyMatches && ctrlMatches && shiftMatches && altMatches;
      });

      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.action();
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * Format keyboard shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  
  if (shortcut.ctrl || shortcut.meta) {
    parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) {
    parts.push('Shift');
  }
  if (shortcut.alt) {
    parts.push('Alt');
  }
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join(' + ');
}

/**
 * Default application shortcuts
 */
export const defaultShortcuts = {
  navigation: [
    {
      key: 'd',
      ctrl: true,
      description: 'Go to Dashboard',
      category: 'Navigation',
    },
    {
      key: 'p',
      ctrl: true,
      description: 'Go to Projects',
      category: 'Navigation',
    },
    {
      key: 'k',
      ctrl: true,
      description: 'Go to Kanban Board',
      category: 'Navigation',
    },
    {
      key: 't',
      ctrl: true,
      description: 'Go to Timeline',
      category: 'Navigation',
    },
  ],
  actions: [
    {
      key: 'n',
      ctrl: true,
      description: 'Create New',
      category: 'Actions',
    },
    {
      key: 's',
      ctrl: true,
      description: 'Save',
      category: 'Actions',
    },
    {
      key: 'f',
      ctrl: true,
      description: 'Search',
      category: 'Actions',
    },
    {
      key: '/',
      ctrl: false,
      description: 'Focus Search',
      category: 'Actions',
    },
  ],
  ui: [
    {
      key: 'b',
      ctrl: true,
      description: 'Toggle Sidebar',
      category: 'UI',
    },
    {
      key: '?',
      ctrl: false,
      shift: true,
      description: 'Show Keyboard Shortcuts',
      category: 'UI',
    },
    {
      key: 'Escape',
      ctrl: false,
      description: 'Close Dialog/Modal',
      category: 'UI',
    },
  ],
};
