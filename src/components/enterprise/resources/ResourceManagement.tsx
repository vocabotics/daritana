import React, { useState, useMemo } from 'react';
import { format, startOfWeek, addDays, differenceInDays, isWeekend } from 'date-fns';
import { Users, Calendar, TrendingUp, AlertCircle, Filter, Download, Settings, UserPlus, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Resource, ResourceAssignment, Skill } from '@/types/enterprise-pm';

interface ResourceManagementProps {
  resources: Resource[];
  assignments: ResourceAssignment[];
  startDate?: Date;
  endDate?: Date;
  onResourceUpdate?: (resource: Resource) => void;
  onAssignmentUpdate?: (assignment: ResourceAssignment) => void;
}

export const ResourceManagement: React.FC<ResourceManagementProps> = ({
  resources,
  assignments,
  startDate = new Date(),
  endDate = addDays(new Date(), 90),
  onResourceUpdate,
  onAssignmentUpdate
}) => {
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'allocation' | 'capacity' | 'skills' | 'cost'>('allocation');
  const [dateRange, setDateRange] = useState({ start: startOfWeek(startDate), end: endDate });

  // Calculate resource utilization
  const resourceUtilization = useMemo(() => {
    const utilization = new Map<string, Map<string, number>>();
    
    resources.forEach(resource => {
      const resourceUtil = new Map<string, number>();
      const resourceAssignments = assignments.filter(a => a.resourceId === resource.id);
      
      // Calculate daily utilization
      for (let date = new Date(dateRange.start); date <= dateRange.end; date = addDays(date, 1)) {
        const dateKey = format(date, 'yyyy-MM-dd');
        let dailyUnits = 0;
        
        resourceAssignments.forEach(assignment => {
          if (date >= assignment.startDate && date <= assignment.endDate) {
            dailyUnits += assignment.units;
          }
        });
        
        resourceUtil.set(dateKey, dailyUnits);
      }
      
      utilization.set(resource.id, resourceUtil);
    });
    
    return utilization;
  }, [resources, assignments, dateRange]);

  // Calculate resource statistics
  const resourceStats = useMemo(() => {
    return resources.map(resource => {
      const resourceAssignments = assignments.filter(a => a.resourceId === resource.id);
      const utilData = resourceUtilization.get(resource.id);
      
      let totalWork = 0;
      let totalCost = 0;
      let overallocatedDays = 0;
      let underallocatedDays = 0;
      
      resourceAssignments.forEach(assignment => {
        totalWork += assignment.work;
        totalCost += assignment.cost;
      });
      
      if (utilData) {
        utilData.forEach((units, date) => {
          if (units > resource.maxUnits) {
            overallocatedDays++;
          } else if (units < resource.maxUnits * 0.8) {
            underallocatedDays++;
          }
        });
      }
      
      const avgUtilization = utilData ? 
        Array.from(utilData.values()).reduce((a, b) => a + b, 0) / utilData.size : 0;
      
      return {
        resource,
        totalWork,
        totalCost,
        avgUtilization: avgUtilization * 100,
        overallocatedDays,
        underallocatedDays,
        efficiency: (avgUtilization / resource.maxUnits) * 100
      };
    });
  }, [resources, assignments, resourceUtilization]);

  // Render allocation heat map
  const renderAllocationHeatMap = () => {
    const weeks = Math.ceil(differenceInDays(dateRange.end, dateRange.start) / 7);
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white px-4 py-2 text-left text-sm font-medium">Resource</th>
              {Array.from({ length: weeks }, (_, i) => {
                const weekStart = addDays(dateRange.start, i * 7);
                return (
                  <th key={i} className="px-2 py-2 text-center text-xs">
                    {format(weekStart, 'MMM dd')}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {resources.map(resource => {
              const utilData = resourceUtilization.get(resource.id);
              
              return (
                <tr
                  key={resource.id}
                  className={cn(
                    "border-b hover:bg-gray-50 cursor-pointer",
                    selectedResource === resource.id && "bg-blue-50"
                  )}
                  onClick={() => setSelectedResource(resource.id)}
                >
                  <td className="sticky left-0 bg-white px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{resource.name}</p>
                        <p className="text-xs text-gray-500">{resource.department}</p>
                      </div>
                    </div>
                  </td>
                  {Array.from({ length: weeks }, (_, weekIndex) => {
                    let weekUtilization = 0;
                    let weekDays = 0;
                    
                    for (let d = 0; d < 7; d++) {
                      const date = addDays(dateRange.start, weekIndex * 7 + d);
                      if (date > dateRange.end) break;
                      
                      const dateKey = format(date, 'yyyy-MM-dd');
                      const dayUtil = utilData?.get(dateKey) || 0;
                      
                      if (!isWeekend(date)) {
                        weekUtilization += dayUtil;
                        weekDays++;
                      }
                    }
                    
                    const avgUtil = weekDays > 0 ? (weekUtilization / weekDays) * 100 : 0;
                    
                    return (
                      <td key={weekIndex} className="px-2 py-2">
                        <div
                          className={cn(
                            "h-8 rounded flex items-center justify-center text-xs font-medium",
                            avgUtil === 0 && "bg-gray-100",
                            avgUtil > 0 && avgUtil <= 50 && "bg-green-100 text-green-800",
                            avgUtil > 50 && avgUtil <= 80 && "bg-yellow-100 text-yellow-800",
                            avgUtil > 80 && avgUtil <= 100 && "bg-orange-100 text-orange-800",
                            avgUtil > 100 && "bg-red-100 text-red-800"
                          )}
                        >
                          {avgUtil > 0 && `${Math.round(avgUtil)}%`}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Render capacity planning view
  const renderCapacityPlanning = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resourceStats.map(stat => (
          <Card key={stat.resource.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{stat.resource.name}</CardTitle>
                    <p className="text-xs text-gray-500">{stat.resource.type}</p>
                  </div>
                </div>
                {stat.overallocatedDays > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    Overallocated
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Utilization</span>
                    <span className="font-medium">{Math.round(stat.avgUtilization)}%</span>
                  </div>
                  <Progress value={stat.avgUtilization} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Total Work</p>
                    <p className="font-medium">{stat.totalWork}h</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Cost</p>
                    <p className="font-medium">${stat.totalCost.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Efficiency</p>
                    <p className="font-medium">{Math.round(stat.efficiency)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Max Units</p>
                    <p className="font-medium">{(stat.resource.maxUnits * 100).toFixed(0)}%</p>
                  </div>
                </div>
                
                {stat.overallocatedDays > 0 && (
                  <div className="flex items-center gap-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{stat.overallocatedDays} days overallocated</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Render skills matrix
  const renderSkillsMatrix = () => {
    const allSkills = new Set<string>();
    resources.forEach(resource => {
      resource.skills?.forEach(skill => allSkills.add(skill.name));
    });
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white px-4 py-2 text-left text-sm font-medium">Resource</th>
              {Array.from(allSkills).map(skill => (
                <th key={skill} className="px-4 py-2 text-center text-sm font-medium">
                  {skill}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resources.map(resource => (
              <tr key={resource.id} className="border-b hover:bg-gray-50">
                <td className="sticky left-0 bg-white px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{resource.name}</span>
                  </div>
                </td>
                {Array.from(allSkills).map(skillName => {
                  const skill = resource.skills?.find(s => s.name === skillName);
                  
                  return (
                    <td key={skillName} className="px-4 py-2 text-center">
                      {skill && (
                        <div className="flex justify-center">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "w-2 h-6 rounded-sm",
                                  i < skill.proficiencyLevel ? "bg-blue-500" : "bg-gray-200"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render cost tracking
  const renderCostTracking = () => {
    const totalBudget = 500000; // Example budget
    const totalSpent = resourceStats.reduce((sum, stat) => sum + stat.totalCost, 0);
    const remainingBudget = totalBudget - totalSpent;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${totalBudget.toLocaleString()}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">${totalSpent.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{((totalSpent / totalBudget) * 100).toFixed(1)}% of budget</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">${remainingBudget.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{((remainingBudget / totalBudget) * 100).toFixed(1)}% remaining</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Burn Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${(totalSpent / 30).toFixed(0)}/day</p>
              <p className="text-xs text-gray-500">Average daily cost</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Resource Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resourceStats
                .sort((a, b) => b.totalCost - a.totalCost)
                .slice(0, 10)
                .map(stat => (
                  <div key={stat.resource.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{stat.resource.name}</p>
                        <p className="text-xs text-gray-500">
                          ${stat.resource.standardRate}/hr • {stat.totalWork}h
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">${stat.totalCost.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">
                        {((stat.totalCost / totalSpent) * 100).toFixed(1)}% of total
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Resource Management</h2>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                console.log('Adding new resource...');
                // TODO: Implement add resource functionality
                alert('Add Resource feature coming soon!');
              }}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Resource
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                console.log('Opening resource filters...');
                // TODO: Implement filter functionality
                alert('Resource filters coming soon!');
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                console.log('Exporting resource data...');
                // TODO: Implement export functionality
                alert('Resource export feature coming soon!');
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                console.log('Opening resource settings...');
                // TODO: Implement settings panel
                alert('Resource settings coming soon!');
              }}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Resources</p>
              <p className="text-xl font-semibold">{resources.length}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Utilization</p>
              <p className="text-xl font-semibold">
                {Math.round(resourceStats.reduce((sum, s) => sum + s.avgUtilization, 0) / resourceStats.length)}%
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Hours</p>
              <p className="text-xl font-semibold">
                {resourceStats.reduce((sum, s) => sum + s.totalWork, 0).toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Cost</p>
              <p className="text-xl font-semibold">
                ${resourceStats.reduce((sum, s) => sum + s.totalCost, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="flex-1">
        <TabsList className="px-4">
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="capacity">Capacity</TabsTrigger>
          <TabsTrigger value="skills">Skills Matrix</TabsTrigger>
          <TabsTrigger value="cost">Cost Tracking</TabsTrigger>
        </TabsList>
        
        <TabsContent value="allocation" className="flex-1 p-4">
          {renderAllocationHeatMap()}
        </TabsContent>
        
        <TabsContent value="capacity" className="flex-1 p-4">
          {renderCapacityPlanning()}
        </TabsContent>
        
        <TabsContent value="skills" className="flex-1 p-4">
          {renderSkillsMatrix()}
        </TabsContent>
        
        <TabsContent value="cost" className="flex-1 p-4">
          {renderCostTracking()}
        </TabsContent>
      </Tabs>
    </div>
  );
};