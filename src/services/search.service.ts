import { useProjectStore } from '@/store/projectStore';
import { useTaskStore } from '@/store/taskStore';
import { useFinancialStore } from '@/store/financialStore';
import { Building2, FileText, CheckSquare, Users, DollarSign, File, ShieldCheck, ShoppingBag, Package, Receipt, CreditCard, Briefcase, Calendar, MessageSquare } from 'lucide-react';

export interface SearchResult {
  projects: any[];
  tasks: any[];
  users: any[];
  documents: any[];
  invoices: any[];
  quotations: any[];
  files: any[];
  products: any[];
  vendors: any[];
  total: number;
}

export interface SearchSuggestion {
  type: 'project' | 'task' | 'user' | 'document' | 'invoice' | 'quotation' | 'file' | 'product' | 'vendor';
  id: string;
  text: string;
  description?: string;
  icon: any;
  metadata?: {
    status?: string;
    amount?: number;
    date?: string;
    assignee?: string;
    category?: string;
  };
}

class SearchService {
  /**
   * Perform a comprehensive global search across all system resources
   */
  async search(query: string, type?: string): Promise<SearchResult> {
    try {
      const searchQuery = query.toLowerCase().trim();
      if (!searchQuery) {
        return this.getEmptyResults();
      }

      const projectStore = useProjectStore.getState();
      const taskStore = useTaskStore.getState();
      const financialStore = useFinancialStore.getState();
      
      // Search projects
      const projects = (type === 'projects' || !type)
        ? projectStore.projects.filter(project => 
            this.matchesQuery(searchQuery, [
              project.name,
              project.description,
              project.client?.firstName,
              project.client?.lastName,
              project.client?.companyName,
              project.address,
              project.city,
              project.state,
              project.status,
              project.type,
              project.priority
            ])
          )
        : [];
      
      // Search tasks
      const tasks = (type === 'tasks' || !type)
        ? taskStore.tasks.filter(task =>
            this.matchesQuery(searchQuery, [
              task.title,
              task.description,
              task.status,
              task.priority,
              task.assignee?.name,
              task.tags?.join(' ')
            ])
          )
        : [];
      
      // Search invoices
      const invoices = (type === 'invoices' || !type)
        ? (financialStore.invoices || []).filter(invoice =>
            this.matchesQuery(searchQuery, [
              invoice.number,
              invoice.client,
              invoice.description,
              invoice.status,
              invoice.amount?.toString(),
              invoice.project?.name
            ])
          )
        : [];
      
      // Search quotations
      const quotations = (type === 'quotations' || !type)
        ? (financialStore.quotations || []).filter(quotation =>
            this.matchesQuery(searchQuery, [
              quotation.number,
              quotation.client,
              quotation.description,
              quotation.status,
              quotation.amount?.toString(),
              quotation.project?.name,
              quotation.items?.map(i => i.description).join(' ')
            ])
          )
        : [];

      // Search expenses
      const expenses = (type === 'expenses' || !type)
        ? (financialStore.expenses || []).filter(expense =>
            this.matchesQuery(searchQuery, [
              expense.description,
              expense.category,
              expense.vendor,
              expense.amount?.toString(),
              expense.project?.name
            ])
          )
        : [];

      // Combine financial items into documents for backward compatibility
      const documents = [...invoices, ...quotations];
      
      // Mock data for other categories (will be populated when stores are created)
      const users: any[] = [];
      const files: any[] = [];
      const products: any[] = [];
      const vendors: any[] = [];
      
      return {
        projects,
        tasks,
        users,
        documents,
        invoices,
        quotations,
        files,
        products,
        vendors,
        total: projects.length + tasks.length + users.length + documents.length + 
               invoices.length + quotations.length + files.length + products.length + 
               vendors.length
      };
    } catch (error) {
      console.error('Search failed:', error);
      return this.getEmptyResults();
    }
  }

  /**
   * Get search suggestions for autocomplete across all system resources
   */
  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    try {
      if (!query || query.length < 2) return [];
      
      const searchQuery = query.toLowerCase().trim();
      const suggestions: SearchSuggestion[] = [];
      const maxSuggestionsPerType = 3;
      
      const projectStore = useProjectStore.getState();
      const taskStore = useTaskStore.getState();
      const financialStore = useFinancialStore.getState();
      
      // Add project suggestions
      projectStore.projects
        .filter(project => this.matchesQuery(searchQuery, [project.name, project.description]))
        .slice(0, maxSuggestionsPerType)
        .forEach(project => {
          suggestions.push({
            type: 'project',
            id: project.id,
            text: project.name,
            description: `${project.type || 'Project'} • ${project.status}`,
            icon: Building2,
            metadata: {
              status: project.status,
              category: project.type
            }
          });
        });
      
      // Add task suggestions
      taskStore.tasks
        .filter(task => this.matchesQuery(searchQuery, [task.title]))
        .slice(0, maxSuggestionsPerType)
        .forEach(task => {
          suggestions.push({
            type: 'task',
            id: task.id,
            text: task.title,
            description: `Task • ${task.status} • ${task.priority} priority`,
            icon: CheckSquare,
            metadata: {
              status: task.status,
              assignee: task.assignee?.name
            }
          });
        });
      
      // Add invoice suggestions
      (financialStore.invoices || [])
        .filter(invoice => this.matchesQuery(searchQuery, [invoice.number, invoice.client]))
        .slice(0, maxSuggestionsPerType)
        .forEach(invoice => {
          suggestions.push({
            type: 'invoice',
            id: invoice.id,
            text: `Invoice ${invoice.number}`,
            description: `${invoice.client} • RM ${invoice.amount?.toLocaleString()}`,
            icon: FileText,
            metadata: {
              status: invoice.status,
              amount: invoice.amount
            }
          });
        });

      // Add quotation suggestions
      (financialStore.quotations || [])
        .filter(quotation => this.matchesQuery(searchQuery, [quotation.number, quotation.client]))
        .slice(0, maxSuggestionsPerType)
        .forEach(quotation => {
          suggestions.push({
            type: 'quotation',
            id: quotation.id,
            text: `Quote ${quotation.number}`,
            description: `${quotation.client} • RM ${quotation.amount?.toLocaleString()}`,
            icon: Receipt,
            metadata: {
              status: quotation.status,
              amount: quotation.amount
            }
          });
        });
      
      // Sort suggestions by relevance (exact matches first, then partial matches)
      suggestions.sort((a, b) => {
        const aExact = a.text.toLowerCase().startsWith(searchQuery);
        const bExact = b.text.toLowerCase().startsWith(searchQuery);
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return 0;
      });
      
      return suggestions.slice(0, 10); // Return top 10 suggestions
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      return [];
    }
  }

  /**
   * Advanced search with filters
   */
  async advancedSearch(query: string, filters: {
    types?: string[];
    status?: string[];
    dateFrom?: Date;
    dateTo?: Date;
    amountMin?: number;
    amountMax?: number;
    assignee?: string;
    category?: string;
    tags?: string[];
  }): Promise<SearchResult> {
    const baseResults = await this.search(query);
    
    // Apply filters to results
    if (filters.types && filters.types.length > 0) {
      const allowedTypes = new Set(filters.types);
      if (!allowedTypes.has('projects')) baseResults.projects = [];
      if (!allowedTypes.has('tasks')) baseResults.tasks = [];
      if (!allowedTypes.has('invoices')) baseResults.invoices = [];
      if (!allowedTypes.has('quotations')) baseResults.quotations = [];
    }
    
    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      const allowedStatuses = new Set(filters.status.map(s => s.toLowerCase()));
      baseResults.projects = baseResults.projects.filter(p => allowedStatuses.has(p.status?.toLowerCase()));
      baseResults.tasks = baseResults.tasks.filter(t => allowedStatuses.has(t.status?.toLowerCase()));
      baseResults.invoices = baseResults.invoices.filter(i => allowedStatuses.has(i.status?.toLowerCase()));
    }
    
    // Apply date range filter
    if (filters.dateFrom || filters.dateTo) {
      const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : new Date(0);
      const dateTo = filters.dateTo ? new Date(filters.dateTo) : new Date();
      
      baseResults.projects = baseResults.projects.filter(p => {
        const date = new Date(p.createdAt);
        return date >= dateFrom && date <= dateTo;
      });
      
      baseResults.tasks = baseResults.tasks.filter(t => {
        const date = new Date(t.createdAt);
        return date >= dateFrom && date <= dateTo;
      });
      
      baseResults.invoices = baseResults.invoices.filter(i => {
        const date = new Date(i.createdAt);
        return date >= dateFrom && date <= dateTo;
      });
    }
    
    // Apply amount range filter (for financial items)
    if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
      const min = filters.amountMin || 0;
      const max = filters.amountMax || Infinity;
      
      baseResults.invoices = baseResults.invoices.filter(i => {
        const amount = i.amount || 0;
        return amount >= min && amount <= max;
      });
      
      baseResults.quotations = baseResults.quotations.filter(q => {
        const amount = q.amount || 0;
        return amount >= min && amount <= max;
      });
    }
    
    // Apply assignee filter
    if (filters.assignee) {
      baseResults.tasks = baseResults.tasks.filter(t => 
        t.assignee?.id === filters.assignee || 
        t.assignee?.name?.toLowerCase().includes(filters.assignee.toLowerCase())
      );
    }
    
    // Apply category filter
    if (filters.category) {
      const categoryLower = filters.category.toLowerCase();
      baseResults.documents = baseResults.documents.filter(d => 
        d.category?.toLowerCase().includes(categoryLower)
      );
    }
    
    // Apply tags filter
    if (filters.tags && filters.tags.length > 0) {
      const requiredTags = new Set(filters.tags.map(t => t.toLowerCase()));
      
      baseResults.tasks = baseResults.tasks.filter(t => 
        t.tags?.some(tag => requiredTags.has(tag.toLowerCase()))
      );
      baseResults.documents = baseResults.documents.filter(d => 
        d.tags?.some(tag => requiredTags.has(tag.toLowerCase()))
      );
    }
    
    // Recalculate total
    baseResults.total = baseResults.projects.length + baseResults.tasks.length + 
                       baseResults.users.length + baseResults.documents.length + 
                       baseResults.invoices.length + baseResults.quotations.length + 
                       baseResults.files.length + baseResults.products.length + 
                       baseResults.vendors.length;
    
    return baseResults;
  }

  /**
   * Search only projects
   */
  async searchProjects(query: string): Promise<any[]> {
    const results = await this.search(query, 'projects');
    return results.projects;
  }

  /**
   * Search only tasks
   */
  async searchTasks(query: string): Promise<any[]> {
    const results = await this.search(query, 'tasks');
    return results.tasks;
  }

  /**
   * Search only invoices
   */
  async searchInvoices(query: string): Promise<any[]> {
    const results = await this.search(query, 'invoices');
    return results.invoices;
  }

  /**
   * Search only quotations
   */
  async searchQuotations(query: string): Promise<any[]> {
    const results = await this.search(query, 'quotations');
    return results.quotations;
  }

  /**
   * Get recent searches for the current user
   */
  getRecentSearches(): string[] {
    const stored = localStorage.getItem('recentSearches');
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Save a search to recent searches
   */
  saveRecentSearch(query: string): void {
    const recent = this.getRecentSearches();
    const updated = [query, ...recent.filter(q => q !== query)].slice(0, 10);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  }

  /**
   * Clear recent searches
   */
  clearRecentSearches(): void {
    localStorage.removeItem('recentSearches');
  }

  /**
   * Helper method to check if any field matches the query
   */
  private matchesQuery(query: string, fields: (string | undefined | null)[]): boolean {
    return fields.some(field => {
      if (!field) return false;
      return field.toString().toLowerCase().includes(query);
    });
  }

  /**
   * Get empty results object
   */
  private getEmptyResults(): SearchResult {
    return {
      projects: [],
      tasks: [],
      users: [],
      documents: [],
      invoices: [],
      quotations: [],
      files: [],
      products: [],
      vendors: [],
      total: 0
    };
  }
}

export const searchService = new SearchService();