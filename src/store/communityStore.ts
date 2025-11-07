import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { communityAPI, CommunityPost, CommunityComment, CommunityGroup, CommunityChallenge, UserProfile } from '@/services/communityAPI';
import { useDemoStore } from './demoStore';

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: Date;
  likes: number;
  likedBy: string[];
}

export interface Reel {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  video?: string;
  author: string;
  views: number;
  likes: number;
  shares: number;
  saved: boolean;
  likedBy: string[];
  savedBy: string[];
  comments: Comment[];
  timestamp: Date;
}

export interface Post {
  id: string;
  type: 'discussion' | 'showcase' | 'event' | 'challenge';
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  images?: string[];
  likes: number;
  likedBy: string[];
  comments: Comment[];
  shares: number;
  saved: boolean;
  savedBy: string[];
  timestamp: Date;
  tags: string[];
}

export interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  members: string[];
  posts: Post[];
  isJoined: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  prize: string;
  endDate: Date;
  participants: string[];
  isJoined: boolean;
}

interface CommunityStore {
  // Legacy data
  reels: Reel[];
  currentUserId: string;
  
  // New API data
  posts: CommunityPost[];
  groups: CommunityGroup[];
  challenges: CommunityChallenge[];
  profile: UserProfile | null;
  notifications: any[];
  
  // Loading states
  isLoading: boolean;
  isLoadingPosts: boolean;
  isLoadingGroups: boolean;
  isLoadingChallenges: boolean;
  isLoadingProfile: boolean;
  error: string | null;
  
  // Reel actions
  likeReel: (reelId: string, userId: string) => void;
  unlikeReel: (reelId: string, userId: string) => void;
  shareReel: (reelId: string) => void;
  saveReel: (reelId: string, userId: string) => void;
  unsaveReel: (reelId: string, userId: string) => void;
  addReelComment: (reelId: string, comment: Omit<Comment, 'id' | 'timestamp' | 'likes' | 'likedBy'>) => void;
  
  // API methods - Posts
  fetchPosts: (params?: { type?: string; category?: string; page?: number; limit?: number }) => Promise<void>;
  getPostById: (id: string) => Promise<CommunityPost | null>;
  createPost: (post: any) => Promise<void>;
  updatePost: (id: string, updates: Partial<CommunityPost>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  sharePost: (postId: string, platform?: string) => Promise<void>;
  bookmarkPost: (postId: string) => Promise<void>;
  unbookmarkPost: (postId: string) => Promise<void>;
  addComment: (postId: string, comment: any) => Promise<void>;
  
  // Legacy post actions (for backward compatibility)
  likePostLegacy: (postId: string, userId: string) => void;
  unlikePostLegacy: (postId: string, userId: string) => void;
  sharePostLegacy: (postId: string) => void;
  savePostLegacy: (postId: string, userId: string) => void;
  unsavePostLegacy: (postId: string, userId: string) => void;
  addPostCommentLegacy: (postId: string, comment: Omit<Comment, 'id' | 'timestamp' | 'likes' | 'likedBy'>) => void;
  createPostLegacy: (post: Omit<Post, 'id' | 'likes' | 'likedBy' | 'comments' | 'shares' | 'saved' | 'savedBy' | 'timestamp'>) => void;
  
  // API methods - Groups
  fetchGroups: (params?: { type?: string; category?: string; page?: number; limit?: number }) => Promise<void>;
  getGroupById: (id: string) => Promise<CommunityGroup | null>;
  createGroup: (group: any) => Promise<void>;
  joinGroup: (groupId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  getGroupMembers: (groupId: string) => Promise<any[]>;
  getGroupPosts: (groupId: string) => Promise<CommunityPost[]>;
  
  // API methods - Challenges
  fetchChallenges: (params?: { status?: string; type?: string; page?: number; limit?: number }) => Promise<void>;
  getChallengeById: (id: string) => Promise<CommunityChallenge | null>;
  createChallenge: (challenge: any) => Promise<void>;
  participateInChallenge: (challengeId: string) => Promise<void>;
  submitToChallenge: (challengeId: string, submission: any) => Promise<void>;
  getChallengeSubmissions: (challengeId: string) => Promise<any[]>;
  
  // API methods - Profile
  fetchCurrentProfile: () => Promise<void>;
  getProfileById: (id: string) => Promise<UserProfile | null>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  
  // API methods - Notifications
  fetchNotifications: (params?: { type?: string; isRead?: boolean }) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  getUnreadNotificationCount: () => Promise<number>;
  
  // API methods - Feed
  getFeedOverview: () => Promise<any>;
  getPersonalizedFeed: (params?: { page?: number; limit?: number }) => Promise<CommunityPost[]>;
  getTrendingContent: () => Promise<any>;
  searchCommunity: (query: string, type?: 'posts' | 'groups' | 'profiles') => Promise<any>;
  
  // Legacy group and challenge actions (for backward compatibility)
  joinGroupLegacy: (groupId: string, userId: string) => void;
  leaveGroupLegacy: (groupId: string, userId: string) => void;
  joinChallengeLegacy: (challengeId: string, userId: string) => void;
  leaveChallengeLegacy: (challengeId: string, userId: string) => void;
  
  // Utility methods
  clearError: () => void;
  reset: () => void;
}

// Default data structures (empty for real API integration)
const defaultReels: Reel[] = [];
const defaultPosts: Post[] = [];
const defaultGroups: Group[] = [];
const defaultChallenges: Challenge[] = [];

// Sample data for demo mode (minimal examples)
const sampleReels: Reel[] = [
  {
    id: 'demo-1',
    title: 'Sample Project Showcase',
    description: 'A demonstration of project visualization',
    thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
    author: 'Demo User',
    views: 100,
    likes: 10,
    shares: 2,
    saved: false,
    likedBy: [],
    savedBy: [],
    comments: [],
    timestamp: new Date(),
  }
];

const samplePosts: Post[] = [
  {
    id: 'demo-1',
    type: 'discussion',
    title: 'Welcome to the Community',
    content: 'This is a sample post to demonstrate the interface.',
    author: {
      id: 'demo-1',
      name: 'Demo User',
      role: 'Member',
    },
    likes: 5,
    likedBy: [],
    comments: [],
    shares: 1,
    saved: false,
    savedBy: [],
    timestamp: new Date(),
    tags: ['welcome', 'demo'],
  }
];

const sampleGroups: Group[] = [
  {
    id: 'demo-1',
    name: 'Demo Community',
    description: 'A sample group for demonstration purposes',
    memberCount: 10,
    members: [],
    posts: [],
    isJoined: false,
  }
];

const sampleChallenges: Challenge[] = [
  {
    id: 'demo-1',
    title: 'Sample Challenge',
    description: 'A demonstration challenge for the interface',
    prize: 'Demo Prize',
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    participants: [],
    isJoined: false,
  }
];

export const useCommunityStore = create<CommunityStore>()(
  persist(
    (set, get) => ({
      // Legacy data
      reels: defaultReels,
      currentUserId: 'user123', // This would come from auth in production
      
      // New API data
      posts: [],
      groups: [],
      challenges: [],
      profile: null,
      notifications: [],
      
      // Loading states
      isLoading: false,
      isLoadingPosts: false,
      isLoadingGroups: false,
      isLoadingChallenges: false,
      isLoadingProfile: false,
      error: null,
      
      // Reel actions
      likeReel: (reelId, userId) => {
        set((state) => ({
          reels: state.reels.map((reel) => {
            if (reel.id === reelId) {
              const isLiked = reel.likedBy.includes(userId);
              return {
                ...reel,
                likes: isLiked ? reel.likes - 1 : reel.likes + 1,
                likedBy: isLiked
                  ? reel.likedBy.filter((id) => id !== userId)
                  : [...reel.likedBy, userId],
              };
            }
            return reel;
          }),
        }));
      },
      
      unlikeReel: (reelId, userId) => {
        set((state) => ({
          reels: state.reels.map((reel) => {
            if (reel.id === reelId) {
              return {
                ...reel,
                likes: Math.max(0, reel.likes - 1),
                likedBy: reel.likedBy.filter((id) => id !== userId),
              };
            }
            return reel;
          }),
        }));
      },
      
      shareReel: (reelId) => {
        set((state) => ({
          reels: state.reels.map((reel) => {
            if (reel.id === reelId) {
              return { ...reel, shares: reel.shares + 1 };
            }
            return reel;
          }),
        }));
      },
      
      saveReel: (reelId, userId) => {
        set((state) => ({
          reels: state.reels.map((reel) => {
            if (reel.id === reelId) {
              return {
                ...reel,
                saved: true,
                savedBy: [...reel.savedBy, userId],
              };
            }
            return reel;
          }),
        }));
      },
      
      unsaveReel: (reelId, userId) => {
        set((state) => ({
          reels: state.reels.map((reel) => {
            if (reel.id === reelId) {
              return {
                ...reel,
                saved: false,
                savedBy: reel.savedBy.filter((id) => id !== userId),
              };
            }
            return reel;
          }),
        }));
      },
      
      addReelComment: (reelId, comment) => {
        set((state) => ({
          reels: state.reels.map((reel) => {
            if (reel.id === reelId) {
              const newComment: Comment = {
                ...comment,
                id: Date.now().toString(),
                timestamp: new Date(),
                likes: 0,
                likedBy: [],
              };
              return {
                ...reel,
                comments: [...reel.comments, newComment],
              };
            }
            return reel;
          }),
        }));
      },
      
      // API methods - Posts
      fetchPosts: async (params) => {
        set({ isLoadingPosts: true, error: null });
        const isDemoMode = useDemoStore.getState().isEnabled;
        
        if (isDemoMode) {
          // Return sample data in demo mode
          set({ 
            posts: samplePosts.map(post => ({
              id: post.id,
              authorId: post.author.id,
              title: post.title,
              content: post.content,
              type: 'TEXT' as const,
              category: 'GENERAL' as const,
              tags: post.tags || [],
              visibility: 'PUBLIC' as const,
              isPublished: true,
              likesCount: post.likes,
              commentsCount: post.comments.length,
              sharesCount: post.shares,
              viewsCount: 0,
              isLiked: false,
              isBookmarked: post.saved,
              createdAt: post.timestamp,
              updatedAt: post.timestamp,
              author: {
                id: post.author.id,
                name: post.author.name,
                title: post.author.role
              }
            })),
            isLoadingPosts: false 
          });
          return;
        }
        
        try {
          const response = await communityAPI.posts.getAll(params);
          set({ 
            posts: response.posts || [],
            isLoadingPosts: false 
          });
        } catch (error) {
          console.error('Failed to fetch posts:', error);
          set({ 
            posts: [],
            error: 'Failed to fetch posts',
            isLoadingPosts: false 
          });
        }
      },
      
      getPostById: async (id) => {
        try {
          const response = await communityAPI.posts.getById(id);
          return response.post || null;
        } catch (error) {
          console.error('Failed to get post:', error);
          return get().posts.find(p => p.id === id) || null;
        }
      },
      
      createPost: async (post) => {
        set({ isLoading: true, error: null });
        try {
          const response = await communityAPI.posts.create(post);
          set((state) => ({
            posts: [response.post, ...state.posts],
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to create post:', error);
          // Fallback to legacy method
          get().createPostLegacy(post);
          set({ 
            error: 'Created post locally - sync pending',
            isLoading: false 
          });
        }
      },
      
      updatePost: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          const response = await communityAPI.posts.update(id, updates);
          set((state) => ({
            posts: state.posts.map(post => 
              post.id === id ? response.post : post
            ),
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to update post:', error);
          set({ 
            error: 'Failed to update post',
            isLoading: false 
          });
        }
      },
      
      deletePost: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await communityAPI.posts.delete(id);
          set((state) => ({
            posts: state.posts.filter(post => post.id !== id),
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to delete post:', error);
          set({ 
            error: 'Failed to delete post',
            isLoading: false 
          });
        }
      },
      
      likePost: async (postId) => {
        try {
          await communityAPI.posts.like(postId);
          // Update post in local state
          set((state) => ({
            posts: state.posts.map(post => {
              if (post.id === postId) {
                return {
                  ...post,
                  likesCount: post.likesCount + 1,
                  isLiked: true
                };
              }
              return post;
            })
          }));
        } catch (error) {
          console.error('Failed to like post:', error);
          // Fallback to legacy method
          get().likePostLegacy(postId, get().currentUserId);
        }
      },
      
      unlikePost: async (postId) => {
        try {
          await communityAPI.posts.unlike(postId);
          // Update post in local state
          set((state) => ({
            posts: state.posts.map(post => {
              if (post.id === postId) {
                return {
                  ...post,
                  likesCount: Math.max(0, post.likesCount - 1),
                  isLiked: false
                };
              }
              return post;
            })
          }));
        } catch (error) {
          console.error('Failed to unlike post:', error);
          // Fallback to legacy method
          get().unlikePostLegacy(postId, get().currentUserId);
        }
      },
      
      sharePost: async (postId, platform) => {
        try {
          await communityAPI.posts.share(postId, platform);
          // Update share count in local state
          set((state) => ({
            posts: state.posts.map(post => {
              if (post.id === postId) {
                return {
                  ...post,
                  sharesCount: post.sharesCount + 1
                };
              }
              return post;
            })
          }));
        } catch (error) {
          console.error('Failed to share post:', error);
          // Fallback to legacy method
          get().sharePostLegacy(postId);
        }
      },
      
      bookmarkPost: async (postId) => {
        try {
          await communityAPI.posts.bookmark(postId);
          // Update bookmark status in local state
          set((state) => ({
            posts: state.posts.map(post => {
              if (post.id === postId) {
                return {
                  ...post,
                  isBookmarked: true
                };
              }
              return post;
            })
          }));
        } catch (error) {
          console.error('Failed to bookmark post:', error);
          // Fallback to legacy method
          get().savePostLegacy(postId, get().currentUserId);
        }
      },
      
      unbookmarkPost: async (postId) => {
        try {
          await communityAPI.posts.unbookmark(postId);
          // Update bookmark status in local state
          set((state) => ({
            posts: state.posts.map(post => {
              if (post.id === postId) {
                return {
                  ...post,
                  isBookmarked: false
                };
              }
              return post;
            })
          }));
        } catch (error) {
          console.error('Failed to unbookmark post:', error);
          // Fallback to legacy method
          get().unsavePostLegacy(postId, get().currentUserId);
        }
      },
      
      addComment: async (postId, comment) => {
        try {
          const response = await communityAPI.posts.addComment(postId, comment);
          // Update comments count in local state
          set((state) => ({
            posts: state.posts.map(post => {
              if (post.id === postId) {
                return {
                  ...post,
                  commentsCount: post.commentsCount + 1
                };
              }
              return post;
            })
          }));
        } catch (error) {
          console.error('Failed to add comment:', error);
          // Fallback to legacy method
          get().addPostCommentLegacy(postId, comment);
        }
      },
      
      // Legacy post actions (for backward compatibility)
      likePostLegacy: (postId, userId) => {
        set((state) => ({
          posts: state.posts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                likesCount: post.likesCount + 1,
                isLiked: true
              };
            }
            return post;
          }),
        }));
      },
      
      unlikePostLegacy: (postId, userId) => {
        set((state) => ({
          posts: state.posts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                likesCount: Math.max(0, post.likesCount - 1),
                isLiked: false
              };
            }
            return post;
          }),
        }));
      },
      
      sharePostLegacy: (postId) => {
        set((state) => ({
          posts: state.posts.map((post) => {
            if (post.id === postId) {
              return { ...post, sharesCount: post.sharesCount + 1 };
            }
            return post;
          }),
        }));
      },
      
      savePostLegacy: (postId, userId) => {
        set((state) => ({
          posts: state.posts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                isBookmarked: true
              };
            }
            return post;
          }),
        }));
      },
      
      unsavePostLegacy: (postId, userId) => {
        set((state) => ({
          posts: state.posts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                isBookmarked: false
              };
            }
            return post;
          }),
        }));
      },
      
      addPostCommentLegacy: (postId, comment) => {
        set((state) => ({
          posts: state.posts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                commentsCount: post.commentsCount + 1
              };
            }
            return post;
          }),
        }));
      },
      
      createPostLegacy: (post) => {
        const newPost: CommunityPost = {
          id: Date.now().toString(),
          authorId: get().currentUserId,
          title: post.title,
          content: post.content,
          type: 'TEXT',
          category: 'GENERAL',
          tags: post.tags || [],
          visibility: 'PUBLIC',
          isPublished: true,
          likesCount: 0,
          commentsCount: 0,
          sharesCount: 0,
          viewsCount: 0,
          isLiked: false,
          isBookmarked: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: {
            id: get().currentUserId,
            name: post.author.name,
            title: post.author.role
          }
        };
        
        set((state) => ({
          posts: [newPost, ...state.posts],
        }));
      },
      
      // API methods - Groups
      fetchGroups: async (params) => {
        set({ isLoadingGroups: true, error: null });
        const isDemoMode = useDemoStore.getState().isEnabled;
        
        if (isDemoMode) {
          // Return sample data in demo mode
          set({ 
            groups: sampleGroups.map(group => ({
              id: group.id,
              name: group.name,
              description: group.description,
              category: 'PROFESSIONAL' as const,
              visibility: 'PUBLIC' as const,
              memberCount: group.memberCount,
              isJoined: group.isJoined,
              createdAt: new Date(),
              updatedAt: new Date(),
              creator: {
                id: 'demo-1',
                name: 'Demo Creator',
                title: 'Admin'
              }
            })),
            isLoadingGroups: false 
          });
          return;
        }
        
        try {
          const response = await communityAPI.groups.getAll(params);
          set({ 
            groups: response.groups || [],
            isLoadingGroups: false 
          });
        } catch (error) {
          console.error('Failed to fetch groups:', error);
          set({ 
            groups: [],
            error: 'Failed to fetch groups',
            isLoadingGroups: false 
          });
        }
      },
      
      getGroupById: async (id) => {
        try {
          const response = await communityAPI.groups.getById(id);
          return response.group || null;
        } catch (error) {
          console.error('Failed to get group:', error);
          return get().groups.find(g => g.id === id) || null;
        }
      },
      
      createGroup: async (group) => {
        set({ isLoading: true, error: null });
        try {
          const response = await communityAPI.groups.create(group);
          set((state) => ({
            groups: [...state.groups, response.group],
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to create group:', error);
          set({ 
            error: 'Failed to create group',
            isLoading: false 
          });
        }
      },
      
      joinGroup: async (groupId) => {
        try {
          await communityAPI.groups.join(groupId);
          set((state) => ({
            groups: state.groups.map(group => {
              if (group.id === groupId) {
                return {
                  ...group,
                  isJoined: true,
                  memberCount: group.memberCount + 1
                };
              }
              return group;
            })
          }));
        } catch (error) {
          console.error('Failed to join group:', error);
          // Fallback to legacy method
          get().joinGroupLegacy(groupId, get().currentUserId);
        }
      },
      
      leaveGroup: async (groupId) => {
        try {
          await communityAPI.groups.leave(groupId);
          set((state) => ({
            groups: state.groups.map(group => {
              if (group.id === groupId) {
                return {
                  ...group,
                  isJoined: false,
                  memberCount: Math.max(0, group.memberCount - 1)
                };
              }
              return group;
            })
          }));
        } catch (error) {
          console.error('Failed to leave group:', error);
          // Fallback to legacy method
          get().leaveGroupLegacy(groupId, get().currentUserId);
        }
      },
      
      getGroupMembers: async (groupId) => {
        try {
          const response = await communityAPI.groups.getMembers(groupId);
          return response.members || [];
        } catch (error) {
          console.error('Failed to get group members:', error);
          return [];
        }
      },
      
      getGroupPosts: async (groupId) => {
        try {
          const response = await communityAPI.groups.getPosts(groupId);
          return response.posts || [];
        } catch (error) {
          console.error('Failed to get group posts:', error);
          return [];
        }
      },
      
      // API methods - Challenges
      fetchChallenges: async (params) => {
        set({ isLoadingChallenges: true, error: null });
        const isDemoMode = useDemoStore.getState().isEnabled;
        
        if (isDemoMode) {
          // Return sample data in demo mode
          set({ 
            challenges: sampleChallenges.map(challenge => ({
              id: challenge.id,
              title: challenge.title,
              description: challenge.description,
              type: 'DESIGN' as const,
              prize: challenge.prize,
              startDate: new Date(),
              endDate: challenge.endDate,
              status: 'ACTIVE' as const,
              participantCount: challenge.participants.length,
              isParticipating: challenge.isJoined,
              createdAt: new Date(),
              updatedAt: new Date(),
              creator: {
                id: 'demo-1',
                name: 'Demo Admin',
                title: 'Challenge Host'
              }
            })),
            isLoadingChallenges: false 
          });
          return;
        }
        
        try {
          const response = await communityAPI.challenges.getAll(params);
          set({ 
            challenges: response.challenges || [],
            isLoadingChallenges: false 
          });
        } catch (error) {
          console.error('Failed to fetch challenges:', error);
          set({ 
            challenges: [],
            error: 'Failed to fetch challenges',
            isLoadingChallenges: false 
          });
        }
      },
      
      getChallengeById: async (id) => {
        try {
          const response = await communityAPI.challenges.getById(id);
          return response.challenge || null;
        } catch (error) {
          console.error('Failed to get challenge:', error);
          return get().challenges.find(c => c.id === id) || null;
        }
      },
      
      createChallenge: async (challenge) => {
        set({ isLoading: true, error: null });
        try {
          const response = await communityAPI.challenges.create(challenge);
          set((state) => ({
            challenges: [...state.challenges, response.challenge],
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to create challenge:', error);
          set({ 
            error: 'Failed to create challenge',
            isLoading: false 
          });
        }
      },
      
      participateInChallenge: async (challengeId) => {
        try {
          await communityAPI.challenges.participate(challengeId);
          set((state) => ({
            challenges: state.challenges.map(challenge => {
              if (challenge.id === challengeId) {
                return {
                  ...challenge,
                  isParticipating: true,
                  participantCount: challenge.participantCount + 1
                };
              }
              return challenge;
            })
          }));
        } catch (error) {
          console.error('Failed to participate in challenge:', error);
          // Fallback to legacy method
          get().joinChallengeLegacy(challengeId, get().currentUserId);
        }
      },
      
      submitToChallenge: async (challengeId, submission) => {
        set({ isLoading: true, error: null });
        try {
          await communityAPI.challenges.submitToChallenge(challengeId, submission);
          set({ isLoading: false });
        } catch (error) {
          console.error('Failed to submit to challenge:', error);
          set({ 
            error: 'Failed to submit to challenge',
            isLoading: false 
          });
        }
      },
      
      getChallengeSubmissions: async (challengeId) => {
        try {
          const response = await communityAPI.challenges.getSubmissions(challengeId);
          return response.submissions || [];
        } catch (error) {
          console.error('Failed to get challenge submissions:', error);
          return [];
        }
      },
      
      // API methods - Profile
      fetchCurrentProfile: async () => {
        set({ isLoadingProfile: true, error: null });
        try {
          const response = await communityAPI.profiles.getCurrentUser();
          set({ 
            profile: response.profile || null,
            isLoadingProfile: false 
          });
        } catch (error) {
          console.error('Failed to fetch current profile:', error);
          set({ 
            profile: null,
            error: 'Failed to fetch profile',
            isLoadingProfile: false 
          });
        }
      },
      
      getProfileById: async (id) => {
        try {
          const response = await communityAPI.profiles.getById(id);
          return response.profile || null;
        } catch (error) {
          console.error('Failed to get profile:', error);
          return null;
        }
      },
      
      updateProfile: async (updates) => {
        set({ isLoading: true, error: null });
        try {
          const response = await communityAPI.profiles.update(updates);
          set({ 
            profile: response.profile,
            isLoading: false 
          });
        } catch (error) {
          console.error('Failed to update profile:', error);
          set({ 
            error: 'Failed to update profile',
            isLoading: false 
          });
        }
      },
      
      followUser: async (userId) => {
        try {
          await communityAPI.profiles.follow(userId);
        } catch (error) {
          console.error('Failed to follow user:', error);
        }
      },
      
      unfollowUser: async (userId) => {
        try {
          await communityAPI.profiles.unfollow(userId);
        } catch (error) {
          console.error('Failed to unfollow user:', error);
        }
      },
      
      // API methods - Notifications
      fetchNotifications: async (params) => {
        set({ isLoading: true, error: null });
        try {
          const response = await communityAPI.getNotifications(params);
          set({ 
            notifications: response.notifications || [],
            isLoading: false 
          });
        } catch (error) {
          console.error('Failed to fetch notifications:', error);
          set({ 
            notifications: [],
            error: 'Failed to fetch notifications',
            isLoading: false 
          });
        }
      },
      
      markNotificationAsRead: async (notificationId) => {
        try {
          await communityAPI.markNotificationAsRead(notificationId);
          set((state) => ({
            notifications: state.notifications.map(notification =>
              notification.id === notificationId 
                ? { ...notification, isRead: true }
                : notification
            )
          }));
        } catch (error) {
          console.error('Failed to mark notification as read:', error);
        }
      },
      
      getUnreadNotificationCount: async () => {
        try {
          const response = await communityAPI.getUnreadNotificationCount();
          return response.count || 0;
        } catch (error) {
          console.error('Failed to get unread notification count:', error);
          return 0;
        }
      },
      
      // API methods - Feed
      getFeedOverview: async () => {
        set({ isLoading: true, error: null });
        try {
          const overview = await communityAPI.getFeedOverview();
          set({ 
            posts: overview.posts || [],
            groups: overview.groups || [],
            challenges: overview.challenges || [],
            isLoading: false 
          });
          return overview;
        } catch (error) {
          console.error('Failed to get feed overview:', error);
          set({ 
            error: 'Failed to load feed overview',
            isLoading: false 
          });
          return null;
        }
      },
      
      getPersonalizedFeed: async (params) => {
        try {
          const posts = await communityAPI.getPersonalizedFeed(params);
          return posts;
        } catch (error) {
          console.error('Failed to get personalized feed:', error);
          return [];
        }
      },
      
      getTrendingContent: async () => {
        try {
          const trending = await communityAPI.getTrendingContent();
          return trending;
        } catch (error) {
          console.error('Failed to get trending content:', error);
          return null;
        }
      },
      
      searchCommunity: async (query, type = 'posts') => {
        try {
          const results = await communityAPI.searchCommunity(query, type);
          return results;
        } catch (error) {
          console.error('Failed to search community:', error);
          return null;
        }
      },
      
      // Legacy group and challenge actions (for backward compatibility)
      joinGroupLegacy: (groupId, userId) => {
        set((state) => ({
          groups: state.groups.map((group) => {
            if (group.id === groupId) {
              return {
                ...group,
                isJoined: true,
                memberCount: group.memberCount + 1
              };
            }
            return group;
          }),
        }));
      },
      
      leaveGroupLegacy: (groupId, userId) => {
        set((state) => ({
          groups: state.groups.map((group) => {
            if (group.id === groupId) {
              return {
                ...group,
                isJoined: false,
                memberCount: Math.max(0, group.memberCount - 1)
              };
            }
            return group;
          }),
        }));
      },
      
      joinChallengeLegacy: (challengeId, userId) => {
        set((state) => ({
          challenges: state.challenges.map((challenge) => {
            if (challenge.id === challengeId) {
              return {
                ...challenge,
                isParticipating: true,
                participantCount: challenge.participantCount + 1
              };
            }
            return challenge;
          }),
        }));
      },
      
      leaveChallengeLegacy: (challengeId, userId) => {
        set((state) => ({
          challenges: state.challenges.map((challenge) => {
            if (challenge.id === challengeId) {
              return {
                ...challenge,
                isParticipating: false,
                participantCount: Math.max(0, challenge.participantCount - 1)
              };
            }
            return challenge;
          }),
        }));
      },
      
      // Utility methods
      clearError: () => set({ error: null }),
      
      reset: () => set({
        posts: [],
        groups: [],
        challenges: [],
        profile: null,
        notifications: [],
        isLoading: false,
        isLoadingPosts: false,
        isLoadingGroups: false,
        isLoadingChallenges: false,
        isLoadingProfile: false,
        error: null
      }),
    }),
    {
      name: 'community-store',
      partialize: (state) => ({
        currentUserId: state.currentUserId,
        // Don't persist API data, only user preferences
      }),
    }
  )
);