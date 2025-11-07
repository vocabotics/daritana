import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  ChevronRight,
  Building,
  HardHat,
  Hammer,
  Paintbrush,
  TreePine,
  Zap,
  Home,
  Flag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ConstructionPhase } from '@/types/construction';

interface SiteProgressTimelineProps {
  siteId: string;
  phases: ConstructionPhase[];
  onPhaseSelect?: (phaseId: string) => void;
}

const SiteProgressTimeline: React.FC<SiteProgressTimelineProps> = ({ 
  siteId, 
  phases, 
  onPhaseSelect 
}) => {
  const [selectedPhase, setSelectedPhase] = useState<ConstructionPhase | null>(null);
  const [timelineView, setTimelineView] = useState<'vertical' | 'horizontal'>('vertical');

  const getPhaseIcon = (phaseType: string) => {
    switch (phaseType) {
      case 'preparation': return <Building className="h-5 w-5" />;
      case 'foundation': return <HardHat className="h-5 w-5" />;
      case 'structure': return <Hammer className="h-5 w-5" />;
      case 'roofing': return <Home className="h-5 w-5" />;
      case 'mep': return <Zap className="h-5 w-5" />;
      case 'finishing': return <Paintbrush className="h-5 w-5" />;
      case 'landscaping': return <TreePine className="h-5 w-5" />;
      default: return <Circle className="h-5 w-5" />;
    }
  };

  const getPhaseStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'in_progress': return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />;
      case 'delayed': return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'on_hold': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default: return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPhaseColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 border-green-500';
      case 'in_progress': return 'bg-blue-100 border-blue-500';
      case 'delayed': return 'bg-red-100 border-red-500';
      case 'on_hold': return 'bg-yellow-100 border-yellow-500';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const calculateDaysRemaining = (endDate: string | undefined) => {
    if (!endDate) return null;
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const calculateDuration = (startDate: string | undefined, endDate: string | undefined) => {
    if (!startDate || !endDate) return null;
    const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const handlePhaseClick = (phase: ConstructionPhase) => {
    setSelectedPhase(phase);
    if (onPhaseSelect) {
      onPhaseSelect(phase.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Construction Timeline
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={timelineView === 'vertical' ? 'default' : 'outline'}
                onClick={() => setTimelineView('vertical')}
              >
                Vertical
              </Button>
              <Button
                size="sm"
                variant={timelineView === 'horizontal' ? 'default' : 'outline'}
                onClick={() => setTimelineView('horizontal')}
              >
                Horizontal
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Phase Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Phases</p>
              <p className="text-2xl font-bold">{phases.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {phases.filter(p => p.status === 'completed').length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {phases.filter(p => p.status === 'in_progress').length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Delayed</p>
              <p className="text-2xl font-bold text-red-600">
                {phases.filter(p => p.status === 'delayed').length}
              </p>
            </div>
          </div>

          {/* Timeline View */}
          {timelineView === 'vertical' ? (
            <ScrollArea className="h-[600px] pr-4">
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                
                {/* Phase Items */}
                <div className="space-y-6">
                  {phases.map((phase, index) => (
                    <div key={phase.id} className="relative flex items-start">
                      {/* Timeline Node */}
                      <div className={`absolute left-6 w-5 h-5 rounded-full border-2 ${getPhaseColor(phase.status)} z-10`}>
                        {phase.status === 'in_progress' && (
                          <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-25"></div>
                        )}
                      </div>
                      
                      {/* Phase Card */}
                      <div 
                        className={`ml-16 flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${getPhaseColor(phase.status)}`}
                        onClick={() => handlePhaseClick(phase)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getPhaseIcon(phase.phase_type)}
                              <h3 className="font-semibold text-lg">{phase.phase_name}</h3>
                              {getPhaseStatusIcon(phase.status)}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-xs text-gray-600">Planned Duration</p>
                                <p className="text-sm font-medium">
                                  {phase.planned_start && phase.planned_end ? (
                                    <>
                                      {new Date(phase.planned_start).toLocaleDateString()} - {new Date(phase.planned_end).toLocaleDateString()}
                                      <span className="text-gray-500 ml-1">
                                        ({calculateDuration(phase.planned_start, phase.planned_end)} days)
                                      </span>
                                    </>
                                  ) : 'Not scheduled'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Actual Duration</p>
                                <p className="text-sm font-medium">
                                  {phase.actual_start ? (
                                    <>
                                      {new Date(phase.actual_start).toLocaleDateString()} - 
                                      {phase.actual_end ? new Date(phase.actual_end).toLocaleDateString() : 'Ongoing'}
                                    </>
                                  ) : 'Not started'}
                                </p>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span className="font-semibold">{phase.progress_percentage.toFixed(1)}%</span>
                              </div>
                              <Progress value={phase.progress_percentage} className="h-2" />
                            </div>

                            {/* Delay Reasons */}
                            {phase.status === 'delayed' && phase.delay_reasons && phase.delay_reasons.length > 0 && (
                              <div className="mt-3 p-2 bg-red-50 rounded">
                                <p className="text-xs font-semibold text-red-800 mb-1">Delay Reasons:</p>
                                <ul className="text-xs text-red-700">
                                  {phase.delay_reasons.map((reason, idx) => (
                                    <li key={idx}>• {reason}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Key Milestones */}
                            {phase.key_milestones && phase.key_milestones.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-semibold text-gray-700 mb-1">Key Milestones:</p>
                                <div className="flex flex-wrap gap-2">
                                  {phase.key_milestones.map((milestone, idx) => (
                                    <TooltipProvider key={idx}>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <Badge 
                                            variant={milestone.completed ? 'default' : 'outline'}
                                            className="text-xs"
                                          >
                                            {milestone.completed ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Circle className="h-3 w-3 mr-1" />}
                                            {milestone.name}
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Target: {new Date(milestone.target_date).toLocaleDateString()}</p>
                                          {milestone.completed_date && (
                                            <p>Completed: {new Date(milestone.completed_date).toLocaleDateString()}</p>
                                          )}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Phase Metrics */}
                          <div className="ml-4 text-right">
                            <div className="mb-2">
                              <Badge variant={phase.status === 'delayed' ? 'destructive' : 'default'}>
                                {phase.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            {phase.planned_end && phase.status === 'in_progress' && (
                              <div className="text-sm">
                                <p className="text-gray-600">Days Remaining</p>
                                <p className="font-bold text-lg">
                                  {calculateDaysRemaining(phase.planned_end) || 'Overdue'}
                                </p>
                              </div>
                            )}
                            <div className="mt-2 text-sm">
                              <p className="text-gray-600">Weight</p>
                              <p className="font-semibold">{phase.weight_factor}%</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Connection to next phase */}
                      {index < phases.length - 1 && (
                        <div className="absolute left-8 top-full h-6 w-0.5 bg-gray-300"></div>
                      )}
                    </div>
                  ))}
                  
                  {/* Completion Node */}
                  <div className="relative flex items-center">
                    <div className="absolute left-6 w-5 h-5 rounded-full border-2 bg-gold-100 border-gold-500 z-10">
                      <Flag className="h-3 w-3 text-gold-600" />
                    </div>
                    <div className="ml-16 p-4">
                      <h3 className="font-semibold text-lg">Project Handover</h3>
                      <p className="text-sm text-gray-600">Ready for final inspection and client handover</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          ) : (
            /* Horizontal Timeline View */
            <ScrollArea className="w-full whitespace-nowrap pb-4">
              <div className="inline-flex gap-4 p-4">
                {phases.map((phase, index) => (
                  <React.Fragment key={phase.id}>
                    <div 
                      className={`w-64 p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${getPhaseColor(phase.status)}`}
                      onClick={() => handlePhaseClick(phase)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        {getPhaseIcon(phase.phase_type)}
                        {getPhaseStatusIcon(phase.status)}
                      </div>
                      <h3 className="font-semibold mb-2">{phase.phase_name}</h3>
                      <Progress value={phase.progress_percentage} className="h-2 mb-2" />
                      <p className="text-sm font-semibold">{phase.progress_percentage.toFixed(1)}%</p>
                    </div>
                    {index < phases.length - 1 && (
                      <ChevronRight className="h-6 w-6 text-gray-400 self-center" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Selected Phase Details */}
      {selectedPhase && (
        <Card>
          <CardHeader>
            <CardTitle>Phase Details: {selectedPhase.phase_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Timeline Information</h4>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-gray-600">Planned Start:</dt>
                    <dd className="font-medium">
                      {selectedPhase.planned_start ? new Date(selectedPhase.planned_start).toLocaleDateString() : 'Not set'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Planned End:</dt>
                    <dd className="font-medium">
                      {selectedPhase.planned_end ? new Date(selectedPhase.planned_end).toLocaleDateString() : 'Not set'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Actual Start:</dt>
                    <dd className="font-medium">
                      {selectedPhase.actual_start ? new Date(selectedPhase.actual_start).toLocaleDateString() : 'Not started'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Actual End:</dt>
                    <dd className="font-medium">
                      {selectedPhase.actual_end ? new Date(selectedPhase.actual_end).toLocaleDateString() : 'In progress'}
                    </dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Quality Checkpoints</h4>
                {selectedPhase.quality_checkpoints && selectedPhase.quality_checkpoints.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedPhase.quality_checkpoints.map((checkpoint, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        {checkpoint.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={checkpoint.passed ? 'line-through text-gray-500' : ''}>
                          {checkpoint.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No checkpoints defined</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SiteProgressTimeline;