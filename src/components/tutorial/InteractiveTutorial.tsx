import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle, Circle, ChevronRight, ChevronLeft, X, Lightbulb, Target, Sparkles, Play, Award
} from 'lucide-react';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  content: string;
  targetElement?: string; // CSS selector for highlighting
  action?: string; // Action user should take
  tips?: string[];
  completed?: boolean;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  steps: TutorialStep[];
  category: string;
  icon?: any;
}

interface InteractiveTutorialProps {
  tutorial: Tutorial;
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function InteractiveTutorial({ tutorial, open, onClose, onComplete }: InteractiveTutorialProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [showCongrats, setShowCongrats] = useState(false);

  const currentStep = tutorial.steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / tutorial.steps.length) * 100;
  const isLastStep = currentStepIndex === tutorial.steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  useEffect(() => {
    if (currentStep?.targetElement) {
      const element = document.querySelector(currentStep.targetElement);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add highlight class
        element.classList.add('tutorial-highlight');
        return () => {
          element.classList.remove('tutorial-highlight');
        };
      }
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep) {
      setCompletedSteps(prev => new Set([...prev, currentStep.id]));
    }

    if (isLastStep) {
      setShowCongrats(true);
      if (onComplete) {
        onComplete();
      }
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    setCurrentStepIndex(tutorial.steps.length - 1);
  };

  const handleStepClick = (index: number) => {
    if (index <= currentStepIndex) {
      setCurrentStepIndex(index);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-blue-100 text-blue-700';
      case 'advanced': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (showCongrats) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-bounce">
                <Award className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4">🎉 Tutorial Complete!</h2>
            <p className="text-gray-600 mb-6">
              Congratulations! You've completed the "{tutorial.title}" tutorial.
            </p>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium mb-2">What you learned:</p>
              <ul className="text-sm text-left space-y-1">
                {tutorial.steps.slice(0, 3).map(step => (
                  <li key={step.id} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>{step.title}</span>
                  </li>
                ))}
                {tutorial.steps.length > 3 && (
                  <li className="text-gray-500 ml-6">
                    ...and {tutorial.steps.length - 3} more skills
                  </li>
                )}
              </ul>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Close
              </Button>
              <Button className="flex-1" onClick={() => {
                setShowCongrats(false);
                setCurrentStepIndex(0);
                setCompletedSteps(new Set());
              }}>
                <Play className="h-4 w-4 mr-2" />
                Restart Tutorial
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getDifficultyColor(tutorial.difficulty)}>
                  {tutorial.difficulty}
                </Badge>
                <Badge variant="outline">{tutorial.category}</Badge>
                <span className="text-sm text-gray-600">{tutorial.estimatedTime}</span>
              </div>
              <DialogTitle className="text-2xl">{tutorial.title}</DialogTitle>
              <DialogDescription className="mt-1">{tutorial.description}</DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Step {currentStepIndex + 1} of {tutorial.steps.length}</span>
              <span className="text-gray-600">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Steps Sidebar */}
          <div className="w-64 border-r bg-gray-50 overflow-y-auto p-4">
            <div className="space-y-2">
              {tutorial.steps.map((step, index) => {
                const isCompleted = completedSteps.has(step.id);
                const isCurrent = index === currentStepIndex;
                const isAccessible = index <= currentStepIndex;

                return (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(index)}
                    disabled={!isAccessible}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      isCurrent
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : isCompleted
                        ? 'bg-green-50 border border-green-200'
                        : isAccessible
                        ? 'bg-white border border-gray-200 hover:bg-gray-50'
                        : 'bg-gray-100 border border-gray-200 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : isCurrent ? (
                          <div className="h-5 w-5 rounded-full border-2 border-blue-600 flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-blue-600" />
                          </div>
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          isCurrent ? 'text-blue-900' : isCompleted ? 'text-green-900' : 'text-gray-900'
                        }`}>
                          Step {index + 1}
                        </p>
                        <p className={`text-xs mt-1 ${
                          isCurrent ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-600'
                        }`}>
                          {step.title}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-8">
              <div className="max-w-2xl">
                {/* Step Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{currentStep.title}</h3>
                  <p className="text-gray-600">{currentStep.description}</p>
                </div>

                {/* Step Content */}
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <div className="prose prose-slate max-w-none">
                      {currentStep.content.split('\n\n').map((paragraph, i) => (
                        <p key={i} className="mb-4 last:mb-0">{paragraph}</p>
                      ))}
                    </div>

                    {currentStep.action && (
                      <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                        <div className="flex items-start gap-3">
                          <Target className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-blue-900">Action Required</p>
                            <p className="text-sm text-blue-700 mt-1">{currentStep.action}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tips */}
                {currentStep.tips && currentStep.tips.length > 0 && (
                  <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 mb-6">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-orange-900 mb-2">Pro Tips</p>
                          <ul className="space-y-2">
                            {currentStep.tips.map((tip, i) => (
                              <li key={i} className="text-sm text-orange-800 flex items-start gap-2">
                                <Sparkles className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between gap-4 pt-6 border-t">
                  <div className="flex gap-2">
                    {!isFirstStep && (
                      <Button variant="outline" onClick={handlePrevious}>
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                    )}
                    {!isLastStep && (
                      <Button variant="ghost" onClick={handleSkip}>
                        Skip to End
                      </Button>
                    )}
                  </div>
                  <Button onClick={handleNext} size="lg">
                    {isLastStep ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete Tutorial
                      </>
                    ) : (
                      <>
                        Next Step
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Tutorial data
export const availableTutorials: Tutorial[] = [
  {
    id: 'first-project',
    title: 'Create Your First Project',
    description: 'Learn how to set up and manage your first architecture project in Daritana',
    difficulty: 'beginner',
    estimatedTime: '5 minutes',
    category: 'Getting Started',
    steps: [
      {
        id: 'step1',
        title: 'Navigate to Projects',
        description: 'Let\'s start by opening the Projects page',
        content: 'Click on the "Projects" link in the sidebar or press Ctrl+P to quickly navigate to the Projects page.\n\nThe Projects page is your central hub for managing all your architecture projects. Here you can view, create, and organize projects efficiently.',
        targetElement: '[href="/projects"]',
        action: 'Click on "Projects" in the sidebar',
        tips: [
          'Use Ctrl+P keyboard shortcut for quick navigation',
          'Bookmark frequently used pages for easy access'
        ]
      },
      {
        id: 'step2',
        title: 'Create New Project',
        description: 'Click the "New Project" button to start',
        content: 'Look for the "New Project" button in the top-right corner of the Projects page.\n\nClicking this button will open a project creation modal where you can enter all the necessary details for your new project.',
        action: 'Click the "New Project" button',
        tips: [
          'You can also use Ctrl+N keyboard shortcut to create a new project',
          'Have your project details ready before starting'
        ]
      },
      {
        id: 'step3',
        title: 'Fill Project Details',
        description: 'Enter your project information',
        content: 'Fill in the project form with the following information:\n\n• Project Name: Give your project a descriptive name\n• Project Type: Select from Residential, Commercial, Industrial, etc.\n• Client: Add client name and contact details\n• Location: Specify the project site location\n• Budget: Enter estimated or confirmed budget\n• Timeline: Set start and expected completion dates',
        action: 'Complete all required fields in the form',
        tips: [
          'All fields marked with * are required',
          'You can edit these details later if needed',
          'Add as much detail as possible for better project tracking'
        ]
      },
      {
        id: 'step4',
        title: 'Assign Team Members',
        description: 'Add your project team',
        content: 'Select team members who will work on this project.\n\nYou can assign different roles:\n• Project Lead: Overall project manager\n• Architects: Design team members\n• Engineers: Structural, MEP engineers\n• Contractors: Construction partners\n• Clients: Project stakeholders',
        action: 'Select team members from the dropdown',
        tips: [
          'You can add more team members later',
          'Team members will receive notifications about project updates',
          'Set proper permissions for each role'
        ]
      },
      {
        id: 'step5',
        title: 'Review and Create',
        description: 'Finalize your project creation',
        content: 'Review all the information you\'ve entered to ensure accuracy.\n\nOnce you click "Create Project", the project will be created and you\'ll be able to:\n• Add tasks and milestones\n• Upload drawings and documents\n• Track progress and budget\n• Collaborate with your team',
        action: 'Click "Create Project" to finish',
        tips: [
          'Your project will appear in the Projects list immediately',
          'You can access it anytime from the Projects page',
          'Start by creating your first task or uploading documents'
        ]
      }
    ]
  },
  {
    id: 'kanban-master',
    title: 'Master the Kanban Board',
    description: 'Learn advanced task management with the Kanban board',
    difficulty: 'intermediate',
    estimatedTime: '8 minutes',
    category: 'Task Management',
    steps: [
      {
        id: 'k1',
        title: 'Understanding Kanban Columns',
        description: 'Learn about the different task stages',
        content: 'The Kanban board has four main columns:\n\n• To Do: New tasks and backlog items\n• In Progress: Tasks currently being worked on\n• Review: Tasks awaiting approval or review\n• Done: Completed tasks\n\nTasks move from left to right as they progress through your workflow.',
        tips: [
          'Limit work-in-progress for better focus',
          'Review "Done" column regularly to track accomplishments'
        ]
      },
      {
        id: 'k2',
        title: 'Creating Tasks',
        description: 'Add new tasks to your board',
        content: 'Click the "New Task" button to create a task.\n\nFill in:\n• Task title and description\n• Assigned team member\n• Priority level (Low, Medium, High, Urgent)\n• Due date\n• Task category\n• Estimated time\n\nTasks will appear in the "To Do" column automatically.',
        action: 'Create your first task',
        tips: [
          'Use Ctrl+N to quickly create tasks',
          'Break large tasks into smaller subtasks',
          'Set realistic deadlines'
        ]
      },
      {
        id: 'k3',
        title: 'Moving Tasks',
        description: 'Drag and drop to update status',
        content: 'Simply drag a task card and drop it in a different column to update its status.\n\nThe task status updates automatically and team members receive notifications.\n\nYou can also use keyboard shortcuts to move tasks quickly.',
        action: 'Try moving a task between columns',
        tips: [
          'Optimistic updates mean changes appear instantly',
          'If there\'s an error, the task automatically reverts',
          'Team members see updates in real-time'
        ]
      }
    ]
  }
];
