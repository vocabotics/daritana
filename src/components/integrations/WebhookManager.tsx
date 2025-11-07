import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Webhook,
  Plus,
  Copy,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Code,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface WebhookType {
  id: number;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive' | 'error';
  lastTriggered: string;
  successRate: number;
  secret?: string;
}

export function WebhookManager() {
  const [webhooks, setWebhooks] = useState<WebhookType[]>([
    {
      id: 1,
      name: 'Project Updates',
      url: 'https://api.example.com/webhooks/projects',
      events: ['project.created', 'project.updated', 'project.completed'],
      status: 'active',
      lastTriggered: '2 hours ago',
      successRate: 98.5,
      secret: 'whsec_1234567890'
    },
    {
      id: 2,
      name: 'Task Notifications',
      url: 'https://api.example.com/webhooks/tasks',
      events: ['task.assigned', 'task.completed'],
      status: 'active',
      lastTriggered: '30 minutes ago',
      successRate: 100
    },
    {
      id: 3,
      name: 'Error Alerts',
      url: 'https://api.example.com/webhooks/errors',
      events: ['error.critical', 'error.warning'],
      status: 'error',
      lastTriggered: '1 day ago',
      successRate: 45.2
    }
  ]);

  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret: ''
  });

  const availableEvents = [
    'project.created',
    'project.updated',
    'project.completed',
    'project.deleted',
    'task.created',
    'task.assigned',
    'task.completed',
    'task.overdue',
    'user.joined',
    'user.left',
    'file.uploaded',
    'file.deleted',
    'comment.added',
    'error.critical',
    'error.warning'
  ];

  const addWebhook = () => {
    const webhook: WebhookType = {
      id: webhooks.length + 1,
      name: newWebhook.name,
      url: newWebhook.url,
      events: newWebhook.events,
      status: 'active',
      lastTriggered: 'Never',
      successRate: 0,
      secret: newWebhook.secret || `whsec_${Math.random().toString(36).substr(2, 9)}`
    };
    
    setWebhooks([...webhooks, webhook]);
    setShowAddWebhook(false);
    setNewWebhook({ name: '', url: '', events: [], secret: '' });
    toast.success('Webhook added successfully');
  };

  const deleteWebhook = (id: number) => {
    setWebhooks(webhooks.filter(w => w.id !== id));
    toast.info('Webhook deleted');
  };

  const testWebhook = (webhook: WebhookType) => {
    toast.info(`Testing webhook: ${webhook.name}`);
    setTimeout(() => {
      toast.success('Webhook test successful');
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive': return <XCircle className="h-4 w-4 text-gray-400" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>Manage HTTP callbacks for real-time events</CardDescription>
            </div>
            <Button onClick={() => setShowAddWebhook(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Add Webhook Form */}
      {showAddWebhook && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Webhook</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Webhook Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Project Updates"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="url">Endpoint URL</Label>
                <Input
                  id="url"
                  placeholder="https://your-api.com/webhook"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="events">Events</Label>
                <Select onValueChange={(value) => {
                  if (!newWebhook.events.includes(value)) {
                    setNewWebhook({ ...newWebhook, events: [...newWebhook.events, value] });
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select events to trigger webhook" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEvents.map(event => (
                      <SelectItem key={event} value={event}>{event}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1 mt-2">
                  {newWebhook.events.map((event, i) => (
                    <Badge key={i} variant="secondary">
                      {event}
                      <button
                        onClick={() => setNewWebhook({
                          ...newWebhook,
                          events: newWebhook.events.filter((_, idx) => idx !== i)
                        })}
                        className="ml-1"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="secret">Secret Key (Optional)</Label>
                <Input
                  id="secret"
                  type="password"
                  placeholder="Leave blank to auto-generate"
                  value={newWebhook.secret}
                  onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={addWebhook}>Create Webhook</Button>
                <Button variant="outline" onClick={() => setShowAddWebhook(false)}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhooks List */}
      <div className="space-y-4">
        {webhooks.map(webhook => (
          <Card key={webhook.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Webhook className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{webhook.name}</h3>
                      {getStatusIcon(webhook.status)}
                      <Badge variant={webhook.status === 'active' ? 'default' : webhook.status === 'error' ? 'destructive' : 'secondary'}>
                        {webhook.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{webhook.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testWebhook(webhook)}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Test
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteWebhook(webhook.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Events</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {webhook.events.map((event, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-gray-500">Last Triggered</p>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {webhook.lastTriggered}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Success Rate</p>
                  <p className={`font-medium ${webhook.successRate > 90 ? 'text-green-600' : webhook.successRate > 70 ? 'text-orange-600' : 'text-red-600'}`}>
                    {webhook.successRate}%
                  </p>
                </div>
              </div>
              
              {webhook.secret && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Signing Secret</p>
                      <code className="text-sm font-mono">{webhook.secret}</code>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(webhook.secret!);
                        toast.success('Secret copied to clipboard');
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payload Example */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            <CardTitle>Example Payload</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "event": "project.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "proj_123",
    "name": "KLCC Tower Renovation",
    "status": "active",
    "created_by": "user_456"
  }
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}