import { apiClient } from './api';

export interface Employee {
  id: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  userId?: string;
  role?: any;
  department?: string;
  position?: string;
  joinDate?: string;
  status?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName?: string;
  type: 'annual' | 'medical' | 'emergency' | 'unpaid';
  startDate: string;
  endDate: string;
  days?: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedDate?: string;
}

export interface Payroll {
  id: string;
  employeeId: string;
  employeeName?: string;
  month: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'pending' | 'paid';
  paidDate?: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  employeeName?: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  overtime?: number;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName?: string;
  reviewPeriod: string;
  overallRating: number;
  categories?: {
    quality: number;
    productivity: number;
    teamwork: number;
    initiative: number;
  };
  reviewedBy: string;
  reviewDate: string;
  comments: string;
}

class HRService {
  async getEmployees(): Promise<Employee[]> {
    const response = await apiClient.get('/hr/employees');
    return response.data;
  }

  async getEmployee(id: string): Promise<Employee> {
    const response = await apiClient.get(`/hr/employees/${id}`);
    return response.data;
  }

  async updateEmployee(id: string, data: {
    department?: string;
    position?: string;
    salary?: number;
  }): Promise<Employee> {
    const response = await apiClient.put(`/hr/employees/${id}`, data);
    return response.data;
  }

  async getLeaveRequests(): Promise<LeaveRequest[]> {
    const response = await apiClient.get('/hr/leaves');
    return response.data;
  }

  async createLeaveRequest(leave: {
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<LeaveRequest> {
    const response = await apiClient.post('/hr/leaves', leave);
    return response.data;
  }

  async updateLeaveStatus(id: string, status: string, comments?: string): Promise<any> {
    const response = await apiClient.put(`/hr/leaves/${id}/status`, { status, comments });
    return response.data;
  }

  async getPayroll(): Promise<Payroll[]> {
    const response = await apiClient.get('/hr/payroll');
    return response.data;
  }

  async processPayroll(month: string, employeeIds: string[]): Promise<any> {
    const response = await apiClient.post('/hr/payroll/process', { month, employeeIds });
    return response.data;
  }

  async getAttendance(date?: string): Promise<Attendance[]> {
    const params = date ? `?date=${date}` : '';
    const response = await apiClient.get(`/hr/attendance${params}`);
    return response.data;
  }

  async recordAttendance(type: 'check-in' | 'check-out'): Promise<any> {
    const response = await apiClient.post('/hr/attendance', { type });
    return response.data;
  }

  async getPerformanceReviews(): Promise<PerformanceReview[]> {
    const response = await apiClient.get('/hr/performance');
    return response.data;
  }

  async createPerformanceReview(review: {
    employeeId: string;
    period: string;
    ratings: any;
    comments: string;
  }): Promise<PerformanceReview> {
    const response = await apiClient.post('/hr/performance', review);
    return response.data;
  }
}

export const hrService = new HRService();