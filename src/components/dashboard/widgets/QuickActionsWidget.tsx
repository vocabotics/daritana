import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Calendar, Users, FileText, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function QuickActionsWidget({ data }: { data: any }) {
  const navigate = useNavigate();
  
  const actions = [
    { 
      icon: <Plus className="h-4 w-4" />, 
      label: 'New Project',
      onClick: () => {
        navigate('/projects?action=new');
        toast.info('Opening new project form...');
      }
    },
    { 
      icon: <Upload className="h-4 w-4" />, 
      label: 'Upload File',
      onClick: () => {
        navigate('/files?action=upload');
        toast.info('Opening file upload...');
      }
    },
    { 
      icon: <Calendar className="h-4 w-4" />, 
      label: 'Schedule Meeting',
      onClick: () => {
        navigate('/calendar?action=new-meeting');
        toast.info('Opening meeting scheduler...');
      }
    },
    { 
      icon: <Users className="h-4 w-4" />, 
      label: 'Invite Team',
      onClick: () => {
        navigate('/team?action=invite');
        toast.info('Opening team invitation...');
      }
    },
    { 
      icon: <FileText className="h-4 w-4" />, 
      label: 'Create Report',
      onClick: () => {
        navigate('/reports?action=new');
        toast.info('Opening report builder...');
      }
    },
    { 
      icon: <DollarSign className="h-4 w-4" />, 
      label: 'New Invoice',
      onClick: () => {
        navigate('/financial?tab=invoices&action=new');
        toast.info('Opening invoice creator...');
      }
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className="flex flex-col items-center justify-center h-16 text-xs"
          onClick={action.onClick}
        >
          {action.icon}
          <span className="mt-1">{action.label}</span>
        </Button>
      ))}
    </div>
  );
}