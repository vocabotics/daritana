// Real-time collaboration types
export interface CollaborationSession {
  id: string;
  projectId: string;
  participants: CollaborationParticipant[];
  startedAt: Date;
  lastActivity: Date;
  documentId?: string;
  type: 'document' | 'canvas' | 'whiteboard' | 'model_viewer';
}

export interface CollaborationParticipant {
  userId: string;
  userName: string;
  avatar?: string;
  cursor?: CursorPosition;
  selection?: Selection;
  status: 'active' | 'idle' | 'disconnected';
  color: string;
  lastSeen: Date;
  permissions: CollaborationPermission[];
}

export interface CursorPosition {
  x: number;
  y: number;
  elementId?: string;
  timestamp: number;
}

export interface Selection {
  start: Position;
  end: Position;
  elementId: string;
  type: 'text' | 'shape' | 'annotation';
}

export interface Position {
  x: number;
  y: number;
  z?: number; // For 3D models
}

export type CollaborationPermission = 
  | 'view'
  | 'comment'
  | 'edit'
  | 'annotate'
  | 'delete'
  | 'share';

// Real-time events
export interface CollaborationEvent {
  id: string;
  sessionId: string;
  userId: string;
  type: CollaborationEventType;
  payload: any;
  timestamp: number;
  version?: number;
}

export type CollaborationEventType =
  | 'cursor_move'
  | 'selection_change'
  | 'content_edit'
  | 'annotation_add'
  | 'annotation_edit'
  | 'annotation_delete'
  | 'comment_add'
  | 'user_join'
  | 'user_leave'
  | 'document_save'
  | 'conflict_detected';

// Conflict resolution
export interface ConflictResolution {
  id: string;
  documentId: string;
  conflicts: Conflict[];
  strategy: 'last_write_wins' | 'merge' | 'manual';
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface Conflict {
  id: string;
  field: string;
  localValue: any;
  remoteValue: any;
  baseValue: any;
  timestamp: Date;
  userId: string;
}

// Operational Transform for collaborative editing
export interface Operation {
  type: 'insert' | 'delete' | 'format' | 'move';
  position: number;
  content?: string;
  length?: number;
  attributes?: Record<string, any>;
  userId: string;
  version: number;
  timestamp: number;
}

export interface TransformResult {
  operation: Operation;
  transformed: Operation[];
  conflicts: Conflict[];
}