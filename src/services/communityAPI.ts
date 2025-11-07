import { apiClient } from './api';

// Types for community entities
export interface CommunityPost {
  id: string;
  authorId: string;
  title?: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'PROJECT_SHOWCASE' | 'QUESTION' | 'DISCUSSION' | 'NEWS';
  category: 'DESIGN' | 'CONSTRUCTION' | 'SUSTAINABILITY' | 'TECHNOLOGY' | 'BUSINESS' | 'CAREER' | 'GENERAL';
  tags: string[];
  images?: Array<{
    id: string;
    url: string;
    caption?: string;
    alt?: string;
  }>;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  projectId?: string; // If it's a project showcase
  visibility: 'PUBLIC' | 'FOLLOWERS' | 'COMMUNITY' | 'PRIVATE';
  isPublished: boolean;
  isFeatured?: boolean;
  isPinned?: boolean;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  author: {
    id: string;
    name: string;
    title?: string;
    company?: string;
    profileImage?: string;
    isVerified?: boolean;
    followerCount?: number;
  };
  project?: {
    id: string;
    name: string;
    location: string;
    type: string;
    images: string[];
  };
}

export interface CommunityComment {
  id: string;
  postId: string;
  authorId: string;
  parentId?: string; // For nested comments
  content: string;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
  likesCount: number;
  repliesCount: number;
  isLiked?: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    profileImage?: string;
    title?: string;
  };
  replies?: CommunityComment[];
}

export interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  type: 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';
  category: 'PROFESSIONAL' | 'REGIONAL' | 'SPECIALIZATION' | 'INTEREST' | 'PROJECT_BASED';
  tags: string[];
  coverImage?: string;
  memberCount: number;
  postCount: number;
  isJoined?: boolean;
  isModerator?: boolean;
  rules?: string[];
  location?: string;
  createdBy: string;
  createdAt: Date;
  moderators: Array<{
    id: string;
    name: string;
    profileImage?: string;
  }>;
  recentActivity?: {
    lastPostAt?: Date;
    activeMembers: number;
  };
}

export interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  type: 'DESIGN_CONTEST' | 'INNOVATION_CHALLENGE' | 'SUSTAINABILITY' | 'SKILL_CHALLENGE' | 'CASE_STUDY';
  category: string;
  rules: string[];
  requirements: string[];
  prizes?: Array<{
    position: string;
    reward: string;
    description?: string;
  }>;
  startDate: Date;
  endDate: Date;
  submissionDeadline: Date;
  judgingCriteria: Array<{
    criterion: string;
    weight: number;
    description: string;
  }>;
  status: 'UPCOMING' | 'ACTIVE' | 'JUDGING' | 'COMPLETED' | 'CANCELLED';
  participantCount: number;
  submissionCount: number;
  isParticipating?: boolean;
  maxParticipants?: number;
  entryFee?: number;
  sponsors?: Array<{
    name: string;
    logo: string;
    url?: string;
  }>;
  judges?: Array<{
    id: string;
    name: string;
    title: string;
    profileImage?: string;
    bio?: string;
  }>;
  createdBy: string;
  createdAt: Date;
}

export interface CommunitySubmission {
  id: string;
  challengeId: string;
  participantId: string;
  title: string;
  description: string;
  images: Array<{
    url: string;
    caption?: string;
  }>;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  projectDetails?: {
    budget?: number;
    timeline?: string;
    sustainability?: string;
    innovation?: string;
  };
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'JUDGED' | 'WINNER' | 'FINALIST';
  score?: number;
  ranking?: number;
  feedback?: string;
  submittedAt: Date;
  participant: {
    id: string;
    name: string;
    title?: string;
    company?: string;
    profileImage?: string;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  title?: string;
  company?: string;
  bio?: string;
  location?: string;
  website?: string;
  profileImage?: string;
  coverImage?: string;
  specializations: string[];
  skills: string[];
  certifications: Array<{
    name: string;
    issuer: string;
    year: number;
    url?: string;
  }>;
  experience: Array<{
    title: string;
    company: string;
    startDate: Date;
    endDate?: Date;
    description?: string;
    isCurrent: boolean;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: number;
    field?: string;
  }>;
  portfolio: Array<{
    id: string;
    title: string;
    description: string;
    images: string[];
    tags: string[];
    projectUrl?: string;
    completedAt: Date;
  }>;
  socialLinks: {
    linkedin?: string;
    behance?: string;
    instagram?: string;
    website?: string;
  };
  stats: {
    followerCount: number;
    followingCount: number;
    postCount: number;
    projectCount: number;
    reputation: number;
  };
  preferences: {
    isPublicProfile: boolean;
    allowMessaging: boolean;
    notificationSettings: {
      newFollower: boolean;
      postLikes: boolean;
      comments: boolean;
      mentions: boolean;
    };
  };
  isVerified: boolean;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  joinedAt: Date;
}

// ==================== POSTS API ====================

export const postsAPI = {
  async getAll(params?: {
    type?: string;
    category?: string;
    tags?: string[];
    authorId?: string;
    following?: boolean;
    featured?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'latest' | 'popular' | 'trending';
  }) {
    const response = await apiClient.get('/community/posts', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/community/posts/${id}`);
    return response.data;
  },

  async create(post: {
    title?: string;
    content: string;
    type: string;
    category: string;
    tags: string[];
    images?: File[];
    attachments?: File[];
    projectId?: string;
    visibility: string;
  }) {
    const formData = new FormData();
    
    if (post.title) formData.append('title', post.title);
    formData.append('content', post.content);
    formData.append('type', post.type);
    formData.append('category', post.category);
    formData.append('tags', JSON.stringify(post.tags));
    formData.append('visibility', post.visibility);
    if (post.projectId) formData.append('projectId', post.projectId);
    
    if (post.images) {
      post.images.forEach((image, index) => {
        formData.append(`images[${index}]`, image);
      });
    }
    
    if (post.attachments) {
      post.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
    }

    const response = await apiClient.post('/community/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async update(id: string, updates: Partial<CommunityPost>) {
    const response = await apiClient.put(`/community/posts/${id}`, updates);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/community/posts/${id}`);
    return response.data;
  },

  async like(id: string) {
    const response = await apiClient.post(`/community/posts/${id}/like`);
    return response.data;
  },

  async unlike(id: string) {
    const response = await apiClient.delete(`/community/posts/${id}/like`);
    return response.data;
  },

  async share(id: string, platform?: string) {
    const response = await apiClient.post(`/community/posts/${id}/share`, { platform });
    return response.data;
  },

  async bookmark(id: string) {
    const response = await apiClient.post(`/community/posts/${id}/bookmark`);
    return response.data;
  },

  async unbookmark(id: string) {
    const response = await apiClient.delete(`/community/posts/${id}/bookmark`);
    return response.data;
  },

  async getComments(postId: string, params?: { page?: number; limit?: number }) {
    const response = await apiClient.get(`/community/posts/${postId}/comments`, { params });
    return response.data;
  },

  async addComment(postId: string, comment: {
    content: string;
    parentId?: string;
    attachments?: File[];
  }) {
    const formData = new FormData();
    formData.append('content', comment.content);
    if (comment.parentId) formData.append('parentId', comment.parentId);
    
    if (comment.attachments) {
      comment.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
    }

    const response = await apiClient.post(`/community/posts/${postId}/comments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

// ==================== GROUPS API ====================

export const groupsAPI = {
  async getAll(params?: {
    type?: string;
    category?: string;
    location?: string;
    search?: string;
    joined?: boolean;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/community/groups', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/community/groups/${id}`);
    return response.data;
  },

  async create(group: {
    name: string;
    description: string;
    type: string;
    category: string;
    tags: string[];
    coverImage?: File;
    rules?: string[];
    location?: string;
  }) {
    const formData = new FormData();
    formData.append('name', group.name);
    formData.append('description', group.description);
    formData.append('type', group.type);
    formData.append('category', group.category);
    formData.append('tags', JSON.stringify(group.tags));
    if (group.location) formData.append('location', group.location);
    if (group.rules) formData.append('rules', JSON.stringify(group.rules));
    if (group.coverImage) formData.append('coverImage', group.coverImage);

    const response = await apiClient.post('/community/groups', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async join(id: string) {
    const response = await apiClient.post(`/community/groups/${id}/join`);
    return response.data;
  },

  async leave(id: string) {
    const response = await apiClient.post(`/community/groups/${id}/leave`);
    return response.data;
  },

  async getMembers(id: string, params?: { page?: number; limit?: number }) {
    const response = await apiClient.get(`/community/groups/${id}/members`, { params });
    return response.data;
  },

  async getPosts(id: string, params?: { page?: number; limit?: number }) {
    const response = await apiClient.get(`/community/groups/${id}/posts`, { params });
    return response.data;
  }
};

// ==================== CHALLENGES API ====================

export const challengesAPI = {
  async getAll(params?: {
    status?: string;
    type?: string;
    category?: string;
    participating?: boolean;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/community/challenges', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/community/challenges/${id}`);
    return response.data;
  },

  async create(challenge: Omit<CommunityChallenge, 'id' | 'participantCount' | 'submissionCount' | 'createdBy' | 'createdAt'>) {
    const response = await apiClient.post('/community/challenges', challenge);
    return response.data;
  },

  async participate(id: string) {
    const response = await apiClient.post(`/community/challenges/${id}/participate`);
    return response.data;
  },

  async getSubmissions(id: string, params?: { page?: number; limit?: number }) {
    const response = await apiClient.get(`/community/challenges/${id}/submissions`, { params });
    return response.data;
  },

  async submitToChallenge(challengeId: string, submission: {
    title: string;
    description: string;
    images: File[];
    attachments?: File[];
    projectDetails?: {
      budget?: number;
      timeline?: string;
      sustainability?: string;
      innovation?: string;
    };
  }) {
    const formData = new FormData();
    formData.append('title', submission.title);
    formData.append('description', submission.description);
    
    submission.images.forEach((image, index) => {
      formData.append(`images[${index}]`, image);
    });
    
    if (submission.attachments) {
      submission.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
    }
    
    if (submission.projectDetails) {
      formData.append('projectDetails', JSON.stringify(submission.projectDetails));
    }

    const response = await apiClient.post(`/community/challenges/${challengeId}/submit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

// ==================== USER PROFILES API ====================

export const profilesAPI = {
  async getById(id: string) {
    const response = await apiClient.get(`/community/profiles/${id}`);
    return response.data;
  },

  async getCurrentUser() {
    const response = await apiClient.get('/community/profiles/me');
    return response.data;
  },

  async update(updates: Partial<UserProfile>) {
    const response = await apiClient.put('/community/profiles/me', updates);
    return response.data;
  },

  async uploadProfileImage(image: File) {
    const formData = new FormData();
    formData.append('image', image);

    const response = await apiClient.post('/community/profiles/me/profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async uploadCoverImage(image: File) {
    const formData = new FormData();
    formData.append('image', image);

    const response = await apiClient.post('/community/profiles/me/cover-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async follow(userId: string) {
    const response = await apiClient.post(`/community/profiles/${userId}/follow`);
    return response.data;
  },

  async unfollow(userId: string) {
    const response = await apiClient.delete(`/community/profiles/${userId}/follow`);
    return response.data;
  },

  async getFollowers(userId: string, params?: { page?: number; limit?: number }) {
    const response = await apiClient.get(`/community/profiles/${userId}/followers`, { params });
    return response.data;
  },

  async getFollowing(userId: string, params?: { page?: number; limit?: number }) {
    const response = await apiClient.get(`/community/profiles/${userId}/following`, { params });
    return response.data;
  },

  async getPortfolio(userId: string) {
    const response = await apiClient.get(`/community/profiles/${userId}/portfolio`);
    return response.data;
  },

  async addPortfolioProject(project: {
    title: string;
    description: string;
    images: File[];
    tags: string[];
    projectUrl?: string;
    completedAt: string;
  }) {
    const formData = new FormData();
    formData.append('title', project.title);
    formData.append('description', project.description);
    formData.append('tags', JSON.stringify(project.tags));
    formData.append('completedAt', project.completedAt);
    if (project.projectUrl) formData.append('projectUrl', project.projectUrl);
    
    project.images.forEach((image, index) => {
      formData.append(`images[${index}]`, image);
    });

    const response = await apiClient.post('/community/profiles/me/portfolio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

// ==================== COMBINED COMMUNITY API ====================

export const communityAPI = {
  posts: postsAPI,
  groups: groupsAPI,
  challenges: challengesAPI,
  profiles: profilesAPI,

  // Convenience methods
  async getFeedOverview() {
    const [posts, groups, challenges] = await Promise.all([
      postsAPI.getAll({ limit: 10, sortBy: 'trending' }),
      groupsAPI.getAll({ limit: 6 }),
      challengesAPI.getAll({ status: 'ACTIVE', limit: 5 })
    ]);

    return {
      posts: posts.posts || [],
      groups: groups.groups || [],
      challenges: challenges.challenges || []
    };
  },

  async getPersonalizedFeed(params?: {
    page?: number;
    limit?: number;
  }) {
    const response = await postsAPI.getAll({
      following: true,
      ...params
    });
    return response.posts || [];
  },

  async getTrendingContent() {
    const [trendingPosts, activeGroups, latestChallenges] = await Promise.all([
      postsAPI.getAll({ sortBy: 'trending', limit: 10 }),
      groupsAPI.getAll({ limit: 8 }),
      challengesAPI.getAll({ status: 'ACTIVE', limit: 5 })
    ]);

    return {
      posts: trendingPosts.posts || [],
      groups: activeGroups.groups || [],
      challenges: latestChallenges.challenges || []
    };
  },

  async searchCommunity(query: string, type: 'posts' | 'groups' | 'profiles' = 'posts') {
    switch (type) {
      case 'posts':
        return postsAPI.getAll({ search: query });
      case 'groups':
        return groupsAPI.getAll({ search: query });
      case 'profiles':
        return profilesAPI.search(query);
      default:
        return postsAPI.getAll({ search: query });
    }
  },

  async getNotifications(params?: {
    type?: string;
    isRead?: boolean;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/community/notifications', { params });
    return response.data;
  },

  async markNotificationAsRead(notificationId: string) {
    const response = await apiClient.patch(`/community/notifications/${notificationId}/read`);
    return response.data;
  },

  async getUnreadNotificationCount() {
    const response = await apiClient.get('/community/notifications/unread-count');
    return response.data;
  }
};

export default communityAPI;