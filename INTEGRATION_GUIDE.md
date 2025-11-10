# 🔧 Integration Guide - How to Use All New Utilities

This guide shows you how to integrate all the new utilities created during the fixes into your existing pages and components.

---

## 📋 Table of Contents

1. [Loading States with useDataFetch](#1-loading-states-with-usedatafetch)
2. [Empty States with DataStateWrapper](#2-empty-states-with-datastatewrapper)
3. [Toast Notifications](#3-toast-notifications)
4. [Error Handling](#4-error-handling)
5. [Keyboard Shortcuts](#5-keyboard-shortcuts)
6. [Dark Mode](#6-dark-mode)
7. [Skeleton Components](#7-skeleton-components)
8. [Empty State Components](#8-empty-state-components)

---

## 1. Loading States with useDataFetch

### Hook: `src/hooks/useDataFetch.ts`

**Purpose**: Automatically handle loading, error, and empty states for data fetching.

### Basic Usage

```typescript
import { useDataFetch } from '@/hooks/useDataFetch';
import { projectService } from '@/services/project.service';

function ProjectsPage() {
  const { data, loading, error, isEmpty, refetch } = useDataFetch({
    fetchFn: () => projectService.getAll(),
    dependencies: [], // Re-fetch when these change
  });

  if (loading) return <ProjectCardSkeleton />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;
  if (isEmpty) return <NoProjectsEmptyState onCreateProject={handleCreate} />;

  return <ProjectList projects={data} />;
}
```

### For Lists/Arrays

```typescript
import { useListFetch } from '@/hooks/useDataFetch';

function TasksPage() {
  const { items, loading, error, isEmpty, refetch } = useListFetch({
    fetchFn: () => taskService.getAll(),
    dependencies: [],
  });

  // items is guaranteed to be an array ([] if empty)
  return <TaskList tasks={items} />;
}
```

---

## 2. Empty States with DataStateWrapper

### Component: `src/components/DataStateWrapper.tsx`

**Purpose**: Wrap your content with automatic loading/error/empty state handling.

### Full Page Wrapper

```typescript
import { DataStateWrapper } from '@/components/DataStateWrapper';
import { NoProjectsEmptyState } from '@/components/ui/empty-state';

function ProjectsPage() {
  const { data, loading, error, refetch } = useDataFetch({
    fetchFn: () => projectService.getAll(),
  });

  return (
    <DataStateWrapper
      loading={loading}
      error={error}
      isEmpty={!data || data.length === 0}
      emptyState={<NoProjectsEmptyState onCreateProject={handleCreate} />}
      onRetry={refetch}
    >
      <ProjectGrid projects={data} />
    </DataStateWrapper>
  );
}
```

### List Wrapper (with List Skeleton)

```typescript
import { ListStateWrapper } from '@/components/DataStateWrapper';

function TeamPage() {
  const { items, loading, error, refetch } = useListFetch({
    fetchFn: () => teamService.getMembers(),
  });

  return (
    <ListStateWrapper
      loading={loading}
      error={error}
      isEmpty={items.length === 0}
      emptyState={<NoTeamMembersEmptyState onInvite={handleInvite} />}
      itemCount={5} // Number of skeleton items to show
      onRetry={refetch}
    >
      <TeamMemberList members={items} />
    </ListStateWrapper>
  );
}
```

### Card Grid Wrapper

```typescript
import { CardGridStateWrapper } from '@/components/DataStateWrapper';

function ProjectsPage() {
  return (
    <CardGridStateWrapper
      loading={loading}
      error={error}
      isEmpty={projects.length === 0}
      emptyState={<NoProjectsEmptyState />}
      cardCount={6} // Number of skeleton cards
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map(project => <ProjectCard key={project.id} project={project} />)}
      </div>
    </CardGridStateWrapper>
  );
}
```

### Table Wrapper

```typescript
import { TableStateWrapper } from '@/components/DataStateWrapper';

function InvoicesPage() {
  return (
    <TableStateWrapper
      loading={loading}
      error={error}
      isEmpty={invoices.length === 0}
      emptyState={<NoInvoicesEmptyState />}
      rowCount={10} // Number of skeleton rows
    >
      <InvoiceTable invoices={invoices} />
    </TableStateWrapper>
  );
}
```

---

## 3. Toast Notifications

### Utility: `src/utils/toast.ts`

**Purpose**: Consistent toast notifications across the app.

### Replace Old Toast Imports

```typescript
// ❌ OLD - Direct import from sonner
import { toast } from 'sonner';
toast.success('Project created');

// ✅ NEW - Use our utility
import { toast, notifications } from '@/utils/toast';
notifications.project.created();
```

### Basic Toast Usage

```typescript
import { toast } from '@/utils/toast';

// Success
toast.success('Operation completed');

// Error
toast.error('Something went wrong');

// With description
toast.success('Project created', {
  description: 'You can now add tasks and team members',
});

// With action button
toast.success('File uploaded', {
  action: {
    label: 'View',
    onClick: () => navigateTo('/files'),
  },
});
```

### Predefined Notifications

```typescript
import { notifications } from '@/utils/toast';

// Projects
notifications.project.created();
notifications.project.updated();
notifications.project.deleted();
notifications.project.error('create'); // "Failed to create project"

// Tasks
notifications.task.created();
notifications.task.assigned('John Doe');
notifications.task.completed();

// Documents
notifications.document.uploaded();
notifications.document.uploaded(3); // "3 documents uploaded"

// Team
notifications.team.memberAdded('Jane Smith');
notifications.team.inviteSent('[email protected]');

// Auth
notifications.auth.loginSuccess();
notifications.auth.sessionExpired();

// Generic
notifications.generic.copied();
notifications.generic.saved();
notifications.generic.deleted();
```

### Promise-based (Async Operations)

```typescript
toast.promise(
  fetch('/api/projects').then(r => r.json()),
  {
    loading: 'Saving project...',
    success: 'Project saved successfully',
    error: 'Failed to save project',
  }
);
```

---

## 4. Error Handling

### Utility: `src/utils/serviceErrorHandler.ts`

**Purpose**: Consistent error handling for all service calls.

### Wrap Service Calls

```typescript
import { withErrorHandling, withRetry } from '@/utils/serviceErrorHandler';

// Basic error handling
async function createProject(data: ProjectData) {
  return withErrorHandling(
    () => projectService.create(data),
    {
      operation: 'create project',
      showToast: true,
    }
  );
}

// With retry logic (for network failures)
async function fetchProjects() {
  return withRetry(
    () => projectService.getAll(),
    {
      operation: 'fetch projects',
      maxRetries: 3,
      retryDelay: 1000,
    }
  );
}

// Custom error handling
async function deleteProject(id: string) {
  return withErrorHandling(
    () => projectService.delete(id),
    {
      operation: 'delete project',
      showToast: true,
      onError: (error) => {
        // Custom logic
        console.error('Failed to delete:', error);
        trackAnalytics('project_delete_failed');
      },
    }
  );
}
```

---

## 5. Keyboard Shortcuts

### Already Configured

The keyboard shortcuts are already set up globally. They work automatically in all pages.

### Available Shortcuts

- `Ctrl/⌘ + D` - Go to Dashboard
- `Ctrl/⌘ + P` - Go to Projects
- `Ctrl/⌘ + K` - Go to Kanban
- `Ctrl/⌘ + T` - Go to Timeline
- `Ctrl/⌘ + M` - Go to Financial
- `Ctrl/⌘ + N` - Create New (emits custom event)
- `/` - Focus Search
- `Ctrl/⌘ + B` - Toggle Sidebar (emits custom event)
- `Shift + ?` - Show Shortcuts Dialog
- `Escape` - Close Dialog/Modal

### Listen to Custom Events

```typescript
// In your component
useEffect(() => {
  const handleCreateNew = () => {
    setShowCreateDialog(true);
  };

  window.addEventListener('keyboard-create-new', handleCreateNew);
  return () => window.removeEventListener('keyboard-create-new', handleCreateNew);
}, []);
```

---

## 6. Dark Mode

### Already Configured

Dark mode is available globally. Use the theme toggle in the header.

### Access Theme in Components

```typescript
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme, setTheme, actualTheme } = useTheme();

  // theme: 'light' | 'dark' | 'system'
  // actualTheme: 'light' | 'dark' (resolved value)

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme('dark')}>Switch to Dark</button>
    </div>
  );
}
```

### Add Theme Toggle

```typescript
import { ThemeToggle } from '@/components/ThemeToggle';

// Full dropdown
<ThemeToggle />

// Compact toggle button
import { ThemeToggleCompact } from '@/components/ThemeToggle';
<ThemeToggleCompact />
```

---

## 7. Skeleton Components

### Available Skeletons: `src/components/ui/skeleton.tsx`

- `Skeleton` - Base component
- `PageHeaderSkeleton` - Page headers
- `CardSkeleton` - Single card
- `TableSkeleton` - Tables (customizable rows)
- `ProjectCardSkeleton` - Project cards
- `DashboardStatsSkeleton` - 4-stat grid
- `ListSkeleton` - Lists with avatars
- `FormSkeleton` - Form fields
- `ChartSkeleton` - Charts
- `KanbanSkeleton` - Kanban boards
- `TimelineSkeleton` - Timeline events
- `FullPageSkeleton` - Complete page layout

### Usage

```typescript
import { ProjectCardSkeleton, TableSkeleton } from '@/components/ui/skeleton';

function ProjectsPage() {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
      </div>
    );
  }
  // ... rest of component
}

// Table with custom rows
<TableSkeleton rows={15} />

// List with custom items
<ListSkeleton items={10} />
```

---

## 8. Empty State Components

### Available Empty States: `src/components/ui/empty-state.tsx`

- `EmptyState` - Base customizable component
- `NoProjectsEmptyState` - Projects list
- `NoTasksEmptyState` - Tasks/Kanban
- `NoDocumentsEmptyState` - Documents
- `NoTeamMembersEmptyState` - Team page
- `NoEventsEmptyState` - Calendar
- `SearchEmptyState` - No search results
- `FilterEmptyState` - No filter matches
- `ErrorEmptyState` - Error with retry
- `NoNotificationsEmptyState` - All caught up
- `NoFilesEmptyState` - Empty folder

### Usage

```typescript
import { NoProjectsEmptyState, SearchEmptyState } from '@/components/ui/empty-state';

// Projects page
if (projects.length === 0) {
  return <NoProjectsEmptyState onCreateProject={handleCreate} />;
}

// Search results
if (searchResults.length === 0) {
  return <SearchEmptyState searchQuery={query} />;
}

// Custom empty state
import { EmptyState } from '@/components/ui/empty-state';
import { FileText } from 'lucide-react';

<EmptyState
  icon={FileText}
  title="No reports yet"
  description="Generate your first report to get insights"
  action={{
    label: 'Generate Report',
    onClick: handleGenerate,
  }}
  secondaryAction={{
    label: 'Learn More',
    onClick: openDocs,
  }}
/>
```

---

## 🚀 Quick Migration Checklist

### For Each Page:

1. **Replace data fetching**:
   ```typescript
   // Before
   const [data, setData] = useState([]);
   const [loading, setLoading] = useState(true);
   
   useEffect(() => {
     fetchData();
   }, []);
   
   // After
   const { data, loading, error, isEmpty, refetch } = useListFetch({
     fetchFn: () => service.getAll(),
   });
   ```

2. **Add loading state**:
   ```typescript
   if (loading) return <FullPageSkeleton />;
   // or
   if (loading) return <ProjectCardSkeleton />;
   ```

3. **Add error state**:
   ```typescript
   if (error) return <ErrorEmptyState message={error.message} onRetry={refetch} />;
   ```

4. **Add empty state**:
   ```typescript
   if (isEmpty) return <NoProjectsEmptyState onCreateProject={handleCreate} />;
   ```

5. **Update toast notifications**:
   ```typescript
   // Before
   toast.success('Done');
   
   // After
   notifications.project.created();
   ```

6. **Add error handling to mutations**:
   ```typescript
   const handleCreate = async (data) => {
     const result = await withErrorHandling(
       () => projectService.create(data),
       { operation: 'create project' }
     );
     
     if (result) {
       notifications.project.created();
       refetch();
     }
   };
   ```

---

## 📊 Priority Pages to Migrate

### High Priority (User-facing)
1. `/projects` - Projects list
2. `/kanban` - Tasks/Kanban board
3. `/timeline` - Timeline view
4. `/team` - Team members
5. `/documents` - Document library
6. `/financial` - Invoices/Quotations

### Medium Priority
7. `/dashboard` - Dashboard
8. `/community` - Community posts
9. `/marketplace` - Marketplace
10. `/hr` - HR dashboard

### Low Priority
- Admin pages
- Settings pages
- Rarely-used features

---

## ✅ Benefits After Migration

- ✅ Consistent loading experience (no more blank screens)
- ✅ Helpful empty states (users know what to do next)
- ✅ Proper error handling (users see what went wrong)
- ✅ Consistent notifications (professional feedback)
- ✅ Better accessibility (screen readers, keyboard nav)
- ✅ Performance optimized (memoized shortcuts, skeletons)

---

## 🎯 Example: Complete Page Migration

### Before

```typescript
function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => {
        setProjects(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {projects.map(p => <ProjectCard key={p.id} project={p} />)}
    </div>
  );
}
```

### After

```typescript
import { useListFetch } from '@/hooks/useDataFetch';
import { CardGridStateWrapper } from '@/components/DataStateWrapper';
import { NoProjectsEmptyState } from '@/components/ui/empty-state';
import { projectService } from '@/services/project.service';

function ProjectsPage() {
  const { items: projects, loading, error, refetch } = useListFetch({
    fetchFn: () => projectService.getAll(),
  });

  return (
    <CardGridStateWrapper
      loading={loading}
      error={error}
      isEmpty={projects.length === 0}
      emptyState={<NoProjectsEmptyState onCreateProject={handleCreate} />}
      onRetry={refetch}
      cardCount={6}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map(p => <ProjectCard key={p.id} project={p} />)}
      </div>
    </CardGridStateWrapper>
  );
}
```

**Improvements**:
- ✅ Skeleton loading (6 project cards)
- ✅ Error state with retry button
- ✅ Empty state with "Create Project" button
- ✅ Type-safe with TypeScript
- ✅ Clean, declarative code
- ✅ Consistent with rest of app

---

**Need Help?** Check the examples in:
- `src/components/DataStateWrapper.tsx`
- `src/hooks/useDataFetch.ts`
- `src/utils/toast.ts`
- `src/utils/serviceErrorHandler.ts`
