# ActivityFeed Component

A comprehensive real-time activity feed component for tracking project updates, team actions, and system events in the Daritana architecture management platform.

## Features

### Core Functionality
- **Real-time Updates**: WebSocket integration for live activity streaming
- **Activity Types**: Support for 25+ different activity types including tasks, files, team, milestones, budgets, and more
- **Smart Grouping**: Activities automatically grouped by date with collapsible sections
- **Infinite Scroll**: Automatic loading of more activities as you scroll
- **Unread Tracking**: Visual indicators and badge for unread activities
- **Rich Metadata**: Display of progress, priority, file sizes, amounts, and attachments

### Filtering & Search
- **Type Filter**: Filter by activity type (tasks, files, comments, etc.)
- **User Filter**: Show activities from specific team members
- **Date Range**: Filter by today, this week, this month, or all time
- **Search**: Full-text search across all activity fields
- **Unread Only**: Toggle to show only unread activities

### User Actions
- **Mark as Read**: Individual or bulk marking of activities as read
- **Undo Actions**: Revert certain actions directly from the feed
- **Quick Actions**: View details, add comments, archive activities
- **Settings**: Customize feed preferences and notifications

### Visual Design
- **Activity Icons**: Color-coded icons for each activity type
- **User Avatars**: Display user profile pictures with fallbacks
- **Priority Badges**: Visual indicators for urgent/high priority items
- **Progress Indicators**: Show completion percentages for tasks
- **Smooth Animations**: Framer Motion animations for new items
- **Dark Mode**: Full dark mode support

## Installation

The component is already integrated into the project. To use it in a new location:

```tsx
import { ActivityFeed } from '@/components/collaboration';
```

## Usage Examples

### Basic Usage
```tsx
<ActivityFeed projectId="project-1" />
```

### Dashboard Widget (Compact)
```tsx
<ActivityFeed
  projectId={currentProject?.id}
  compact={true}
  showFilters={false}
  showNotificationBadge={true}
  maxHeight="350px"
/>
```

### Full Featured
```tsx
<ActivityFeed
  projectId="project-1"
  showFilters={true}
  showNotificationBadge={true}
  autoRefresh={true}
  refreshInterval={30000}
  maxHeight="600px"
/>
```

### Project Detail Sidebar
```tsx
<ActivityFeed
  projectId={projectId}
  compact={true}
  showFilters={false}
  autoRefresh={true}
  maxHeight="100vh"
  className="sticky top-0"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `projectId` | `string` | `undefined` | Filter activities by project ID |
| `compact` | `boolean` | `false` | Show compact view with less detail |
| `maxHeight` | `string` | `"600px"` | Maximum height of the feed container |
| `showFilters` | `boolean` | `true` | Show filter controls at the top |
| `showNotificationBadge` | `boolean` | `true` | Display unread count badge |
| `autoRefresh` | `boolean` | `true` | Enable real-time updates |
| `refreshInterval` | `number` | `30000` | Auto-refresh interval in milliseconds |
| `className` | `string` | `""` | Additional CSS classes |

## Activity Types

The component supports the following activity types:

### Task Activities
- `task_created` - New task created
- `task_completed` - Task marked as complete
- `task_updated` - Task details modified
- `task_assigned` - Task assigned to user
- `task_deleted` - Task removed

### File Activities
- `file_uploaded` - New file uploaded
- `file_modified` - File content updated
- `file_deleted` - File removed

### Team Activities
- `member_added` - Team member joined
- `member_removed` - Team member left
- `member_role_changed` - Role updated

### Project Activities
- `status_changed` - Project status updated
- `milestone_achieved` - Milestone completed
- `milestone_updated` - Milestone modified
- `budget_updated` - Budget changes
- `timeline_updated` - Schedule changes

### Communication
- `comment_added` - New comment posted
- `comment_edited` - Comment modified
- `meeting_scheduled` - Meeting created

### Compliance & Approvals
- `approval_requested` - Approval needed
- `approval_granted` - Approval given
- `approval_rejected` - Approval denied
- `compliance_check` - Compliance verified
- `design_updated` - Design changes

### Issues & Risks
- `risk_identified` - New risk identified
- `issue_reported` - Issue reported
- `issue_resolved` - Issue resolved

## Activity Interface

```typescript
interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  projectId: string;
  projectName?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole?: string;
  targetId?: string;
  targetName?: string;
  targetType?: 'task' | 'file' | 'user' | 'milestone' | 'document' | 'comment';
  metadata?: {
    previousValue?: any;
    newValue?: any;
    fileSize?: number;
    fileType?: string;
    progress?: number;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    status?: string;
    amount?: number;
    currency?: string;
    dueDate?: string;
    assignedTo?: string[];
    tags?: string[];
    attachments?: Array<{
      id: string;
      name: string;
      url: string;
      type: string;
      size: number;
    }>;
  };
  timestamp: Date;
  read: boolean;
  important: boolean;
  canUndo?: boolean;
}
```

## WebSocket Integration

The component includes a mock WebSocket implementation for demonstration. In production, replace with your actual WebSocket service:

```typescript
// Replace mockWebSocket with your WebSocket service
import { websocketService } from '@/services/websocket';

// Subscribe to real-time updates
useEffect(() => {
  const unsubscribe = websocketService.subscribe('activities', (activity) => {
    handleNewActivity(activity);
  });
  
  return () => unsubscribe();
}, []);
```

## Customization

### Custom Activity Types

Add new activity types by extending the `ActivityType` union and updating the icon/color mappings:

```typescript
// Add to ActivityType
type ActivityType = ... | 'custom_event';

// Add icon mapping
const activityIcons = {
  ...existing,
  custom_event: CustomIcon,
};

// Add color mapping
const activityColors = {
  ...existing,
  custom_event: 'text-custom-600 bg-custom-50',
};
```

### Custom Filters

Add custom filter options:

```tsx
<Select>
  <SelectItem value="important">Important only</SelectItem>
  <SelectItem value="mentions">Mentions me</SelectItem>
  <SelectItem value="my_projects">My projects</SelectItem>
</Select>
```

### Custom Actions

Add custom quick actions to activities:

```tsx
const customActions = [
  {
    label: 'Pin to top',
    icon: Pin,
    action: (activity) => pinActivity(activity.id),
  },
  {
    label: 'Share',
    icon: Share,
    action: (activity) => shareActivity(activity),
  },
];
```

## Performance Considerations

1. **Virtualization**: For feeds with hundreds of activities, consider adding virtualization
2. **Batching**: Group multiple real-time updates to reduce re-renders
3. **Memoization**: Activity items are candidates for React.memo optimization
4. **Lazy Loading**: Attachments and previews can be loaded on demand

## Accessibility

The component includes:
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader announcements for new activities
- Focus management for interactive elements
- Color contrast compliance

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Requires JavaScript enabled
- WebSocket support for real-time features

## Examples Page

View live examples at: `/activity-feed`

This page demonstrates:
- Full-featured implementation
- Compact view for sidebars
- Dashboard widget integration
- Project detail integration
- Various configuration options

## Troubleshooting

### Activities not loading
- Check projectId is valid
- Verify API endpoint is accessible
- Check network tab for errors

### Real-time updates not working
- Verify WebSocket connection
- Check browser console for errors
- Ensure autoRefresh is enabled

### Performance issues
- Reduce maxHeight to limit visible items
- Enable compact mode
- Disable animations on low-end devices
- Consider pagination for large datasets

## Future Enhancements

Planned features:
- [ ] Export activity history
- [ ] Custom activity templates
- [ ] Activity analytics
- [ ] Batch operations
- [ ] Scheduled activities
- [ ] Activity webhooks
- [ ] Mobile app integration
- [ ] Voice notifications
- [ ] AI-powered insights
- [ ] Activity digest emails