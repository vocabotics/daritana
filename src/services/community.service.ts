import { apiClient } from './api';

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author?: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  };
  authorId?: string;
  category: string;
  likes: number;
  comments: number | any[];
  views: number;
  tags: string[];
  createdAt: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: string;
  attendees: number;
  maxAttendees: number;
  organizer: string;
}

export interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  members: number;
  posts: number;
  category: string;
  privacy: 'public' | 'private';
  image?: string;
}

export interface Connection {
  id: string;
  user: {
    id: string;
    name: string;
    role: string;
    company: string;
    avatar?: string;
  };
  connectedAt: string;
}

class CommunityService {
  async getPosts(filters?: {
    category?: string;
    search?: string;
  }): Promise<CommunityPost[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    
    const response = await apiClient.get(`/community/posts?${params}`);
    return response.data;
  }

  async getPost(id: string): Promise<CommunityPost> {
    const response = await apiClient.get(`/community/posts/${id}`);
    return response.data;
  }

  async createPost(post: {
    title: string;
    content: string;
    category: string;
    tags: string[];
  }): Promise<CommunityPost> {
    const response = await apiClient.post('/community/posts', post);
    return response.data;
  }

  async likePost(postId: string): Promise<any> {
    const response = await apiClient.post(`/community/posts/${postId}/like`);
    return response.data;
  }

  async addComment(postId: string, content: string): Promise<any> {
    const response = await apiClient.post(`/community/posts/${postId}/comments`, { content });
    return response.data;
  }

  async getEvents(): Promise<CommunityEvent[]> {
    const response = await apiClient.get('/community/events');
    return response.data;
  }

  async registerForEvent(eventId: string): Promise<any> {
    const response = await apiClient.post(`/community/events/${eventId}/register`);
    return response.data;
  }

  async getGroups(): Promise<CommunityGroup[]> {
    const response = await apiClient.get('/community/groups');
    return response.data;
  }

  async joinGroup(groupId: string): Promise<any> {
    const response = await apiClient.post(`/community/groups/${groupId}/join`);
    return response.data;
  }

  async getConnections(): Promise<Connection[]> {
    const response = await apiClient.get('/community/connections');
    return response.data;
  }

  async sendConnectionRequest(userId: string, message?: string): Promise<any> {
    const response = await apiClient.post('/community/connections/request', { 
      userId, 
      message 
    });
    return response.data;
  }
}

export const communityService = new CommunityService();