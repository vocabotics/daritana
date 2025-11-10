import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useKeyboardShortcuts, formatShortcut, KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';
import { Keyboard } from 'lucide-react';

interface ShortcutCategory {
  name: string;
  shortcuts: KeyboardShortcut[];
}

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Memoize shortcuts to prevent re-creation on every render
  const shortcutCategories: ShortcutCategory[] = useMemo(() => [
    {
      name: 'Navigation',
      shortcuts: [
        {
          key: 'd',
          ctrl: true,
          description: 'Go to Dashboard',
          action: () => navigate('/dashboard'),
        },
        {
          key: 'p',
          ctrl: true,
          description: 'Go to Projects',
          action: () => navigate('/projects'),
        },
        {
          key: 'k',
          ctrl: true,
          description: 'Go to Kanban Board',
          action: () => navigate('/kanban'),
        },
        {
          key: 't',
          ctrl: true,
          description: 'Go to Timeline',
          action: () => navigate('/timeline'),
        },
        {
          key: 'm',
          ctrl: true,
          description: 'Go to Financial',
          action: () => navigate('/financial'),
        },
      ],
    },
    {
      name: 'Actions',
      shortcuts: [
        {
          key: 'n',
          ctrl: true,
          description: 'Create New Item',
          action: () => {
            // Emit custom event for create new
            window.dispatchEvent(new CustomEvent('keyboard-create-new'));
          },
        },
        {
          key: '/',
          description: 'Focus Search',
          action: () => {
            const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
            searchInput?.focus();
          },
        },
      ],
    },
    {
      name: 'UI Controls',
      shortcuts: [
        {
          key: 'b',
          ctrl: true,
          description: 'Toggle Sidebar',
          action: () => {
            // Emit custom event for sidebar toggle
            window.dispatchEvent(new CustomEvent('keyboard-toggle-sidebar'));
          },
        },
        {
          key: '?',
          shift: true,
          description: 'Show Keyboard Shortcuts',
          action: () => setOpen(true),
        },
        {
          key: 'Escape',
          description: 'Close Dialog/Modal',
          action: () => setOpen(false),
        },
      ],
    },
  ], [navigate, setOpen]);

  // Flatten all shortcuts for the hook
  const allShortcuts = useMemo(() => shortcutCategories.flatMap(category =>
    category.shortcuts.map(shortcut => ({
      ...shortcut,
      category: category.name,
    }))
  ), [shortcutCategories]);

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: allShortcuts,
    enabled: true,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and work more efficiently
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {shortcutCategories.map((category) => (
            <div key={category.name}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {category.name}
              </h3>
              <div className="space-y-2">
                {category.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted border border-border rounded">
                      {formatShortcut(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
          <p>
            Press <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded">Shift</kbd> +{' '}
            <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded">?</kbd> to toggle
            this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Keyboard shortcuts button for help menu
export function KeyboardShortcutsButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-muted"
    >
      <Keyboard className="h-4 w-4" />
      Keyboard Shortcuts
      <kbd className="ml-auto px-1.5 py-0.5 text-xs bg-muted border border-border rounded">
        ?
      </kbd>
    </button>
  );
}
