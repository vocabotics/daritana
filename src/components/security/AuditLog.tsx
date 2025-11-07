import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity,
  Search,
  Filter,
  Download,
  User,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  Lock,
  FileText
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  result: 'success' | 'failure' | 'warning';
  ip: string;
  location: string;
  details?: string;
}

export function AuditLog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');

  const auditLogs: AuditLogEntry[] = [
    {
      id: '1',
      timestamp: '2024-01-15 10:30:45',
      user: 'admin@company.com',
      action: 'User Login',
      resource: 'Authentication',
      result: 'success',
      ip: '192.168.1.100',
      location: 'Kuala Lumpur, MY',
      details: '2FA verification successful'
    },
    {
      id: '2',
      timestamp: '2024-01-15 10:28:12',
      user: 'john.doe@company.com',
      action: 'Project Created',
      resource: 'KLCC Tower Project',
      result: 'success',
      ip: '192.168.1.101',
      location: 'Penang, MY'
    },
    {
      id: '3',
      timestamp: '2024-01-15 10:15:30',
      user: 'jane.smith@company.com',
      action: 'Permission Changed',
      resource: 'User: contractor@external.com',
      result: 'warning',
      ip: '192.168.1.102',
      location: 'Singapore, SG',
      details: 'Elevated permissions granted'
    },
    {
      id: '4',
      timestamp: '2024-01-15 09:45:20',
      user: 'system',
      action: 'Failed Login Attempt',
      resource: 'Authentication',
      result: 'failure',
      ip: '203.145.67.89',
      location: 'Unknown',
      details: 'Invalid credentials - 3rd attempt'
    },
    {
      id: '5',
      timestamp: '2024-01-15 09:30:00',
      user: 'admin@company.com',
      action: 'Backup Initiated',
      resource: 'System',
      result: 'success',
      ip: '192.168.1.100',
      location: 'Kuala Lumpur, MY'
    },
    {
      id: '6',
      timestamp: '2024-01-15 09:15:45',
      user: 'sarah.chen@company.com',
      action: 'File Deleted',
      resource: 'old-proposal.pdf',
      result: 'warning',
      ip: '192.168.1.103',
      location: 'Johor, MY',
      details: 'Permanent deletion'
    },
    {
      id: '7',
      timestamp: '2024-01-15 08:45:30',
      user: 'mike.wong@company.com',
      action: 'API Key Generated',
      resource: 'Integration: Slack',
      result: 'success',
      ip: '192.168.1.104',
      location: 'Kuala Lumpur, MY'
    },
    {
      id: '8',
      timestamp: '2024-01-15 08:30:15',
      user: 'system',
      action: 'Security Scan',
      resource: 'System',
      result: 'success',
      ip: 'localhost',
      location: 'Server',
      details: 'No vulnerabilities detected'
    }
  ];

  const getActionIcon = (action: string) => {
    if (action.includes('Login')) return <User className="h-4 w-4" />;
    if (action.includes('Permission')) return <Shield className="h-4 w-4" />;
    if (action.includes('File')) return <FileText className="h-4 w-4" />;
    if (action.includes('Security')) return <Lock className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'success':
        return <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" />Success</Badge>;
      case 'failure':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Failed</Badge>;
      case 'warning':
        return <Badge variant="warning" className="gap-1"><AlertTriangle className="h-3 w-3" />Warning</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resource.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || log.result === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>Track all system activities and security events</CardDescription>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by user, action, or resource..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failed</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px]">
                <Clock className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium text-sm">Timestamp</th>
                  <th className="text-left p-4 font-medium text-sm">User</th>
                  <th className="text-left p-4 font-medium text-sm">Action</th>
                  <th className="text-left p-4 font-medium text-sm">Resource</th>
                  <th className="text-left p-4 font-medium text-sm">Result</th>
                  <th className="text-left p-4 font-medium text-sm">Location</th>
                  <th className="text-left p-4 font-medium text-sm">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-gray-400" />
                        {log.timestamp}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium">{log.user}</td>
                    <td className="p-4 text-sm">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        {log.action}
                      </div>
                    </td>
                    <td className="p-4 text-sm">{log.resource}</td>
                    <td className="p-4">{getResultBadge(log.result)}</td>
                    <td className="p-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3 text-gray-400" />
                        <span>{log.location}</span>
                      </div>
                      <span className="text-xs text-gray-500">{log.ip}</span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{auditLogs.length}</p>
            <p className="text-xs text-gray-500">In selected period</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Failed Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {auditLogs.filter(l => l.result === 'failure').length}
            </p>
            <p className="text-xs text-gray-500">Security events</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {auditLogs.filter(l => l.result === 'warning').length}
            </p>
            <p className="text-xs text-gray-500">Need attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Set(auditLogs.map(l => l.user)).size}
            </p>
            <p className="text-xs text-gray-500">Unique users</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}