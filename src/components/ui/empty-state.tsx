import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import {
  FolderOpen,
  FileText,
  Users,
  Briefcase,
  Calendar,
  CheckSquare,
  Search,
  Filter,
  AlertCircle,
  Inbox,
  LucideIcon,
} from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className="rounded-full bg-muted p-6 mb-4">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || 'default'}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant="outline">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Predefined Empty States for common scenarios

export function NoProjectsEmptyState({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <EmptyState
      icon={Briefcase}
      title="No projects yet"
      description="Create your first project to start managing your architecture and interior design work. Track progress, manage tasks, and collaborate with your team."
      action={{
        label: 'Create Project',
        onClick: onCreateProject,
      }}
      secondaryAction={{
        label: 'Import Project',
        onClick: () => console.log('Import project'),
      }}
    />
  );
}

export function NoTasksEmptyState({ onCreateTask }: { onCreateTask: () => void }) {
  return (
    <EmptyState
      icon={CheckSquare}
      title="No tasks to display"
      description="Break down your project into manageable tasks. Assign team members, set deadlines, and track progress on your kanban board."
      action={{
        label: 'Add Task',
        onClick: onCreateTask,
      }}
    />
  );
}

export function NoDocumentsEmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No documents uploaded"
      description="Upload drawings, specifications, contracts, and other project documents. Keep all your files organized and accessible to your team."
      action={{
        label: 'Upload Document',
        onClick: onUpload,
      }}
      secondaryAction={{
        label: 'Browse Templates',
        onClick: () => console.log('Browse templates'),
      }}
    />
  );
}

export function NoTeamMembersEmptyState({ onInvite }: { onInvite: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No team members yet"
      description="Invite architects, designers, contractors, and clients to collaborate on your projects. Assign roles and manage permissions for each member."
      action={{
        label: 'Invite Team Member',
        onClick: onInvite,
      }}
    />
  );
}

export function NoEventsEmptyState({ onCreateEvent }: { onCreateEvent: () => void }) {
  return (
    <EmptyState
      icon={Calendar}
      title="No events scheduled"
      description="Schedule site visits, client meetings, design reviews, and project milestones. Keep your team informed and on track."
      action={{
        label: 'Create Event',
        onClick: onCreateEvent,
      }}
    />
  );
}

export function SearchEmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find anything matching "${searchQuery}". Try adjusting your search terms or filters.`}
    />
  );
}

export function FilterEmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <EmptyState
      icon={Filter}
      title="No items match your filters"
      description="Try adjusting or clearing your filters to see more results."
      action={{
        label: 'Clear Filters',
        onClick: onClearFilters,
        variant: 'outline',
      }}
    />
  );
}

export function ErrorEmptyState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Something went wrong"
      description={message || 'An error occurred while loading data. Please try again.'}
      action={
        onRetry
          ? {
              label: 'Try Again',
              onClick: onRetry,
            }
          : undefined
      }
    />
  );
}

export function NoNotificationsEmptyState() {
  return (
    <EmptyState
      icon={Inbox}
      title="You're all caught up!"
      description="No new notifications. We'll notify you when there's something important."
    />
  );
}

export function NoFilesEmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <EmptyState
      icon={FolderOpen}
      title="This folder is empty"
      description="Upload files, create folders, or connect cloud storage to organize your project assets."
      action={{
        label: 'Upload Files',
        onClick: onUpload,
      }}
      secondaryAction={{
        label: 'Connect Cloud Storage',
        onClick: () => console.log('Connect cloud'),
      }}
    />
  );
}

// Example usage component showing all states
export function EmptyStateExamples() {
  return (
    <div className="space-y-12 p-8">
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Projects Empty State</h2>
        <NoProjectsEmptyState onCreateProject={() => console.log('Create')} />
      </div>
      
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Tasks Empty State</h2>
        <NoTasksEmptyState onCreateTask={() => console.log('Create task')} />
      </div>
      
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Search Empty State</h2>
        <SearchEmptyState searchQuery="floor plans" />
      </div>
      
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Error State</h2>
        <ErrorEmptyState
          message="Failed to load projects. Please check your connection."
          onRetry={() => console.log('Retry')}
        />
      </div>
    </div>
  );
}
