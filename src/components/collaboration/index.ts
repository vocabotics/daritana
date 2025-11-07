// Collaboration components
export { default as ActivityFeed } from './ActivityFeed';
export type { Activity, ActivityType } from './ActivityFeed';

export { CollaborativeComments } from './CollaborativeComments';
export type { Comment } from './CollaborativeComments';

export { default as CollaborativeEditor } from './CollaborativeEditor';
export type { CollaborativeChange, ConflictResolution } from './CollaborativeEditor';

export { LiveCursors, CursorTrail } from './LiveCursors';

export { PresenceIndicator, PresenceAvatarStack } from './PresenceIndicator';
export type { ActiveUser } from './PresenceIndicator';