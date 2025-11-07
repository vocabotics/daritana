import { useMFAStore } from '@/store/mfaStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Monitor, 
  Smartphone, 
  Tablet,
  MapPin,
  Calendar,
  Trash2,
  Shield,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TrustedDevicesProps {
  userId: string;
}

export default function TrustedDevices({ userId }: TrustedDevicesProps) {
  const { getTrustedDevices, removeTrustedDevice } = useMFAStore();
  
  const trustedDevices = getTrustedDevices(userId);

  const getDeviceIcon = (deviceType: string) => {
    const icons = {
      desktop: Monitor,
      mobile: Smartphone,
      tablet: Tablet
    };
    return icons[deviceType as keyof typeof icons] || Monitor;
  };

  const getDeviceTypeLabel = (deviceType: string) => {
    const labels = {
      desktop: 'Desktop',
      mobile: 'Mobile',
      tablet: 'Tablet'
    };
    return labels[deviceType as keyof typeof labels] || deviceType;
  };

  const handleRemoveDevice = (deviceId: string, deviceName: string) => {
    removeTrustedDevice(userId, deviceId);
    toast.success(`Removed ${deviceName} from trusted devices`);
  };

  const isCurrentDevice = (device: any) => {
    // Simple heuristic to identify current device
    const now = new Date();
    const lastUsed = new Date(device.lastUsed);
    const timeDiff = now.getTime() - lastUsed.getTime();
    return timeDiff < 5 * 60 * 1000; // Within last 5 minutes
  };

  if (trustedDevices.length === 0) {
    return (
      <div className="space-y-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            No trusted devices configured. When you enable "Remember this device" during login, 
            it will appear here.
          </AlertDescription>
        </Alert>

        <div className="text-center py-8">
          <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Trusted Devices</h3>
          <p className="text-muted-foreground">
            Devices you trust will be listed here for easier access
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Trusted devices can bypass MFA for a limited time. Remove any devices you no longer use 
          or don't recognize.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {trustedDevices.map((device) => {
          const IconComponent = getDeviceIcon(device.deviceType);
          const isCurrent = isCurrentDevice(device);
          
          return (
            <Card key={device.id} className={isCurrent ? 'border-green-200 bg-green-50/50' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <IconComponent className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base">{device.name}</CardTitle>
                        {isCurrent && (
                          <Badge variant="default" className="text-green-600 border-green-200 bg-green-100">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Current Device
                          </Badge>
                        )}
                        <Badge variant="secondary">
                          {getDeviceTypeLabel(device.deviceType)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {device.browser && (
                          <div className="flex items-center gap-2">
                            <Monitor className="h-3 w-3" />
                            <span>{device.browser}</span>
                          </div>
                        )}
                        
                        {device.os && (
                          <div className="flex items-center gap-2">
                            <span>💻</span>
                            <span>{device.os}</span>
                          </div>
                        )}
                        
                        {device.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <span>{device.location}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <span>🌐</span>
                          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                            {device.ipAddress}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Trusted Device</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove "{device.name}" from your trusted devices? 
                          This device will need to complete MFA verification on next login.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveDevice(device.id, device.name)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Remove Device
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>Added {format(new Date(device.addedAt), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Last used {format(new Date(device.lastUsed), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center pt-4">
        <p className="text-sm text-muted-foreground">
          Trusted devices are automatically removed after 30 days of inactivity
        </p>
      </div>
    </div>
  );
}