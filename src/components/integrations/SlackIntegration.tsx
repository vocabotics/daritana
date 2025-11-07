import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare,
  Hash,
  Bell,
  Settings,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Link
} from 'lucide-react';
import { toast } from 'sonner';

export function SlackIntegration() {
  const [isConnected, setIsConnected] = useState(false);
  const [workspaceUrl, setWorkspaceUrl] = useState('');
  const [channels, setChannels] = useState([
    { id: 1, name: 'general', connected: true, notifications: ['project_created', 'task_completed'] },
    { id: 2, name: 'dev-team', connected: true, notifications: ['deployment', 'errors'] },
    { id: 3, name: 'design', connected: false, notifications: [] }
  ]);

  const notificationTypes = [
    { value: 'project_created', label: 'Project Created' },
    { value: 'project_completed', label: 'Project Completed' },
    { value: 'task_assigned', label: 'Task Assigned' },
    { value: 'task_completed', label: 'Task Completed' },
    { value: 'deadline_approaching', label: 'Deadline Approaching' },
    { value: 'budget_alert', label: 'Budget Alert' },
    { value: 'team_mention', label: 'Team Mention' },
    { value: 'deployment', label: 'Deployment' },
    { value: 'errors', label: 'Error Alerts' }
  ];

  const connectSlack = () => {
    // Simulate OAuth flow
    window.open('https://slack.com/oauth/v2/authorize', '_blank');
    setTimeout(() => {
      setIsConnected(true);
      toast.success('Successfully connected to Slack workspace');
    }, 2000);
  };

  const disconnectSlack = () => {
    setIsConnected(false);
    toast.info('Disconnected from Slack workspace');
  };

  const addChannel = () => {
    const newChannel = {
      id: channels.length + 1,
      name: `channel-${channels.length + 1}`,
      connected: false,
      notifications: []
    };
    setChannels([...channels, newChannel]);
  };

  const removeChannel = (id: number) => {
    setChannels(channels.filter(c => c.id !== id));
  };

  const toggleChannelConnection = (id: number) => {
    setChannels(channels.map(c => 
      c.id === id ? { ...c, connected: !c.connected } : c
    ));
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>Slack Integration</CardTitle>
                <CardDescription>Connect your Slack workspace for real-time notifications</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isConnected ? (
                <>
                  <Badge variant="success" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Connected
                  </Badge>
                  <Button variant="outline" size="sm" onClick={disconnectSlack}>
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button onClick={connectSlack}>
                  <Link className="h-4 w-4 mr-2" />
                  Connect Slack
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        {isConnected && (
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="workspace">Workspace URL</Label>
                <Input
                  id="workspace"
                  placeholder="your-workspace.slack.com"
                  value={workspaceUrl}
                  onChange={(e) => setWorkspaceUrl(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Daritana Bot has been added to your workspace. Invite it to channels to receive notifications.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Channel Configuration */}
      {isConnected && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Channel Configuration</CardTitle>
                <CardDescription>Choose which channels receive notifications</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={addChannel}>
                <Plus className="h-4 w-4 mr-1" />
                Add Channel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {channels.map(channel => (
                <div key={channel.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Hash className="h-4 w-4 text-gray-500" />
                      <Input
                        value={channel.name}
                        onChange={(e) => {
                          setChannels(channels.map(c =>
                            c.id === channel.id ? { ...c, name: e.target.value } : c
                          ));
                        }}
                        className="w-40"
                      />
                      <Switch
                        checked={channel.connected}
                        onCheckedChange={() => toggleChannelConnection(channel.id)}
                      />
                      <Badge variant={channel.connected ? 'default' : 'secondary'}>
                        {channel.connected ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeChannel(channel.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {channel.connected && (
                    <div>
                      <Label className="text-sm">Notification Types</Label>
                      <Select
                        value={channel.notifications[0] || ''}
                        onValueChange={(value) => {
                          setChannels(channels.map(c =>
                            c.id === channel.id 
                              ? { ...c, notifications: [...c.notifications, value] }
                              : c
                          ));
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select notifications" />
                        </SelectTrigger>
                        <SelectContent>
                          {notificationTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {channel.notifications.map((notif, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {notificationTypes.find(t => t.value === notif)?.label}
                            <button
                              onClick={() => {
                                setChannels(channels.map(c =>
                                  c.id === channel.id
                                    ? { ...c, notifications: c.notifications.filter((_, idx) => idx !== i) }
                                    : c
                                ));
                              }}
                              className="ml-1"
                            >
                              <X className="h-2 w-2" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification Settings */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>Configure how and when notifications are sent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Real-time Notifications</Label>
                  <p className="text-sm text-gray-500">Send notifications immediately as events occur</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Daily Summary</Label>
                  <p className="text-sm text-gray-500">Send a daily summary at 9:00 AM</p>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Weekly Report</Label>
                  <p className="text-sm text-gray-500">Send weekly project reports every Monday</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>@mentions Only</Label>
                  <p className="text-sm text-gray-500">Only notify when someone mentions you</p>
                </div>
                <Switch />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}