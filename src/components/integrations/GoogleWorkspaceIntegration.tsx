import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  FileText,
  FolderOpen,
  Calendar,
  Mail,
  Table,
  Image,
  CheckCircle,
  Link,
  Cloud,
  HardDrive
} from 'lucide-react';
import { toast } from 'sonner';

export function GoogleWorkspaceIntegration() {
  const [isConnected, setIsConnected] = useState(true);
  const [syncStatus, setSyncStatus] = useState({
    drive: { enabled: true, lastSync: '2 minutes ago', items: 1847 },
    calendar: { enabled: true, lastSync: '5 minutes ago', items: 23 },
    gmail: { enabled: false, lastSync: 'Never', items: 0 },
    docs: { enabled: true, lastSync: '1 hour ago', items: 156 },
    sheets: { enabled: true, lastSync: '30 minutes ago', items: 42 }
  });

  const storageUsed = 45.2; // GB
  const storageTotal = 100; // GB

  const connectGoogle = () => {
    // Simulate Google OAuth
    window.open('https://accounts.google.com/oauth2/v2/auth', '_blank');
    setTimeout(() => {
      setIsConnected(true);
      toast.success('Successfully connected to Google Workspace');
    }, 2000);
  };

  const syncNow = (service: string) => {
    toast.info(`Syncing ${service}...`);
    setTimeout(() => {
      setSyncStatus(prev => ({
        ...prev,
        [service]: { ...prev[service as keyof typeof prev], lastSync: 'Just now' }
      }));
      toast.success(`${service} synced successfully`);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Cloud className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Google Workspace Integration</CardTitle>
                <CardDescription>Access Google Drive, Docs, Sheets, and more</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isConnected ? (
                <>
                  <Badge variant="success" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Connected
                  </Badge>
                  <Button variant="outline" size="sm">
                    Manage Access
                  </Button>
                </>
              ) : (
                <Button onClick={connectGoogle}>
                  <Link className="h-4 w-4 mr-2" />
                  Connect Google
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Storage Overview */}
      {isConnected && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Storage Overview</CardTitle>
              <Badge variant="outline">
                <HardDrive className="h-3 w-3 mr-1" />
                Google Drive
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Storage Used</span>
                  <span className="font-medium">{storageUsed} GB / {storageTotal} GB</span>
                </div>
                <Progress value={(storageUsed / storageTotal) * 100} />
              </div>
              
              <div className="grid grid-cols-4 gap-4 pt-2">
                <div className="text-center">
                  <p className="text-2xl font-bold">1,847</p>
                  <p className="text-xs text-gray-500">Files</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">234</p>
                  <p className="text-xs text-gray-500">Folders</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">56</p>
                  <p className="text-xs text-gray-500">Shared</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-xs text-gray-500">Team Drives</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Configuration */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Service Configuration</CardTitle>
            <CardDescription>Enable and configure Google Workspace services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Google Drive */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="font-medium">Google Drive</p>
                      <p className="text-sm text-gray-500">
                        {syncStatus.drive.items} files • Last sync: {syncStatus.drive.lastSync}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => syncNow('drive')}
                    >
                      Sync Now
                    </Button>
                    <Switch checked={syncStatus.drive.enabled} />
                  </div>
                </div>
              </div>

              {/* Google Calendar */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Google Calendar</p>
                      <p className="text-sm text-gray-500">
                        {syncStatus.calendar.items} events • Last sync: {syncStatus.calendar.lastSync}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => syncNow('calendar')}
                    >
                      Sync Now
                    </Button>
                    <Switch checked={syncStatus.calendar.enabled} />
                  </div>
                </div>
              </div>

              {/* Gmail */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium">Gmail</p>
                      <p className="text-sm text-gray-500">
                        {syncStatus.gmail.items} threads • Last sync: {syncStatus.gmail.lastSync}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => syncNow('gmail')}
                      disabled={!syncStatus.gmail.enabled}
                    >
                      Sync Now
                    </Button>
                    <Switch checked={syncStatus.gmail.enabled} />
                  </div>
                </div>
              </div>

              {/* Google Docs */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Google Docs</p>
                      <p className="text-sm text-gray-500">
                        {syncStatus.docs.items} documents • Last sync: {syncStatus.docs.lastSync}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => syncNow('docs')}
                    >
                      Sync Now
                    </Button>
                    <Switch checked={syncStatus.docs.enabled} />
                  </div>
                </div>
              </div>

              {/* Google Sheets */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Table className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Google Sheets</p>
                      <p className="text-sm text-gray-500">
                        {syncStatus.sheets.items} spreadsheets • Last sync: {syncStatus.sheets.lastSync}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => syncNow('sheets')}
                    >
                      Sync Now
                    </Button>
                    <Switch checked={syncStatus.sheets.enabled} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}