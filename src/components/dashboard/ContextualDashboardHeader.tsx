import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Building,
  Target,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  MapPin,
  Briefcase,
  Star,
  ArrowUp,
  ArrowDown,
  Activity
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useProjectContextStore } from '@/store/projectContextStore';
import { useProjectStore } from '@/store/projectStore';

interface ContextualDashboardHeaderProps {
  onSwitchMode?: () => void;
}

export const ContextualDashboardHeader: React.FC<ContextualDashboardHeaderProps> = ({
  onSwitchMode
}) => {
  const { user } = useAuthStore();
  const { mode, currentProject, recentProjects } = useProjectContextStore();
  const { projects } = useProjectStore();

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return `${greeting}, ${user?.name}`;
  };

  const getGlobalStats = () => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedThisMonth = projects.filter(p => {
      const completed = p.status === 'completed' && p.updatedAt;
      if (!completed) return false;
      const updatedDate = new Date(p.updatedAt);
      const now = new Date();
      return updatedDate.getMonth() === now.getMonth() && updatedDate.getFullYear() === now.getFullYear();
    }).length;
    
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const completionRate = totalProjects > 0 ? Math.round((projects.filter(p => p.status === 'completed').length / totalProjects) * 100) : 0;

    return {
      totalProjects,
      activeProjects,
      completedThisMonth,
      totalBudget,
      completionRate
    };
  };

  const getProjectStats = () => {
    if (!currentProject) return null;
    
    // Mock project data - in real app, this would come from project store
    const progress = Math.floor(Math.random() * 100);
    const daysRemaining = Math.floor(Math.random() * 30) + 1;
    const teamSize = Math.floor(Math.random() * 8) + 3;
    const budget = currentProject.budget || Math.floor(Math.random() * 500000) + 100000;
    const spent = Math.floor(budget * (progress / 100) * 1.1);
    
    return {
      progress,
      daysRemaining,
      teamSize,
      budget,
      spent
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (mode === 'global') {
    const stats = getGlobalStats();
    
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{getWelcomeMessage()}</h1>
            <p className="text-gray-600 mt-1">
              Here's your portfolio overview for {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {currentProject && (
              <Button variant="outline" size="sm" onClick={onSwitchMode}>
                <Target className="h-4 w-4 mr-1" />
                Switch to Project
              </Button>
            )}
          </div>
        </div>

        {/* Global Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Projects</p>
                <p className="text-2xl font-bold">{stats.totalProjects}</p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-200" />
            </div>
            <div className="flex items-center mt-2">
              <ArrowUp className="h-3 w-3 text-green-300 mr-1" />
              <span className="text-xs text-blue-100">+12% this month</span>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Active Projects</p>
                <p className="text-2xl font-bold">{stats.activeProjects}</p>
              </div>
              <Activity className="h-8 w-8 text-green-200" />
            </div>
            <div className="flex items-center mt-2">
              <ArrowUp className="h-3 w-3 text-emerald-300 mr-1" />
              <span className="text-xs text-green-100">+8% from last week</span>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Completed</p>
                <p className="text-2xl font-bold">{stats.completedThisMonth}</p>
              </div>
              <Star className="h-8 w-8 text-purple-200" />
            </div>
            <div className="flex items-center mt-2">
              <span className="text-xs text-purple-100">This month</span>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-4 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">Portfolio Value</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalBudget)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-amber-200" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-amber-200 mr-1" />
              <span className="text-xs text-amber-100">+15% growth</span>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-gray-600 to-gray-700 text-white p-4 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Success Rate</p>
                <p className="text-2xl font-bold">{stats.completionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
            <div className="mt-2">
              <Progress value={stats.completionRate} className="h-1 bg-gray-600" />
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        {recentProjects.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Recent Projects</h3>
                <Button variant="ghost" size="sm" className="text-primary">
                  View All
                </Button>
              </div>
              <div className="space-y-2">
                {recentProjects.slice(0, 3).map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{project.name}</p>
                        <p className="text-xs text-gray-500">{project.client?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {project.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">{project.progress}%</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    );
  }

  // Project Mode
  const projectStats = getProjectStats();
  if (!currentProject || !projectStats) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Target className="h-8 w-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{currentProject.name}</h1>
              <Badge className="bg-purple-100 text-purple-800">
                <Target className="h-3 w-3 mr-1" />
                Project Focus
              </Badge>
            </div>
            <p className="text-gray-600 mb-2">{currentProject.type} • {currentProject.client?.name || 'Client'}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{currentProject.city}, {currentProject.state}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Started {currentProject.startDate ? new Date(currentProject.startDate).toLocaleDateString() : 'Recently'}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onSwitchMode}>
            <Building className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-green-500 to-emerald-500 text-white p-4 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Progress</p>
              <p className="text-2xl font-bold">{projectStats.progress}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-200" />
          </div>
          <div className="mt-2">
            <Progress value={projectStats.progress} className="h-1 bg-green-600" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-4 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Days Left</p>
              <p className="text-2xl font-bold">{projectStats.daysRemaining}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-200" />
          </div>
          <div className="flex items-center mt-2">
            <span className="text-xs text-blue-100">Until deadline</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-purple-500 to-violet-500 text-white p-4 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Team Size</p>
              <p className="text-2xl font-bold">{projectStats.teamSize}</p>
            </div>
            <Users className="h-8 w-8 text-purple-200" />
          </div>
          <div className="flex items-center mt-2">
            <div className="flex -space-x-1">
              {Array.from({ length: Math.min(projectStats.teamSize, 3) }).map((_, i) => (
                <Avatar key={i} className="w-4 h-4 border border-purple-400">
                  <AvatarFallback className="text-xs bg-purple-300">
                    {String.fromCharCode(65 + i)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-xs text-purple-100 ml-2">Active members</span>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-4 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Budget</p>
              <p className="text-lg font-bold">{formatCurrency(projectStats.budget)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-amber-200" />
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-amber-100">
              <span>Spent: {formatCurrency(projectStats.spent)}</span>
              <span>{Math.round((projectStats.spent / projectStats.budget) * 100)}%</span>
            </div>
            <Progress 
              value={Math.min((projectStats.spent / projectStats.budget) * 100, 100)} 
              className="h-1 bg-amber-600 mt-1" 
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};