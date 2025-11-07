import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { 
  FolderPlus, 
  Plus, 
  Users, 
  ShoppingCart, 
  MessageSquare, 
  DollarSign, 
  CheckSquare, 
  BarChart3,
  FileText,
  Package,
  Home,
  Calendar,
  Mail
} from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
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
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md'
}: EmptyStateProps) {
  const sizeClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-20'
  };

  const iconSizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center space-y-4',
      sizeClasses[size],
      className
    )}>
      {icon && (
        <div className={cn(
          'text-gray-400 mb-2',
          iconSizeClasses[size]
        )}>
          {icon}
        </div>
      )}
      
      <div className="space-y-2">
        <h3 className={cn(
          'font-semibold text-gray-900',
          size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'
        )}>
          {title}
        </h3>
        <p className={cn(
          'text-gray-500 max-w-md mx-auto',
          size === 'sm' ? 'text-sm' : 'text-base'
        )}>
          {description}
        </p>
      </div>

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || 'default'}
              size={size === 'sm' ? 'sm' : 'default'}
              className="min-w-[140px]"
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              size={size === 'sm' ? 'sm' : 'default'}
              className="min-w-[140px]"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Pre-configured empty states for common scenarios
export const ProjectsEmptyState = ({ onCreateProject }: { onCreateProject: () => void }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={<FolderPlus className="w-16 h-16" />}
      title={t('projects.noProjectsTitle')}
      description={t('projects.noProjectsDescription')}
      action={{
        label: t('projects.createProject'),
        onClick: onCreateProject
      }}
      secondaryAction={{
        label: t('projects.importProjects'),
        onClick: () => console.log('Import projects')
      }}
    />
  );
};

export const TasksEmptyState = ({ onCreateTask }: { onCreateTask: () => void }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={<CheckSquare className="w-16 h-16" />}
      title={t('tasks.noTasksTitle')}
      description={t('tasks.noTasksDescription')}
      action={{
        label: t('tasks.createTask'),
        onClick: onCreateTask
      }}
    />
  );
};

export const TeamEmptyState = ({ onInviteTeam }: { onInviteTeam: () => void }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={<Users className="w-16 h-16" />}
      title={t('team.noTeamTitle') || 'Build your team'}
      description={t('team.noTeamDescription') || 'Invite architects, designers, contractors, and clients to collaborate on your projects.'}
      action={{
        label: t('team.inviteMembers') || 'Invite Team Members',
        onClick: onInviteTeam
      }}
    />
  );
};

export const MarketplaceEmptyState = ({ onBrowseProducts }: { onBrowseProducts: () => void }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={<ShoppingCart className="w-16 h-16" />}
      title={t('marketplace.noProductsTitle')}
      description={t('marketplace.noProductsDescription')}
      action={{
        label: t('marketplace.browseProducts'),
        onClick: onBrowseProducts
      }}
      secondaryAction={{
        label: t('marketplace.becomeVendor'),
        onClick: () => console.log('Become vendor')
      }}
    />
  );
};

export const CommunityEmptyState = ({ onJoinCommunity }: { onJoinCommunity: () => void }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={<MessageSquare className="w-16 h-16" />}
      title={t('community.noCommunityTitle')}
      description={t('community.noCommunityDescription')}
      action={{
        label: t('community.exploreCommunity'),
        onClick: onJoinCommunity
      }}
      secondaryAction={{
        label: t('community.createFirstPost'),
        onClick: () => console.log('Create post')
      }}
    />
  );
};

export const FinancialEmptyState = ({ onCreateInvoice }: { onCreateInvoice: () => void }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={<DollarSign className="w-16 h-16" />}
      title={t('financial.title')}
      description={t('financial.overview')}
      action={{
        label: t('financial.createInvoice'),
        onClick: onCreateInvoice
      }}
      secondaryAction={{
        label: t('financial.budgets'),
        onClick: () => console.log('Setup budget')
      }}
    />
  );
};

export const InvoicesEmptyState = ({ onCreateInvoice }: { onCreateInvoice: () => void }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={<FileText className="w-16 h-16" />}
      title={t('financial.noInvoicesTitle')}
      description={t('financial.noInvoicesDescription')}
      action={{
        label: t('financial.createInvoice'),
        onClick: onCreateInvoice
      }}
      size="md"
    />
  );
};

export const ExpensesEmptyState = ({ onAddExpense }: { onAddExpense: () => void }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={<Package className="w-16 h-16" />}
      title={t('financial.noExpensesTitle')}
      description={t('financial.noExpensesDescription')}
      action={{
        label: t('financial.addExpense'),
        onClick: onAddExpense
      }}
      size="md"
    />
  );
};

export const DashboardEmptyState = ({ onCustomizeDashboard }: { onCustomizeDashboard: () => void }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={<BarChart3 className="w-16 h-16" />}
      title={t('dashboard.customizeLayout')}
      description={t('dashboard.addFirstWidget')}
      action={{
        label: t('dashboard.addWidget'),
        onClick: onCustomizeDashboard
      }}
      size="sm"
    />
  );
};

export const FilesEmptyState = ({ onUploadFile }: { onUploadFile: () => void }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={<Home className="w-16 h-16" />}
      title={t('documents.uploadFiles') || 'Upload project files'}
      description={t('documents.uploadDescription') || 'Store and organize drawings, documents, photos, and other project materials in one place.'}
      action={{
        label: t('common.upload'),
        onClick: onUploadFile
      }}
      size="md"
    />
  );
};

export const CalendarEmptyState = ({ onCreateEvent }: { onCreateEvent: () => void }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={<Calendar className="w-16 h-16" />}
      title={t('calendar.scheduleWork') || 'Schedule your work'}
      description={t('calendar.scheduleDescription') || 'Create events, set project milestones, and manage meeting schedules with your team and clients.'}
      action={{
        label: t('calendar.createEvent') || 'Create Event',
        onClick: onCreateEvent
      }}
      size="md"
    />
  );
};

export const NotificationsEmptyState = () => {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={<Mail className="w-16 h-16" />}
      title={t('notifications.allCaughtUp') || "You're all caught up!"}
      description={t('notifications.noNewNotifications') || "No new notifications. We'll let you know when there are updates on your projects."}
      size="sm"
    />
  );
};