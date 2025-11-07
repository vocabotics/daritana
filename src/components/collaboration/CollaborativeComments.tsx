import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  X,
  Send,
  Pin,
  Reply,
  MoreVertical,
  Check,
  Edit2,
  Trash2,
  Heart,
  ThumbsUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '@/store/authStore';

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  resolved?: boolean;
  pinned?: boolean;
  position?: { x: number; y: number };
  parentId?: string;
  reactions?: { userId: string; type: 'like' | 'heart' }[];
  mentions?: string[];
}

interface CollaborativeCommentsProps {
  projectId?: string;
  documentId?: string;
  onCommentAdd?: (comment: Comment) => void;
  onCommentUpdate?: (commentId: string, updates: Partial<Comment>) => void;
  onCommentDelete?: (commentId: string) => void;
  className?: string;
}

export function CollaborativeComments({
  projectId,
  documentId,
  onCommentAdd,
  onCommentUpdate,
  onCommentDelete,
  className
}: CollaborativeCommentsProps) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      userId: '2',
      userName: 'Lisa Wong',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      userRole: 'Designer',
      content: 'I think we should reconsider the color scheme for this section. The current palette might not meet accessibility standards.',
      createdAt: new Date(Date.now() - 3600000),
      pinned: true,
      reactions: [
        { userId: '3', type: 'like' },
        { userId: '4', type: 'heart' }
      ]
    },
    {
      id: '2',
      userId: '3',
      userName: 'David Lim',
      userRole: 'Contractor',
      content: 'The structural specifications need to be updated according to the latest building codes.',
      createdAt: new Date(Date.now() - 7200000),
      resolved: false
    }
  ]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(true);

  const handleAddComment = (parentId?: string) => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      userId: user?.id || '1',
      userName: user?.name || 'Current User',
      userAvatar: user?.avatar,
      userRole: user?.role || 'User',
      content: newComment,
      createdAt: new Date(),
      parentId
    };

    setComments(prev => [...prev, comment]);
    onCommentAdd?.(comment);
    setNewComment('');
    setReplyingTo(null);
  };

  const handleUpdateComment = (commentId: string, updates: Partial<Comment>) => {
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, ...updates, updatedAt: new Date() } : c
    ));
    onCommentUpdate?.(commentId, updates);
    setEditingComment(null);
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
    onCommentDelete?.(commentId);
  };

  const handleReaction = (commentId: string, type: 'like' | 'heart') => {
    setComments(prev => prev.map(comment => {
      if (comment.id !== commentId) return comment;
      
      const reactions = comment.reactions || [];
      const existingReaction = reactions.find(r => r.userId === user?.id);
      
      if (existingReaction) {
        if (existingReaction.type === type) {
          // Remove reaction
          return {
            ...comment,
            reactions: reactions.filter(r => r.userId !== user?.id)
          };
        } else {
          // Change reaction type
          return {
            ...comment,
            reactions: reactions.map(r => 
              r.userId === user?.id ? { ...r, type } : r
            )
          };
        }
      } else {
        // Add new reaction
        return {
          ...comment,
          reactions: [...reactions, { userId: user?.id || '1', type }]
        };
      }
    }));
  };

  const threadedComments = comments.filter(c => !c.parentId);
  const getReplies = (commentId: string) => comments.filter(c => c.parentId === commentId);

  return (
    <div className={cn("bg-white rounded-lg border shadow-sm", className)}>
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium">Comments & Discussion</h3>
          <Badge variant="outline" className="text-xs">
            {comments.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
        >
          {showComments ? 'Hide' : 'Show'}
        </Button>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="max-h-96 overflow-y-auto p-4 space-y-4">
              {threadedComments.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  replies={getReplies(comment.id)}
                  currentUserId={user?.id || '1'}
                  onReply={() => setReplyingTo(comment.id)}
                  onEdit={() => setEditingComment(comment.id)}
                  onDelete={() => handleDeleteComment(comment.id)}
                  onResolve={() => handleUpdateComment(comment.id, { resolved: !comment.resolved })}
                  onPin={() => handleUpdateComment(comment.id, { pinned: !comment.pinned })}
                  onReaction={(type) => handleReaction(comment.id, type)}
                  isEditing={editingComment === comment.id}
                  onSaveEdit={(content) => handleUpdateComment(comment.id, { content })}
                  onCancelEdit={() => setEditingComment(null)}
                />
              ))}

              {comments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No comments yet</p>
                  <p className="text-xs mt-1">Be the first to start a discussion</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t">
              {replyingTo && (
                <div className="flex items-center justify-between mb-2 px-2 py-1 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">
                    Replying to {comments.find(c => c.id === replyingTo)?.userName}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              <div className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="min-h-[80px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleAddComment(replyingTo || undefined);
                    }
                  }}
                />
                <Button
                  onClick={() => handleAddComment(replyingTo || undefined)}
                  disabled={!newComment.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Press Ctrl+Enter to send
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CommentThread({
  comment,
  replies,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onResolve,
  onPin,
  onReaction,
  isEditing,
  onSaveEdit,
  onCancelEdit
}: {
  comment: Comment;
  replies: Comment[];
  currentUserId: string;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onResolve: () => void;
  onPin: () => void;
  onReaction: (type: 'like' | 'heart') => void;
  isEditing: boolean;
  onSaveEdit: (content: string) => void;
  onCancelEdit: () => void;
}) {
  const [editContent, setEditContent] = useState(comment.content);
  const isOwner = comment.userId === currentUserId;

  const userReaction = comment.reactions?.find(r => r.userId === currentUserId);
  const likeCount = comment.reactions?.filter(r => r.type === 'like').length || 0;
  const heartCount = comment.reactions?.filter(r => r.type === 'heart').length || 0;

  return (
    <div className={cn(
      "space-y-2",
      comment.resolved && "opacity-60"
    )}>
      <div className={cn(
        "p-3 rounded-lg",
        comment.pinned ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50"
      )}>
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.userAvatar} alt={comment.userName} />
            <AvatarFallback className="text-xs">
              {comment.userName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{comment.userName}</span>
                <Badge variant="outline" className="text-xs">
                  {comment.userRole}
                </Badge>
                {comment.pinned && (
                  <Pin className="w-3 h-3 text-yellow-600" />
                )}
                {comment.resolved && (
                  <Check className="w-3 h-3 text-green-600" />
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                </span>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onReply}>
                      <Reply className="w-4 h-4 mr-2" />
                      Reply
                    </DropdownMenuItem>
                    {isOwner && (
                      <>
                        <DropdownMenuItem onClick={onEdit}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onDelete} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onPin}>
                      <Pin className="w-4 h-4 mr-2" />
                      {comment.pinned ? 'Unpin' : 'Pin'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onResolve}>
                      <Check className="w-4 h-4 mr-2" />
                      {comment.resolved ? 'Unresolve' : 'Mark as resolved'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onSaveEdit(editContent)}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onCancelEdit}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {comment.content}
                </p>
                {comment.updatedAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    (edited)
                  </p>
                )}
              </>
            )}
            
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-2",
                  userReaction?.type === 'like' && "text-blue-600"
                )}
                onClick={() => onReaction('like')}
              >
                <ThumbsUp className="w-3 h-3 mr-1" />
                {likeCount > 0 && likeCount}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-2",
                  userReaction?.type === 'heart' && "text-red-600"
                )}
                onClick={() => onReaction('heart')}
              >
                <Heart className="w-3 h-3 mr-1" />
                {heartCount > 0 && heartCount}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={onReply}
              >
                <Reply className="w-3 h-3 mr-1" />
                Reply
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {replies.length > 0 && (
        <div className="ml-11 space-y-2">
          {replies.map((reply) => (
            <div key={reply.id} className="p-3 bg-white border rounded-lg">
              <div className="flex items-start gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={reply.userAvatar} alt={reply.userName} />
                  <AvatarFallback className="text-xs">
                    {reply.userName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{reply.userName}</span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(reply.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{reply.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}