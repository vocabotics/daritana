import { Request, Response } from 'express';
import { prisma } from '../server';


interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    role: string;
  };
}

// Get project performance analytics
export const getProjectPerformance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const { projectId, period = '30' } = req.query;

    const periodDays = Number(period);
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);

    const where: any = {
      organizationId,
      ...(projectId && { id: String(projectId) }),
      ...(period !== 'all' && { createdAt: { gte: periodStart } }),
    };

    const projects = await prisma.project.findMany({
      where,
      include: {
        tasks: {
          select: {
            status: true,
            priority: true,
            estimatedHours: true,
            actualHours: true,
            createdAt: true,
            completedAt: true,
          },
        },
        expenses: {
          select: {
            amount: true,
            status: true,
            category: true,
          },
        },
        members: {
          select: {
            userId: true,
            role: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            documents: true,
            meetings: true,
          },
        },
      },
    });

    const analytics = projects.map(project => {
      const tasks = project.tasks;
      const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
      const overdueTasks = tasks.filter(t => t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < new Date());
      
      // Progress calculations
      const progressPercentage = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
      
      // Time tracking
      const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
      const totalActual = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
      const timeVariance = totalEstimated > 0 ? ((totalActual - totalEstimated) / totalEstimated) * 100 : 0;
      
      // Budget tracking
      const totalExpenses = project.expenses.reduce((sum, e) => sum + e.amount, 0);
      const budgetVariance = project.approvedBudget 
        ? ((totalExpenses - project.approvedBudget) / project.approvedBudget) * 100 
        : 0;
      
      // Team productivity
      const teamSize = project.members.length;
      const tasksPerMember = teamSize > 0 ? tasks.length / teamSize : 0;
      
      return {
        projectId: project.id,
        projectName: project.name,
        status: project.status,
        progress: progressPercentage,
        tasks: {
          total: tasks.length,
          completed: completedTasks.length,
          overdue: overdueTasks.length,
          completionRate: progressPercentage,
        },
        time: {
          estimatedHours: totalEstimated,
          actualHours: totalActual,
          variance: timeVariance,
          efficiency: totalEstimated > 0 ? (totalEstimated / totalActual) * 100 : 0,
        },
        budget: {
          approved: project.approvedBudget || 0,
          spent: totalExpenses,
          variance: budgetVariance,
          remaining: (project.approvedBudget || 0) - totalExpenses,
        },
        team: {
          size: teamSize,
          tasksPerMember,
          productivity: completedTasks.length > 0 ? totalActual / completedTasks.length : 0,
        },
        metrics: {
          documentsCount: project._count.documents,
          meetingsCount: project._count.meetings,
        },
      };
    });

    // Overall statistics
    const totalProjects = analytics.length;
    const avgProgress = analytics.reduce((sum, p) => sum + p.progress, 0) / totalProjects || 0;
    const onTimeProjects = analytics.filter(p => p.time.variance <= 10).length;
    const onBudgetProjects = analytics.filter(p => Math.abs(p.budget.variance) <= 10).length;

    res.json({
      projects: analytics,
      summary: {
        totalProjects,
        averageProgress: Math.round(avgProgress * 10) / 10,
        onTimeDelivery: totalProjects > 0 ? (onTimeProjects / totalProjects) * 100 : 0,
        budgetCompliance: totalProjects > 0 ? (onBudgetProjects / totalProjects) * 100 : 0,
      },
      period: periodDays,
    });
  } catch (error) {
    console.error('Error fetching project analytics:', error);
    res.status(500).json({ error: 'Failed to fetch project analytics' });
  }
};

// Get project trends and forecasting
export const getProjectTrends = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.user!;
    
    // Get monthly project data for the last 12 months
    const monthlyData = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as projects_created,
        AVG(progress) as avg_progress,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_projects,
        AVG(CASE WHEN approved_budget IS NOT NULL THEN approved_budget END) as avg_budget
      FROM "Project" 
      WHERE organization_id = ${organizationId}
        AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `;

    // Task completion trends
    const taskTrends = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('week', created_at) as week,
        COUNT(*) as tasks_created,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as tasks_completed,
        AVG(CASE WHEN estimated_hours IS NOT NULL AND actual_hours IS NOT NULL 
            THEN actual_hours / estimated_hours END) as time_accuracy
      FROM "Task" 
      WHERE organization_id = ${organizationId}
        AND created_at >= NOW() - INTERVAL '3 months'
      GROUP BY DATE_TRUNC('week', created_at)
      ORDER BY week
    `;

    // Project type performance
    const typePerformance = await prisma.project.groupBy({
      by: ['type'],
      where: { organizationId },
      _count: { id: true },
      _avg: { progress: true, actualCost: true },
    });

    res.json({
      monthlyTrends: monthlyData,
      taskTrends,
      typePerformance,
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error fetching project trends:', error);
    res.status(500).json({ error: 'Failed to fetch project trends' });
  }
};

// Get project risk analysis
export const getProjectRiskAnalysis = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.user!;

    const projects = await prisma.project.findMany({
      where: { organizationId },
      include: {
        tasks: {
          select: {
            status: true,
            dueDate: true,
            priority: true,
          },
        },
        riskAssessments: {
          select: {
            riskScore: true,
            status: true,
            category: true,
          },
        },
      },
    });

    const riskAnalysis = projects.map(project => {
      const tasks = project.tasks;
      const risks = project.riskAssessments;
      
      // Schedule risk
      const overdueTasks = tasks.filter(t => 
        t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < new Date()
      ).length;
      const scheduleRisk = tasks.length > 0 ? (overdueTasks / tasks.length) : 0;
      
      // High priority incomplete tasks
      const highPriorityIncomplete = tasks.filter(t => 
        t.status !== 'COMPLETED' && t.priority === 'HIGH'
      ).length;
      
      // Overall risk score from assessments
      const avgRiskScore = risks.length > 0 
        ? risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length 
        : 0;
      
      // Project health score (lower is better)
      const healthScore = (scheduleRisk * 0.4) + (avgRiskScore * 0.6);
      
      let riskLevel = 'LOW';
      if (healthScore > 0.7) riskLevel = 'HIGH';
      else if (healthScore > 0.4) riskLevel = 'MEDIUM';
      
      return {
        projectId: project.id,
        projectName: project.name,
        status: project.status,
        riskLevel,
        healthScore: Math.round(healthScore * 100) / 100,
        scheduleRisk: Math.round(scheduleRisk * 100) / 100,
        overdueTasks,
        highPriorityTasks: highPriorityIncomplete,
        totalRisks: risks.length,
        activeRisks: risks.filter(r => r.status !== 'CLOSED').length,
      };
    });

    // Risk distribution
    const riskDistribution = {
      LOW: riskAnalysis.filter(p => p.riskLevel === 'LOW').length,
      MEDIUM: riskAnalysis.filter(p => p.riskLevel === 'MEDIUM').length,
      HIGH: riskAnalysis.filter(p => p.riskLevel === 'HIGH').length,
    };

    res.json({
      projects: riskAnalysis.sort((a, b) => b.healthScore - a.healthScore),
      riskDistribution,
      summary: {
        totalProjects: riskAnalysis.length,
        highRiskProjects: riskDistribution.HIGH,
        avgHealthScore: riskAnalysis.reduce((sum, p) => sum + p.healthScore, 0) / riskAnalysis.length || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching risk analysis:', error);
    res.status(500).json({ error: 'Failed to fetch risk analysis' });
  }
};