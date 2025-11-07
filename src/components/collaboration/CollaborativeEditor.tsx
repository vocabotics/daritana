import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit3, 
  Users, 
  AlertTriangle, 
  Check, 
  X, 
  RotateCcw,
  Save,
  Clock,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { PresenceAvatarStack } from './PresenceIndicator';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export interface CollaborativeChange {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: Date;
  type: 'insert' | 'delete' | 'replace';
  position: number;
  content: string;
  originalContent?: string;
  conflictsWith?: string[];
}

export interface ConflictResolution {
  changeId: string;
  resolution: 'accept' | 'reject' | 'merge';
  mergedContent?: string;
}

interface CollaborativeEditorProps {
  initialContent: string;
  placeholder?: string;
  onSave: (content: string) => Promise<void>;
  collaborators?: Array<{
    id: string;
    name: string;
    avatar?: string;
    isOnline: boolean;
  }>;
  projectId?: string;
  documentId: string;
  className?: string;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  initialContent,
  placeholder = "Start typing...",
  onSave,
  collaborators = [],
  projectId,
  documentId,
  className = ""
}) => {
  const { user } = useAuthStore();
  const [content, setContent] = useState(initialContent);
  const [changes, setChanges] = useState<CollaborativeChange[]>([]);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [activeCollaborators, setActiveCollaborators] = useState(collaborators.filter(c => c.isOnline));
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef(initialContent);
  const changeHistoryRef = useRef<CollaborativeChange[]>([]);

  // Simulate real-time collaboration updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate incoming changes from other users
      if (Math.random() < 0.1 && activeCollaborators.length > 0) {
        simulateRemoteChange();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeCollaborators]);

  // Detect and handle text conflicts
  const detectConflicts = useCallback((newChanges: CollaborativeChange[]) => {
    const conflictIds: string[] = [];
    
    newChanges.forEach((change, index) => {
      newChanges.slice(index + 1).forEach(otherChange => {
        if (
          change.userId !== otherChange.userId &&
          Math.abs(change.position - otherChange.position) < 10 &&
          Math.abs(change.timestamp.getTime() - otherChange.timestamp.getTime()) < 5000
        ) {
          conflictIds.push(change.id, otherChange.id);
        }
      });
    });

    setConflicts(conflictIds);
    return conflictIds;
  }, []);

  // Simulate remote changes from other users
  const simulateRemoteChange = useCallback(() => {
    if (!user || activeCollaborators.length === 0) return;

    const randomCollaborator = activeCollaborators[Math.floor(Math.random() * activeCollaborators.length)];
    const currentContent = contentRef.current;
    const changeTypes = ['insert', 'replace'] as const;
    const changeType = changeTypes[Math.floor(Math.random() * changeTypes.length)];
    
    const newChange: CollaborativeChange = {
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: randomCollaborator.id,
      userName: randomCollaborator.name,
      userAvatar: randomCollaborator.avatar,
      timestamp: new Date(),
      type: changeType,
      position: Math.floor(Math.random() * currentContent.length),
      content: changeType === 'insert' ? ' [collaborative edit]' : '[updated]',
      originalContent: changeType === 'replace' ? currentContent.slice(0, 10) : undefined
    };

    setChanges(prev => {
      const updated = [...prev, newChange];
      changeHistoryRef.current = updated;
      detectConflicts(updated);
      return updated;
    });

    toast.info(`${randomCollaborator.name} is editing this document`, {
      duration: 2000,
    });
  }, [user, activeCollaborators, detectConflicts]);

  // Handle content changes
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    contentRef.current = newContent;

    if (!user) return;

    // Create change record for conflict detection
    const change: CollaborativeChange = {
      id: `change-${Date.now()}-${user.id}`,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userAvatar: user.avatar,
      timestamp: new Date(),
      type: newContent.length > content.length ? 'insert' : 'replace',
      position: e.target.selectionStart || 0,
      content: newContent.slice(content.length),
      originalContent: content
    };

    setChanges(prev => {
      const updated = [...prev, change];
      changeHistoryRef.current = updated;
      detectConflicts(updated);
      return updated;
    });
  }, [content, user, detectConflicts]);

  // Resolve conflicts
  const resolveConflict = useCallback((changeId: string, resolution: ConflictResolution['resolution'], mergedContent?: string) => {
    setChanges(prev => prev.filter(change => change.id !== changeId));
    setConflicts(prev => prev.filter(id => id !== changeId));

    if (resolution === 'accept' || (resolution === 'merge' && mergedContent)) {
      const finalContent = mergedContent || content;
      setContent(finalContent);
      contentRef.current = finalContent;
    }

    toast.success(`Conflict resolved: ${resolution}`, {
      duration: 2000,
    });
  }, [content]);

  // Save content
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave(content);
      setLastSaved(new Date());
      setChanges([]);
      setConflicts([]);
      changeHistoryRef.current = [];
      toast.success('Document saved successfully');
    } catch (error) {
      toast.error('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  }, [content, onSave]);

  const hasUnsavedChanges = changes.some(change => change.userId === user?.id);
  const hasConflicts = conflicts.length > 0;

  return (
    <Card className={`collaborative-editor ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            Collaborative Editor
            {hasConflicts && (
              <Badge variant="destructive" className="ml-2">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {conflicts.length} conflicts
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <PresenceAvatarStack users={activeCollaborators} maxDisplay={3} />
            <Badge variant="outline" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              {activeCollaborators.length} online
            </Badge>
          </div>
        </div>
        
        {/* Status Bar */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            {lastSaved && (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3 text-green-500" />
                Last saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            {hasUnsavedChanges && (
              <span className="flex items-center gap-1 text-orange-600">
                <Clock className="h-3 w-3" />
                Unsaved changes
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Conflict Resolution Panel */}
        <AnimatePresence>
          {hasConflicts && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <h4 className="font-medium text-red-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Merge Conflicts Detected
              </h4>
              <div className="space-y-2">
                {changes.filter(change => conflicts.includes(change.id)).map(change => (
                  <div key={change.id} className="flex items-center justify-between bg-white rounded p-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs">
                        {change.userName[0]}
                      </div>
                      <span>{change.userName} {change.type}ed text</span>
                      <Badge variant="outline">{change.timestamp.toLocaleTimeString()}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resolveConflict(change.id, 'accept')}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Accept
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resolveConflict(change.id, 'reject')}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder={placeholder}
            className={`min-h-[200px] resize-none ${hasConflicts ? 'border-red-300' : ''}`}
            onFocus={() => setIsEditing(true)}
            onBlur={() => setIsEditing(false)}
          />
          
          {/* Live editing indicator */}
          <AnimatePresence>
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs flex items-center gap-1"
              >
                <UserCheck className="h-3 w-3" />
                You're editing
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Recent Changes */}
        {changes.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Recent Changes</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {changes.slice(-5).map(change => (
                <div key={change.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center text-xs">
                    {change.userName[0]}
                  </div>
                  <span>{change.userName} {change.type}ed</span>
                  <span>{change.timestamp.toLocaleTimeString()}</span>
                  {conflicts.includes(change.id) && (
                    <Badge variant="destructive" className="text-xs">
                      Conflict
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CollaborativeEditor;