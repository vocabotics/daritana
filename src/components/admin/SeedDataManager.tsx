import React, { useState } from 'react';
import { databaseSeeder, SeedingOptions } from '@/utils/seedDatabase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading';
import { 
  Database, 
  Users, 
  Building, 
  CheckSquare, 
  FileText, 
  Trash2, 
  RefreshCw, 
  AlertTriangle,
  Download,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

interface SeedingProgress {
  step: string;
  progress: number;
  total: number;
  completed: boolean;
}

export const SeedDataManager: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedingProgress, setSeedingProgress] = useState<SeedingProgress | null>(null);
  const [seedingOptions, setSeedingOptions] = useState<SeedingOptions>({
    includeUsers: true,
    includeProjects: true,
    includeTasks: true,
    includeDocuments: false,
    includeOrganizations: true,
    additionalProjectCount: 10,
    delay: 300,
  });

  const handleCustomSeed = async () => {
    if (isSeeding) return;

    try {
      setIsSeeding(true);
      setSeedingProgress(null);

      await databaseSeeder.seedDatabase({
        ...seedingOptions,
        onProgress: (progress) => {
          setSeedingProgress(progress);
        },
      });

    } catch (error) {
      console.error('Custom seeding failed:', error);
    } finally {
      setIsSeeding(false);
      setSeedingProgress(null);
    }
  };

  const handlePresetSeed = async (preset: 'demo' | 'development' | 'test') => {
    if (isSeeding) return;

    try {
      setIsSeeding(true);
      setSeedingProgress({ step: 'Starting...', progress: 0, total: 100, completed: false });

      let seedPromise;
      switch (preset) {
        case 'demo':
          seedPromise = databaseSeeder.seedDemoData();
          break;
        case 'development':
          seedPromise = databaseSeeder.seedDevelopmentData();
          break;
        case 'test':
          seedPromise = databaseSeeder.seedTestData();
          break;
        default:
          throw new Error('Invalid preset');
      }

      await seedPromise;
      
    } catch (error) {
      console.error(`${preset} seeding failed:`, error);
    } finally {
      setIsSeeding(false);
      setSeedingProgress(null);
    }
  };

  const handleClearData = async () => {
    if (isSeeding) return;

    const confirmed = window.confirm(
      'Are you sure you want to clear ALL data? This action cannot be undone!'
    );

    if (!confirmed) return;

    try {
      setIsSeeding(true);
      await databaseSeeder.clearAllData();
    } catch (error) {
      console.error('Clear data failed:', error);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleReset = async () => {
    if (isSeeding) return;

    const confirmed = window.confirm(
      'Are you sure you want to reset the database to initial state? This will clear all data and reseed with demo data!'
    );

    if (!confirmed) return;

    try {
      setIsSeeding(true);
      setSeedingProgress({ step: 'Resetting database...', progress: 0, total: 100, completed: false });
      await databaseSeeder.resetToInitialState();
    } catch (error) {
      console.error('Reset failed:', error);
    } finally {
      setIsSeeding(false);
      setSeedingProgress(null);
    }
  };

  const updateOption = <K extends keyof SeedingOptions>(key: K, value: SeedingOptions[K]) => {
    setSeedingOptions(prev => ({ ...prev, [key]: value }));
  };

  if (import.meta.env.PROD) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Seed Data Manager is not available in production environment.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Database className="h-6 w-6 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Database Seed Manager</h2>
          <p className="text-gray-600">Manage test and demo data for development</p>
        </div>
      </div>

      {/* Environment Warning */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Development Only:</strong> This tool is only available in development mode. 
          Use with caution as operations can modify or delete data.
        </AlertDescription>
      </Alert>

      {/* Progress Display */}
      {seedingProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              Seeding in Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{seedingProgress.step}</span>
                <span>{seedingProgress.progress}/{seedingProgress.total}</span>
              </div>
              <Progress 
                value={(seedingProgress.progress / seedingProgress.total) * 100} 
                className="w-full"
              />
            </div>
            {seedingProgress.completed && (
              <div className="text-green-600 text-sm font-medium">
                ✅ Seeding completed successfully!
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          onClick={() => handlePresetSeed('demo')}
          disabled={isSeeding}
          className="flex items-center gap-2"
          variant="default"
        >
          <Download className="h-4 w-4" />
          Seed Demo Data
        </Button>
        
        <Button
          onClick={() => handlePresetSeed('development')}
          disabled={isSeeding}
          className="flex items-center gap-2"
          variant="outline"
        >
          <Upload className="h-4 w-4" />
          Seed Dev Data
        </Button>
        
        <Button
          onClick={() => handlePresetSeed('test')}
          disabled={isSeeding}
          className="flex items-center gap-2"
          variant="outline"
        >
          <CheckSquare className="h-4 w-4" />
          Seed Test Data
        </Button>
        
        <Button
          onClick={handleReset}
          disabled={isSeeding}
          className="flex items-center gap-2"
          variant="secondary"
        >
          <RefreshCw className="h-4 w-4" />
          Reset Database
        </Button>
      </div>

      {/* Custom Seeding Options */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Seeding Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Include Options */}
          <div>
            <Label className="text-base font-medium mb-3 block">Data Categories</Label>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-orgs"
                  checked={seedingOptions.includeOrganizations}
                  onCheckedChange={(checked) => updateOption('includeOrganizations', checked)}
                />
                <Label htmlFor="include-orgs" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Organizations
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="include-users"
                  checked={seedingOptions.includeUsers}
                  onCheckedChange={(checked) => updateOption('includeUsers', checked)}
                />
                <Label htmlFor="include-users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="include-projects"
                  checked={seedingOptions.includeProjects}
                  onCheckedChange={(checked) => updateOption('includeProjects', checked)}
                />
                <Label htmlFor="include-projects" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Projects
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="include-tasks"
                  checked={seedingOptions.includeTasks}
                  onCheckedChange={(checked) => updateOption('includeTasks', checked)}
                />
                <Label htmlFor="include-tasks" className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Tasks
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="include-docs"
                  checked={seedingOptions.includeDocuments}
                  onCheckedChange={(checked) => updateOption('includeDocuments', checked)}
                />
                <Label htmlFor="include-docs" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents (Metadata)
                </Label>
              </div>
            </div>
          </div>

          {/* Numeric Options */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="additional-projects">Additional Projects</Label>
              <Input
                id="additional-projects"
                type="number"
                min="0"
                max="100"
                value={seedingOptions.additionalProjectCount || 0}
                onChange={(e) => updateOption('additionalProjectCount', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-gray-500">
                Generate additional test projects beyond the seed data
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delay">API Call Delay (ms)</Label>
              <Input
                id="delay"
                type="number"
                min="0"
                max="5000"
                step="100"
                value={seedingOptions.delay || 300}
                onChange={(e) => updateOption('delay', parseInt(e.target.value) || 300)}
              />
              <p className="text-xs text-gray-500">
                Delay between API calls to prevent rate limiting
              </p>
            </div>
          </div>

          {/* Custom Seed Button */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              Configure your custom seeding options above
            </div>
            <Button
              onClick={handleCustomSeed}
              disabled={isSeeding}
              className="flex items-center gap-2"
            >
              {isSeeding ? (
                <>
                  <LoadingSpinner size="sm" />
                  Seeding...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  Run Custom Seed
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                These actions are irreversible. Make sure you have backups if needed.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleClearData}
              disabled={isSeeding}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear All Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};