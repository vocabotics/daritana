import { Router } from 'express';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get all employees
router.get('/employees', authenticate, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    
    const employees = await prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: true,
        organization: true
      }
    });
    
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Get employee by ID
router.get('/employees/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;
    
    const employee = await prisma.organizationMember.findFirst({
      where: { 
        id,
        organizationId 
      },
      include: {
        user: true,
        organization: true
      }
    });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// Update employee
router.put('/employees/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { department, position, salary } = req.body;
    
    const employee = await prisma.organizationMember.update({
      where: { id },
      data: {
        department,
        position
      },
      include: {
        user: true,
        organization: true
      }
    });
    
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Get leave requests
router.get('/leaves', authenticate, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    
    // Mock leave requests
    const leaves = [
      {
        id: 'l1',
        employeeId: 'e1',
        employeeName: 'Sarah Chen',
        type: 'annual',
        startDate: '2024-06-01',
        endDate: '2024-06-05',
        days: 5,
        reason: 'Family vacation',
        status: 'approved',
        approvedBy: 'Ahmad Rahman',
        approvedDate: '2024-05-15'
      },
      {
        id: 'l2',
        employeeId: 'e2',
        employeeName: 'Lisa Wong',
        type: 'medical',
        startDate: '2024-05-20',
        endDate: '2024-05-21',
        days: 2,
        reason: 'Medical appointment',
        status: 'pending',
        approvedBy: null,
        approvedDate: null
      }
    ];
    
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// Create leave request
router.post('/leaves', authenticate, async (req, res) => {
  try {
    const { id: userId } = req.user!;
    const { type, startDate, endDate, reason } = req.body;
    
    const leave = {
      id: `l${Date.now()}`,
      employeeId: userId,
      type,
      startDate,
      endDate,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    res.json(leave);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create leave request' });
  }
});

// Approve/reject leave
router.put('/leaves/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    const { id: userId } = req.user!;
    
    res.json({ 
      success: true,
      status,
      approvedBy: userId,
      approvedDate: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update leave status' });
  }
});

// Get payroll
router.get('/payroll', authenticate, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    
    // Mock payroll data
    const payroll = [
      {
        id: 'p1',
        employeeId: 'e1',
        employeeName: 'Sarah Chen',
        month: 'May 2024',
        basicSalary: 8500,
        allowances: 1500,
        deductions: 850,
        netSalary: 9150,
        status: 'paid',
        paidDate: '2024-05-25'
      },
      {
        id: 'p2',
        employeeId: 'e2',
        employeeName: 'Lisa Wong',
        month: 'May 2024',
        basicSalary: 6500,
        allowances: 1000,
        deductions: 650,
        netSalary: 6850,
        status: 'pending',
        paidDate: null
      }
    ];
    
    res.json(payroll);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payroll' });
  }
});

// Process payroll
router.post('/payroll/process', authenticate, async (req, res) => {
  try {
    const { month, employeeIds } = req.body;
    
    res.json({ 
      success: true,
      processed: employeeIds.length,
      month
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process payroll' });
  }
});

// Get attendance
router.get('/attendance', authenticate, async (req, res) => {
  try {
    const { date } = req.query;
    const { organizationId } = req.user!;
    
    // Mock attendance data
    const attendance = [
      {
        id: 'a1',
        employeeId: 'e1',
        employeeName: 'Sarah Chen',
        date: date || new Date().toISOString().split('T')[0],
        checkIn: '09:00',
        checkOut: '18:30',
        status: 'present',
        overtime: 0.5
      },
      {
        id: 'a2',
        employeeId: 'e2',
        employeeName: 'Lisa Wong',
        date: date || new Date().toISOString().split('T')[0],
        checkIn: '08:45',
        checkOut: '17:30',
        status: 'present',
        overtime: 0
      }
    ];
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Record attendance
router.post('/attendance', authenticate, async (req, res) => {
  try {
    const { id: userId } = req.user!;
    const { type } = req.body; // 'check-in' or 'check-out'
    
    res.json({ 
      success: true,
      type,
      time: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

// Get performance reviews
router.get('/performance', authenticate, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    
    // Mock performance data
    const reviews = [
      {
        id: 'r1',
        employeeId: 'e1',
        employeeName: 'Sarah Chen',
        reviewPeriod: 'Q1 2024',
        overallRating: 4.5,
        categories: {
          quality: 4.7,
          productivity: 4.3,
          teamwork: 4.8,
          initiative: 4.2
        },
        reviewedBy: 'Ahmad Rahman',
        reviewDate: '2024-04-15',
        comments: 'Excellent performance, meets all expectations'
      }
    ];
    
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch performance reviews' });
  }
});

// Create performance review
router.post('/performance', authenticate, async (req, res) => {
  try {
    const { id: reviewerId } = req.user!;
    const { employeeId, ratings, comments, period } = req.body;
    
    const review = {
      id: `r${Date.now()}`,
      employeeId,
      reviewPeriod: period,
      ...ratings,
      reviewedBy: reviewerId,
      comments,
      reviewDate: new Date().toISOString()
    };
    
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create performance review' });
  }
});

export default router;