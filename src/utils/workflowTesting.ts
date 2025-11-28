// Comprehensive workflow testing utilities for Daritana
import { toast } from 'sonner';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  action: () => Promise<boolean>;
  validation?: () => Promise<boolean>;
  cleanup?: () => Promise<void>;
  timeout?: number;
}

export interface WorkflowTest {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
  roles?: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface TestResult {
  workflowId: string;
  stepId: string;
  success: boolean;
  duration: number;
  error?: string;
  timestamp: Date;
}

export interface WorkflowTestSuite {
  name: string;
  tests: WorkflowTest[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
  };
  results: TestResult[];
}

class WorkflowTester {
  private static instance: WorkflowTester;
  private currentTest: WorkflowTest | null = null;
  private results: TestResult[] = [];
  private isRunning = false;

  private constructor() {}

  public static getInstance(): WorkflowTester {
    if (!WorkflowTester.instance) {
      WorkflowTester.instance = new WorkflowTester();
    }
    return WorkflowTester.instance;
  }

  async runWorkflow(
    workflow: WorkflowTest,
    onProgress?: (stepIndex: number, step: WorkflowStep, result?: TestResult) => void
  ): Promise<WorkflowTestSuite> {
    if (this.isRunning) {
      throw new Error('Another workflow is already running');
    }

    this.isRunning = true;
    this.currentTest = workflow;
    const startTime = Date.now();
    const testResults: TestResult[] = [];

    try {
      console.log(`🧪 Starting workflow test: ${workflow.name}`);
      
      // Setup
      if (workflow.setup) {
        console.log('🔧 Running setup...');
        await workflow.setup();
      }

      // Run each step
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        const stepStartTime = Date.now();

        console.log(`📋 Step ${i + 1}/${workflow.steps.length}: ${step.name}`);
        onProgress?.(i, step);

        try {
          // Execute step action with timeout
          const timeout = step.timeout || 30000; // 30 seconds default
          const result = await Promise.race([
            step.action(),
            new Promise<boolean>((_, reject) => 
              setTimeout(() => reject(new Error('Step timeout')), timeout)
            )
          ]);

          // Validate step result
          let validationPassed = true;
          if (step.validation) {
            validationPassed = await step.validation();
          }

          const success = result && validationPassed;
          const stepDuration = Date.now() - stepStartTime;

          const stepResult: TestResult = {
            workflowId: workflow.id,
            stepId: step.id,
            success,
            duration: stepDuration,
            timestamp: new Date(),
          };

          if (!success) {
            stepResult.error = validationPassed ? 'Step action failed' : 'Validation failed';
          }

          testResults.push(stepResult);
          onProgress?.(i, step, stepResult);

          if (!success) {
            console.error(`❌ Step failed: ${step.name}`, stepResult.error);
            break;
          } else {
            console.log(`✅ Step passed: ${step.name} (${stepDuration}ms)`);
          }

          // Cleanup after step if provided
          if (step.cleanup) {
            await step.cleanup();
          }

        } catch (error) {
          const stepResult: TestResult = {
            workflowId: workflow.id,
            stepId: step.id,
            success: false,
            duration: Date.now() - stepStartTime,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date(),
          };

          testResults.push(stepResult);
          onProgress?.(i, step, stepResult);
          
          console.error(`❌ Step error: ${step.name}`, error);
          break;
        }
      }

      // Teardown
      if (workflow.teardown) {
        console.log('🧹 Running teardown...');
        try {
          await workflow.teardown();
        } catch (error) {
          console.warn('Teardown failed:', error);
        }
      }

    } finally {
      this.isRunning = false;
      this.currentTest = null;
    }

    const totalDuration = Date.now() - startTime;
    const passed = testResults.filter(r => r.success).length;
    const failed = testResults.filter(r => !r.success).length;

    const suite: WorkflowTestSuite = {
      name: workflow.name,
      tests: [workflow],
      summary: {
        total: testResults.length,
        passed,
        failed,
        duration: totalDuration,
      },
      results: testResults,
    };

    // Store results
    this.results.push(...testResults);

    console.log(`📊 Workflow completed: ${passed}/${testResults.length} steps passed (${totalDuration}ms)`);
    
    return suite;
  }

  async runTestSuite(
    tests: WorkflowTest[],
    onProgress?: (testIndex: number, test: WorkflowTest, stepIndex?: number, step?: WorkflowStep) => void
  ): Promise<WorkflowTestSuite> {
    const startTime = Date.now();
    const allResults: TestResult[] = [];
    let totalPassed = 0;
    let totalFailed = 0;

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      console.log(`🧪 Running test suite ${i + 1}/${tests.length}: ${test.name}`);
      onProgress?.(i, test);

      const suite = await this.runWorkflow(test, (stepIndex, step, result) => {
        onProgress?.(i, test, stepIndex, step);
      });

      allResults.push(...suite.results);
      totalPassed += suite.summary.passed;
      totalFailed += suite.summary.failed;
    }

    const totalDuration = Date.now() - startTime;

    return {
      name: 'Full Test Suite',
      tests,
      summary: {
        total: allResults.length,
        passed: totalPassed,
        failed: totalFailed,
        duration: totalDuration,
      },
      results: allResults,
    };
  }

  // Utility methods for common test operations
  async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async waitForElement(selector: string, timeout = 5000): Promise<HTMLElement> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) return element;
      await this.delay(100);
    }
    
    throw new Error(`Element not found: ${selector}`);
  }

  async waitForCondition(condition: () => boolean, timeout = 5000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (condition()) return;
      await this.delay(100);
    }
    
    throw new Error('Condition not met within timeout');
  }

  async clickElement(selector: string): Promise<boolean> {
    try {
      const element = await this.waitForElement(selector);
      element.click();
      return true;
    } catch (error) {
      console.error(`Failed to click element: ${selector}`, error);
      return false;
    }
  }

  async fillInput(selector: string, value: string): Promise<boolean> {
    try {
      const element = await this.waitForElement(selector) as HTMLInputElement;
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    } catch (error) {
      console.error(`Failed to fill input: ${selector}`, error);
      return false;
    }
  }

  async verifyText(selector: string, expectedText: string): Promise<boolean> {
    try {
      const element = await this.waitForElement(selector);
      const actualText = element.textContent?.trim();
      return actualText === expectedText;
    } catch (error) {
      console.error(`Failed to verify text: ${selector}`, error);
      return false;
    }
  }

  async verifyUrl(expectedPath: string): Promise<boolean> {
    return window.location.pathname === expectedPath;
  }

  async makeApiCall(url: string, options?: RequestInit): Promise<boolean> {
    try {
      const response = await fetch(url, options);
      return response.ok;
    } catch (error) {
      console.error(`API call failed: ${url}`, error);
      return false;
    }
  }

  // Get test results and statistics
  getResults(): TestResult[] {
    return [...this.results];
  }

  getResultsByWorkflow(workflowId: string): TestResult[] {
    return this.results.filter(r => r.workflowId === workflowId);
  }

  getStatistics() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const averageDuration = total > 0 ? this.results.reduce((sum, r) => sum + r.duration, 0) / total : 0;

    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? (passed / total) * 100 : 0,
      averageDuration,
    };
  }

  clearResults(): void {
    this.results = [];
  }

  get isTestRunning(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const workflowTester = WorkflowTester.getInstance();

// Utility functions for creating common workflow steps
export const createNavigationStep = (name: string, path: string): WorkflowStep => ({
  id: `nav-${path.replace(/[^a-zA-Z0-9]/g, '-')}`,
  name,
  description: `Navigate to ${path}`,
  action: async () => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    await workflowTester.delay(500);
    return true;
  },
  validation: async () => workflowTester.verifyUrl(path),
});

export const createFormStep = (
  name: string,
  formData: Record<string, string>,
  submitSelector: string
): WorkflowStep => ({
  id: `form-${name.toLowerCase().replace(/\s+/g, '-')}`,
  name,
  description: `Fill and submit form: ${name}`,
  action: async () => {
    // Fill form fields
    for (const [selector, value] of Object.entries(formData)) {
      const success = await workflowTester.fillInput(selector, value);
      if (!success) return false;
    }

    // Submit form
    return await workflowTester.clickElement(submitSelector);
  },
  timeout: 10000,
});

export const createApiStep = (
  name: string,
  url: string,
  options?: RequestInit
): WorkflowStep => ({
  id: `api-${name.toLowerCase().replace(/\s+/g, '-')}`,
  name,
  description: `API call: ${name}`,
  action: () => workflowTester.makeApiCall(url, options),
});

export const createWaitStep = (name: string, condition: () => boolean, timeout = 5000): WorkflowStep => ({
  id: `wait-${name.toLowerCase().replace(/\s+/g, '-')}`,
  name,
  description: `Wait for condition: ${name}`,
  action: async () => {
    await workflowTester.waitForCondition(condition, timeout);
    return true;
  },
  timeout: timeout + 1000,
});

// Development-only testing commands
if (import.meta.env.DEV) {
  (window as any).workflowTester = {
    run: workflowTester.runWorkflow.bind(workflowTester),
    runSuite: workflowTester.runTestSuite.bind(workflowTester),
    results: workflowTester.getResults.bind(workflowTester),
    stats: workflowTester.getStatistics.bind(workflowTester),
    clear: workflowTester.clearResults.bind(workflowTester),
  };
}