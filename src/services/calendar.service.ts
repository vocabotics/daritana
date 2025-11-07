import { apiClient } from './api';

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  meetingUrl?: string;
  organizerId: string;
  organizer?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  participants?: {
    id: string;
    userId: string;
    user?: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    };
    role: string;
    status: string;
  }[];
  projectId?: string;
  project?: {
    id: string;
    name: string;
  };
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  type: 'STANDUP' | 'PLANNING' | 'REVIEW' | 'CLIENT' | 'INTERNAL' | 'EXTERNAL';
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: any;
  color?: string;
  type?: string;
}

class CalendarService {
  async getMeetings(params?: {
    startDate?: Date;
    endDate?: Date;
    projectId?: string;
    userId?: string;
  }): Promise<Meeting[]> {
    try {
      const response = await apiClient.get('/api/meetings', {
        params: {
          ...params,
          startDate: params?.startDate?.toISOString(),
          endDate: params?.endDate?.toISOString()
        }
      });
      
      if (response.data.success) {
        return response.data.data.map((meeting: any) => ({
          ...meeting,
          startTime: new Date(meeting.startTime),
          endTime: new Date(meeting.endTime),
          createdAt: new Date(meeting.createdAt),
          updatedAt: new Date(meeting.updatedAt)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching meetings:', error);
      return [];
    }
  }

  async createMeeting(data: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    meetingUrl?: string;
    projectId?: string;
    type?: string;
    participants?: string[];
  }): Promise<Meeting | null> {
    try {
      const response = await apiClient.post('/api/meetings', {
        ...data,
        startTime: data.startTime.toISOString(),
        endTime: data.endTime.toISOString()
      });
      
      if (response.data.success) {
        return {
          ...response.data.data,
          startTime: new Date(response.data.data.startTime),
          endTime: new Date(response.data.data.endTime),
          createdAt: new Date(response.data.data.createdAt),
          updatedAt: new Date(response.data.data.updatedAt)
        };
      }
      return null;
    } catch (error) {
      console.error('Error creating meeting:', error);
      return null;
    }
  }

  async updateMeeting(id: string, data: Partial<{
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    location: string;
    meetingUrl: string;
    status: string;
  }>): Promise<Meeting | null> {
    try {
      const updateData: any = { ...data };
      if (data.startTime) updateData.startTime = data.startTime.toISOString();
      if (data.endTime) updateData.endTime = data.endTime.toISOString();
      
      const response = await apiClient.patch(`/api/meetings/${id}`, updateData);
      
      if (response.data.success) {
        return {
          ...response.data.data,
          startTime: new Date(response.data.data.startTime),
          endTime: new Date(response.data.data.endTime),
          createdAt: new Date(response.data.data.createdAt),
          updatedAt: new Date(response.data.data.updatedAt)
        };
      }
      return null;
    } catch (error) {
      console.error('Error updating meeting:', error);
      return null;
    }
  }

  async deleteMeeting(id: string): Promise<boolean> {
    try {
      const response = await apiClient.delete(`/api/meetings/${id}`);
      return response.data.success;
    } catch (error) {
      console.error('Error deleting meeting:', error);
      return false;
    }
  }

  async addParticipant(meetingId: string, userId: string, role?: string): Promise<boolean> {
    try {
      const response = await apiClient.post(`/api/meetings/${meetingId}/participants`, {
        userId,
        role: role || 'ATTENDEE'
      });
      return response.data.success;
    } catch (error) {
      console.error('Error adding participant:', error);
      return false;
    }
  }

  async removeParticipant(meetingId: string, userId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete(`/api/meetings/${meetingId}/participants/${userId}`);
      return response.data.success;
    } catch (error) {
      console.error('Error removing participant:', error);
      return false;
    }
  }

  async updateParticipantStatus(meetingId: string, userId: string, status: string): Promise<boolean> {
    try {
      const response = await apiClient.patch(`/api/meetings/${meetingId}/participants/${userId}`, {
        status
      });
      return response.data.success;
    } catch (error) {
      console.error('Error updating participant status:', error);
      return false;
    }
  }

  // Convert meetings to calendar events for calendar components
  meetingsToCalendarEvents(meetings: Meeting[]): CalendarEvent[] {
    return meetings.map(meeting => ({
      id: meeting.id,
      title: meeting.title,
      start: meeting.startTime,
      end: meeting.endTime,
      resource: meeting,
      color: this.getEventColor(meeting.type),
      type: meeting.type
    }));
  }

  private getEventColor(type?: string): string {
    const colors: Record<string, string> = {
      'STANDUP': '#10b981',    // green
      'PLANNING': '#3b82f6',    // blue
      'REVIEW': '#8b5cf6',      // purple
      'CLIENT': '#f59e0b',      // yellow
      'INTERNAL': '#6b7280',    // gray
      'EXTERNAL': '#ef4444'     // red
    };
    return colors[type || ''] || '#3b82f6';
  }

  // Get upcoming meetings for a user
  async getUpcomingMeetings(userId?: string, limit: number = 5): Promise<Meeting[]> {
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // Next 30 days
    
    const meetings = await this.getMeetings({
      startDate: now,
      endDate,
      userId
    });
    
    return meetings
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .slice(0, limit);
  }

  // Get today's meetings
  async getTodaysMeetings(userId?: string): Promise<Meeting[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.getMeetings({
      startDate: today,
      endDate: tomorrow,
      userId
    });
  }
}

export const calendarService = new CalendarService();