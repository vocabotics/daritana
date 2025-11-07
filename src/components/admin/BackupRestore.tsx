import React, { useState, useEffect } from 'react';
import { Download, Upload, Database, Calendar, Clock, AlertTriangle, CheckCircle, Play, Pause, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface BackupRecord {
  id: string;
  timestamp: string;
  type: 'manual' | 'automatic';
  size: string;
  status: 'completed' | 'failed' | 'in_progress';
  duration: string;
  location: string;
}

// Backup data will be loaded from real APIs

export const BackupRestore: React.FC = () => {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);

  // Load backup history from API
  useEffect(() => {
    const loadBackups = async () => {
      setIsLoading(true);
      try {
        const response = await adminApi.getBackupHistory();
        if (response.data?.backups) {
          const formattedBackups = response.data.backups.map((backup: any) => ({
            id: backup.id,
            timestamp: new Date(backup.timestamp || backup.createdAt).toLocaleString(),
            type: backup.type || 'automatic',
            size: backup.size || 'Unknown',
            status: backup.status || 'completed',
            duration: backup.duration || 'Unknown',
            location: backup.location || backup.storage || 'Unknown'
          }));
          setBackups(formattedBackups);
        }
      } catch (error) {
        console.error('Failed to load backups:', error);
        toast.error('Failed to load backup history');
      } finally {
        setIsLoading(false);
      }
    };

    loadBackups();
  }, []);

  const handleCreateBackup = async () => {
    setIsBackupRunning(true);
    setBackupProgress(0);

    try {
      const response = await adminApi.createBackup();
      if (response.data?.backup) {
        toast.success('Backup created successfully');
        // Reload backup history
        const historyResponse = await adminApi.getBackupHistory();
        if (historyResponse.data?.backups) {
          const formattedBackups = historyResponse.data.backups.map((backup: any) => ({
            id: backup.id,
            timestamp: new Date(backup.timestamp || backup.createdAt).toLocaleString(),
            type: backup.type || 'manual',
            size: backup.size || 'Unknown',
            status: backup.status || 'completed',
            duration: backup.duration || 'Unknown',
            location: backup.location || backup.storage || 'Unknown'
          }));
          setBackups(formattedBackups);
        }
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
      toast.error('Failed to create backup');
    } finally {
      setIsBackupRunning(false);
      setBackupProgress(0);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'failed': return 'bg-red-50 text-red-700 border-red-200';
      case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'manual': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'automatic': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backup & Restore</h1>
          <p className="text-muted-foreground">
            Manage system backups and data restoration
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleCreateBackup} disabled={isBackupRunning}>
            <Download className="mr-2 h-4 w-4" />
            {isBackupRunning ? 'Creating Backup...' : 'Create Backup'}
          </Button>
          <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Restore System
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Restore System</DialogTitle>
                <DialogDescription>
                  Select a backup to restore the system from. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="backup-select">Select Backup</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a backup to restore" />
                    </SelectTrigger>
                    <SelectContent>
                      {backups
                        .filter(backup => backup.status === 'completed')
                        .map(backup => (
                          <SelectItem key={backup.id} value={backup.id}>
                            {backup.timestamp} - {backup.size} ({backup.type})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    Restoring from a backup will replace all current data with the backup data. 
                    Make sure to create a current backup before proceeding.
                  </AlertDescription>
                </Alert>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={() => setIsRestoreDialogOpen(false)}>
                  Restore System
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Backup Status */}
      {isBackupRunning && (
        <Card>
          <CardHeader>
            <CardTitle>Backup in Progress</CardTitle>
            <CardDescription>Creating system backup...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{backupProgress}%</span>
              </div>
              <Progress value={backupProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Backing up database, files, and configurations...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backup Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2h ago</div>
            <p className="text-xs text-muted-foreground">
              Automatic backup
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.7 GB</div>
            <p className="text-xs text-muted-foreground">
              All backups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.7%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Backup Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Schedule</CardTitle>
          <CardDescription>Automatic backup configuration and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Daily Database Backup</h4>
                  <p className="text-sm text-muted-foreground">Every day at 2:00 AM</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Active
                </Badge>
                <Button variant="outline" size="sm">
                  <Pause className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Database className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Weekly Full System Backup</h4>
                  <p className="text-sm text-muted-foreground">Every Sunday at 1:00 AM</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Active
                </Badge>
                <Button variant="outline" size="sm">
                  <Pause className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Upload className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium">Monthly Archive Backup</h4>
                  <p className="text-sm text-muted-foreground">First day of each month at 12:00 AM</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                  <Pause className="mr-1 h-3 w-3" />
                  Paused
                </Badge>
                <Button variant="outline" size="sm">
                  <Play className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>Recent backup records and status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading backup history...
                    </div>
                  </TableCell>
                </TableRow>
              ) : backups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No backup history found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                backups.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell className="font-mono text-sm">{backup.timestamp}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getTypeColor(backup.type)}>
                      {backup.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{backup.size}</TableCell>
                  <TableCell>{backup.duration}</TableCell>
                  <TableCell>{backup.location}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(backup.status)}>
                      {backup.status === 'completed' && <CheckCircle className="mr-1 h-3 w-3" />}
                      {backup.status === 'failed' && <AlertTriangle className="mr-1 h-3 w-3" />}
                      {backup.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {backup.status === 'completed' && (
                        <>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Upload className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Storage Information */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Information</CardTitle>
          <CardDescription>Backup storage usage and configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Local Storage</span>
              <span className="text-sm text-muted-foreground">12.4 GB / 100 GB</span>
            </div>
            <Progress value={12.4} className="w-full" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">AWS S3</span>
              <span className="text-sm text-muted-foreground">86.3 GB / 500 GB</span>
            </div>
            <Progress value={17.3} className="w-full" />
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Retention Policy</p>
                  <p className="text-xs text-blue-600">
                    Daily backups: 30 days • Weekly backups: 12 weeks • Monthly backups: 12 months
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};