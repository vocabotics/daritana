import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User } from 'lucide-react';

interface TeamData {
  total: number;
  available: number;
  busy: number;
  onLeave: number;
  members: Array<{
    name: string;
    role: string;
    status: string;
    workload: number;
  }>;
}

export default function TeamOverviewWidget({ data }: { data: TeamData }) {
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <p className="text-lg font-bold">{data.total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div>
          <p className="text-lg font-bold text-green-600">{data.available}</p>
          <p className="text-xs text-gray-500">Available</p>
        </div>
        <div>
          <p className="text-lg font-bold text-yellow-600">{data.busy}</p>
          <p className="text-xs text-gray-500">Busy</p>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-400">{data.onLeave}</p>
          <p className="text-xs text-gray-500">Leave</p>
        </div>
      </div>
      
      <div className="space-y-2">
        {data.members.slice(0, 4).map((member, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{member.name}</p>
              <p className="text-xs text-gray-500">{member.role}</p>
            </div>
            <div className="text-right">
              <Badge variant={member.status === 'available' ? 'default' : 'secondary'}>
                {member.status}
              </Badge>
              <Progress value={member.workload} className="h-1 mt-1 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}