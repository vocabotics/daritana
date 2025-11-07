import { api } from '@/lib/api';

export interface EnrolledCourse {
  id: string;
  course: {
    id: string;
    title: string;
    code: string;
    instructor: {
      user: {
        firstName: string;
        lastName: string;
        avatar?: string;
      };
    };
    _count: {
      lessons: number;
      assignments: number;
    };
  };
  progress: {
    completedLessons: number;
    totalLessons: number;
    percentage: number;
  };
  status: string;
  enrolledAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxPoints: number;
  course: {
    title: string;
    code: string;
  };
  isSubmitted: boolean;
  grade?: number;
  submittedAt?: string;
}

export interface StudentStats {
  totalCourses: number;
  completedLessons: number;
  pendingAssignments: number;
  averageProgress: number;
}

export interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
  instructor: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    company: string;
    rating: number;
    verified: boolean;
  };
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in hours
  lessons: number;
  assignments: number;
  price: number;
  currency: string;
  thumbnail: string;
  tags: string[];
  isEnrolled: boolean;
  isCompleted: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  duration: number; // in minutes
  order: number;
  isCompleted: boolean;
  videoUrl?: string;
  documents?: Array<{ name: string; type: string; url: string }>;
}

export interface AssignmentSubmission {
  assignmentId: string;
  content: string;
  attachments?: Array<{ name: string; type: string; url: string }>;
  notes?: string;
}

class LearningService {
  // Course enrollment and management
  async getEnrolledCourses(): Promise<EnrolledCourse[]> {
    try {
      const response = await api.get<EnrolledCourse[]>('/learning/enrolled-courses');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch enrolled courses:', error);
      throw error;
    }
  }

  async enrollInCourse(courseId: string): Promise<EnrolledCourse> {
    try {
      const response = await api.post<EnrolledCourse>(`/learning/courses/${courseId}/enroll`);
      return response.data;
    } catch (error) {
      console.error('Failed to enroll in course:', error);
      throw error;
    }
  }

  async unenrollFromCourse(courseId: string): Promise<void> {
    try {
      await api.delete(`/learning/courses/${courseId}/enroll`);
    } catch (error) {
      console.error('Failed to unenroll from course:', error);
      throw error;
    }
  }

  async getCourseProgress(courseId: string): Promise<any> {
    try {
      const response = await api.get<any>(`/learning/courses/${courseId}/progress`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch course progress:', error);
      throw error;
    }
  }

  // Course actions
  async resumeCourse(courseId: string): Promise<void> {
    try {
      await api.post(`/learning/courses/${courseId}/resume`);
    } catch (error) {
      console.error('Failed to resume course:', error);
      throw error;
    }
  }

  async viewCourse(courseId: string): Promise<void> {
    try {
      await api.post(`/learning/courses/${courseId}/view`);
    } catch (error) {
      console.error('Failed to record course view:', error);
      throw error;
    }
  }

  async downloadCourse(courseId: string): Promise<Blob> {
    try {
      const response = await api.get(`/learning/courses/${courseId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to download course:', error);
      throw error;
    }
  }

  // Course browsing
  async getAvailableCourses(filters?: any): Promise<Course[]> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }
      
      const response = await api.get<Course[]>(`/learning/courses?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch available courses:', error);
      throw error;
    }
  }

  async getCourseById(courseId: string): Promise<Course> {
    try {
      const response = await api.get<Course>(`/learning/courses/${courseId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch course ${courseId}:`, error);
      throw error;
    }
  }

  async searchCourses(query: string): Promise<Course[]> {
    try {
      const response = await api.get<Course[]>(`/learning/courses/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Failed to search courses:', error);
      throw error;
    }
  }

  async getCoursesByCategory(category: string): Promise<Course[]> {
    try {
      const response = await api.get<Course[]>(`/learning/courses/category/${encodeURIComponent(category)}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch courses by category ${category}:`, error);
      throw error;
    }
  }

  async getCoursesByInstructor(instructorId: string): Promise<Course[]> {
    try {
      const response = await api.get<Course[]>(`/learning/courses/instructor/${instructorId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch courses by instructor ${instructorId}:`, error);
      throw error;
    }
  }

  // Lesson management
  async getCourseLessons(courseId: string): Promise<Lesson[]> {
    try {
      const response = await api.get<Lesson[]>(`/learning/courses/${courseId}/lessons`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch lessons for course ${courseId}:`, error);
      throw error;
    }
  }

  async getLessonById(lessonId: string): Promise<Lesson> {
    try {
      const response = await api.get<Lesson>(`/learning/lessons/${lessonId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch lesson ${lessonId}:`, error);
      throw error;
    }
  }

  async markLessonComplete(lessonId: string): Promise<void> {
    try {
      await api.post(`/learning/lessons/${lessonId}/complete`);
    } catch (error) {
      console.error(`Failed to mark lesson ${lessonId} as complete:`, error);
      throw error;
    }
  }

  async markLessonIncomplete(lessonId: string): Promise<void> {
    try {
      await api.delete(`/learning/lessons/${lessonId}/complete`);
    } catch (error) {
      console.error(`Failed to mark lesson ${lessonId} as incomplete:`, error);
      throw error;
    }
  }

  // Assignment management
  async getStudentAssignments(): Promise<Assignment[]> {
    try {
      const response = await api.get<Assignment[]>('/learning/assignments');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch student assignments:', error);
      throw error;
    }
  }

  async getAssignmentById(assignmentId: string): Promise<Assignment> {
    try {
      const response = await api.get<Assignment>(`/learning/assignments/${assignmentId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch assignment ${assignmentId}:`, error);
      throw error;
    }
  }

  async submitAssignment(assignmentId: string, submission: AssignmentSubmission): Promise<any> {
    try {
      const response = await api.post<any>(`/learning/assignments/${assignmentId}/submit`, submission);
      return response.data;
    } catch (error) {
      console.error(`Failed to submit assignment ${assignmentId}:`, error);
      throw error;
    }
  }

  async viewAssignment(assignmentId: string): Promise<void> {
    try {
      await api.post(`/learning/assignments/${assignmentId}/view`);
    } catch (error) {
      console.error(`Failed to record assignment view ${assignmentId}:`, error);
      throw error;
    }
  }

  async downloadAssignment(assignmentId: string): Promise<Blob> {
    try {
      const response = await api.get(`/learning/assignments/${assignmentId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to download assignment ${assignmentId}:`, error);
      throw error;
    }
  }

  // Student statistics and progress
  async getStudentStats(): Promise<StudentStats> {
    try {
      const response = await api.get<StudentStats>('/learning/student/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch student stats:', error);
      throw error;
    }
  }

  async getLearningHistory(period: 'week' | 'month' | 'year' = 'month'): Promise<any[]> {
    try {
      const response = await api.get<any[]>(`/learning/student/history?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch learning history:', error);
      throw error;
    }
  }

  async getLearningStreak(): Promise<any> {
    try {
      const response = await api.get<any>('/learning/student/streak');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch learning streak:', error);
      throw error;
    }
  }

  // Certificates and achievements
  async getCertificates(): Promise<any[]> {
    try {
      const response = await api.get<any[]>('/learning/student/certificates');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
      throw error;
    }
  }

  async downloadCertificate(certificateId: string): Promise<Blob> {
    try {
      const response = await api.get(`/learning/certificates/${certificateId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to download certificate ${certificateId}:`, error);
      throw error;
    }
  }

  async getAchievements(): Promise<any[]> {
    try {
      const response = await api.get<any[]>('/learning/student/achievements');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
      throw error;
    }
  }

  // Course reviews and ratings
  async getCourseReviews(courseId: string): Promise<any[]> {
    try {
      const response = await api.get<any[]>(`/learning/courses/${courseId}/reviews`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch reviews for course ${courseId}:`, error);
      throw error;
    }
  }

  async addCourseReview(courseId: string, review: any): Promise<any> {
    try {
      const response = await api.post<any>(`/learning/courses/${courseId}/reviews`, review);
      return response.data;
    } catch (error) {
      console.error(`Failed to add review for course ${courseId}:`, error);
      throw error;
    }
  }

  // Learning analytics
  async getLearningAnalytics(period: 'week' | 'month' | 'year' = 'month'): Promise<any> {
    try {
      const response = await api.get<any>(`/learning/analytics?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch learning analytics:', error);
      throw error;
    }
  }

  async getCourseAnalytics(courseId: string): Promise<any> {
    try {
      const response = await api.get<any>(`/learning/courses/${courseId}/analytics`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch analytics for course ${courseId}:`, error);
      throw error;
    }
  }

  // Export learning data
  async exportLearningData(format: 'csv' | 'excel' | 'pdf' = 'csv'): Promise<Blob> {
    try {
      const response = await api.get(`/learning/export?format=${format}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to export learning data:', error);
      throw error;
    }
  }
}

export const learningService = new LearningService();