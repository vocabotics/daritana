import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, AlertTriangle, Shield, User, Database, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'data' | 'system' | 'security';
}

interface AuditStats {
  totalEvents: number;
  securityEvents: number;
  highPriorityEvents: number;
  failedLogins: number;
  failedLoginsChange: number;
  dataChanges: number;
  dataChangesChange: number;
}

export const AuditLogs: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditStats, setAuditStats] = useState<AuditStats>({
    totalEvents: 0,
    securityEvents: 0,
    highPriorityEvents: 0,
    failedLogins: 0,
    failedLoginsChange: 0,
    dataChanges: 0,
    dataChangesChange: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Load audit logs and stats from API
  useEffect(() => {
    const loadAuditData = async () => {
      setIsLoading(true);
      setIsLoadingStats(true);
      
      try {
        // Load data in parallel
        const [logsResponse, statsResponse] = await Promise.all([
          adminApi.getAuditLogs({
            type: selectedCategory !== 'all' ? selectedCategory : undefined
          }),
          adminApi.getAuditStats()
        ]);
        
        // Process audit logs
        if (logsResponse.data?.logs) {
          const formattedLogs = logsResponse.data.logs.map((log: any) => ({
            id: log.id,
            timestamp: new Date(log.timestamp || log.createdAt).toLocaleString(),
            userId: log.userId || log.user?.id || 'unknown',
            userName: log.userName || log.user?.name || 'Unknown User',
            action: log.action || log.event || 'Unknown Action',
            resource: log.resource || log.target || 'System',
            details: log.details || log.description || log.message || '',
            ipAddress: log.ipAddress || log.ip || 'Unknown',
            userAgent: log.userAgent || log.agent || 'Unknown',
            severity: log.severity || 'low',
            category: log.category || log.type || 'system'
          }));
          setAuditLogs(formattedLogs);
        }

        // Process audit stats
        if (statsResponse.data) {
          setAuditStats({
            totalEvents: statsResponse.data.totalEvents || 0,
            securityEvents: statsResponse.data.securityEvents || 0,
            highPriorityEvents: statsResponse.data.highPriorityEvents || 0,
            failedLogins: statsResponse.data.failedLogins || 0,
            failedLoginsChange: statsResponse.data.failedLoginsChange || 0,
            dataChanges: statsResponse.data.dataChanges || 0,
            dataChangesChange: statsResponse.data.dataChangesChange || 0
          });
        }
      } catch (error) {
        console.error('Failed to load audit data:', error);
        toast.error('Failed to load audit data');
      } finally {
        setIsLoading(false);
        setIsLoadingStats(false);
      }
    };

    loadAuditData();
  }, [selectedCategory]);

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resource.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
    const matchesSeverity = selectedSeverity === 'all' || log.severity === selectedSeverity;
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication': return <User className="h-4 w-4" />;
      case 'authorization': return <Shield className="h-4 w-4" />;
      case 'data': return <Database className="h-4 w-4" />;
      case 'system': return <Database className="h-4 w-4" />;
      case 'security': return <AlertTriangle className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'authentication': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'authorization': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'data': return 'bg-green-50 text-green-700 border-green-200';
      case 'system': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'security': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatChangePercentage = (change: number) => {
    if (change === 0) return '0%';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change}%`;
  };

  const getChangeColor = (change: number) => {
    if (change === 0) return 'text-gray-500';
    return change > 0 ? 'text-red-500' : 'text-green-500';
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            System activity logs and security audit trail
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="flex items-center">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{auditStats.totalEvents.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="flex items-center">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{auditStats.securityEvents}</div>
                <p className="text-xs text-muted-foreground">
                  {auditStats.highPriorityEvents} high priority
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="flex items-center">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{auditStats.failedLogins}</div>
                <p className={`text-xs ${getChangeColor(auditStats.failedLoginsChange)}`}>
                  {formatChangePercentage(auditStats.failedLoginsChange)} from last week
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Changes</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="flex items-center">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{auditStats.dataChanges.toLocaleString()}</div>
                <p className={`text-xs ${getChangeColor(auditStats.dataChangesChange)}`}>
                  {formatChangePercentage(auditStats.dataChangesChange)} from last week
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>
            Chronological record of system activities and user actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search audit logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="authentication">Authentication</SelectItem>
                <SelectItem value="authorization">Authorization</SelectItem>
                <SelectItem value="data">Data</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading audit logs...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No audit logs found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                  <TableCell>{log.userName}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{log.resource}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getCategoryColor(log.category)}>
                      <div className="flex items-center space-x-1">
                        {getCategoryIcon(log.category)}
                        <span className="capitalize">{log.category}</span>
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getSeverityColor(log.severity)}>
                      {log.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Audit Log Details</DialogTitle>
                          <DialogDescription>
                            Detailed information about this audit event
                          </DialogDescription>
                        </DialogHeader>
                        {selectedLog && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-500">Timestamp</label>
                                <p className="font-mono text-sm">{selectedLog.timestamp}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">User</label>
                                <p>{selectedLog.userName} ({selectedLog.userId})</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-500">Action</label>
                                <p>{selectedLog.action}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">Resource</label>
                                <p>{selectedLog.resource}</p>
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium text-gray-500">Details</label>
                              <p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">{selectedLog.details}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-500">IP Address</label>
                                <p className="font-mono text-sm">{selectedLog.ipAddress}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500">Severity</label>
                                <Badge className={getSeverityColor(selectedLog.severity)}>
                                  {selectedLog.severity}
                                </Badge>
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium text-gray-500">User Agent</label>
                              <p className="font-mono text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                {selectedLog.userAgent}
                              </p>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};