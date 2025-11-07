import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ApprovalRequest {
  id: string;
  title: string;
  project: string;
  submitted: string;
  urgent: boolean;
}

export default function ApprovalRequestsWidget({ data }: { data: ApprovalRequest[] }) {
  const [requests, setRequests] = useState<ApprovalRequest[]>(data || []);
  const [processing, setProcessing] = useState<string | null>(null);
  
  if (!requests || !Array.isArray(requests)) return null;
  
  const handleApprove = async (requestId: string, title: string) => {
    setProcessing(requestId);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setRequests(prev => prev.filter(r => r.id !== requestId));
    toast.success(`Approved: ${title}`);
    setProcessing(null);
  };
  
  const handleReject = async (requestId: string, title: string) => {
    setProcessing(requestId);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setRequests(prev => prev.filter(r => r.id !== requestId));
    toast.error(`Rejected: ${title}`);
    setProcessing(null);
  };

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div key={request.id} className="border rounded-lg p-3">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                {request.urgent && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                <h4 className="font-medium text-sm">{request.title}</h4>
              </div>
              <p className="text-xs text-gray-500 mt-1">{request.project}</p>
              <p className="text-xs text-gray-400">
                Submitted: {new Date(request.submitted).toLocaleDateString()}
              </p>
            </div>
            {request.urgent && (
              <Badge variant="destructive" className="text-xs">Urgent</Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => handleApprove(request.id, request.title)}
              disabled={processing === request.id}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              {processing === request.id ? 'Processing...' : 'Approve'}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => handleReject(request.id, request.title)}
              disabled={processing === request.id}
            >
              <XCircle className="h-3 w-3 mr-1" />
              {processing === request.id ? 'Processing...' : 'Reject'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}