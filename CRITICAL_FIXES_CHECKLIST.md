# 🔧 Critical Fixes Checklist - DO FIRST!

This checklist contains **ONLY** the 8 critical issues that must be fixed immediately.

---

## ✅ Fix Checklist

### [ ] 1. Install Missing ESLint Dependencies (5 min)

```bash
npm install --save-dev @eslint/js eslint-plugin-react-hooks eslint-plugin-react-refresh
```

**Test**: Run `npm run lint` - should work without errors

---

### [ ] 2. Fix ChartSkeleton Template String (1 min)

**File**: `src/components/ui/skeleton.tsx:158`

**Change**:
```typescript
// Line 158 - BEFORE
style={{ height: \`\${Math.random() * 100}%\` }}

// AFTER  
style={{ height: `${Math.random() * 100}%` }}
```

**Test**: View any page with ChartSkeleton - bars should have random heights

---

### [ ] 3. Remove Duplicate InstallPrompt (1 min)

**File**: `src/App.tsx:351`

**Change**: DELETE line 351
```typescript
<InstallPrompt />  // ❌ DELETE THIS LINE
```

Keep the one at lines 138-142 with props.

**Test**: Check app - only one install prompt should appear

---

### [ ] 4. Integrate ThemeProvider (5 min)

**File**: `src/main.tsx`

**Change**: Replace entire file with:
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@/contexts/ThemeContext'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
```

**Test**: Click theme toggle in header - dark mode should work

---

### [ ] 5. Add KeyboardShortcutsDialog to App (2 min)

**File**: `src/App.tsx`

**Change**: Add import at top:
```typescript
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcutsDialog';
```

Add component after line 354:
```typescript
              <ARIAFloatingAssistant />
              <KeyboardShortcutsDialog />  // ✅ ADD THIS
            </>
```

**Test**: Press `Shift + ?` - shortcuts dialog should open

---

### [ ] 6. Fix Nested Dialog in KeyboardShortcutsButton (10 min)

**File**: `src/components/KeyboardShortcutsDialog.tsx`

**Change**: Replace KeyboardShortcutsButton function (lines 177-200):
```typescript
// Keyboard shortcuts button for help menu
export function KeyboardShortcutsButton({ onOpenDialog }: { onOpenDialog: () => void }) {
  return (
    <button
      onClick={onOpenDialog}
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
```

**Test**: Button should trigger parent dialog instead of creating nested one

---

### [ ] 7. Fix Zod Version (5 min)

**File**: `package.json:99`

**Change**:
```bash
npm uninstall zod
npm install zod@^3.22.4
```

**Test**: Forms should validate correctly

---

### [ ] 8. Re-enable React StrictMode (ALREADY DONE IN FIX #4)

**File**: `src/main.tsx`

**Note**: This is fixed in step #4 when we add ThemeProvider.

**Test**: Check console - should see React StrictMode warnings in dev

---

## 🎯 After Completing All 8:

Run these commands to verify:

```bash
# 1. Linting works
npm run lint

# 2. TypeScript compiles
npx tsc --noEmit

# 3. App runs
npm run dev
```

### Manual Tests:
1. ✅ Dark mode toggle works
2. ✅ Press Shift+? - keyboard shortcuts dialog appears
3. ✅ Only one PWA install prompt appears
4. ✅ Chart skeletons show random bar heights
5. ✅ No console errors on page load

---

## ⏱️ Total Time Estimate

- **Fastest**: 15 minutes (if you're quick)
- **Average**: 30 minutes (careful testing)
- **Includes**: Testing each fix

---

## 🚨 Critical Path

You **MUST** do these in order:

1. Fix ESLint first (needed for other checks)
2. Fix main.tsx (enables dark mode AND StrictMode)
3. Fix remaining 5 issues
4. Test everything

---

## ✅ Success Criteria

After these 8 fixes:
- ✅ `npm run lint` passes
- ✅ No console errors
- ✅ Dark mode works
- ✅ Keyboard shortcuts work
- ✅ All Amazing 5-Pack features functional

**Ready for the next 37 issues!** 🚀
