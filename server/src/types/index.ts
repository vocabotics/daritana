// User and Authentication Types
export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  organization_id?: string;
  avatar?: string;
  phone?: string;
  created_at: Date;
  updated_at: Date;
}

export type UserRole = 'client' | 'staff' | 'contractor' | 'project_lead' | 'designer' | 'admin';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    organization_id?: string;
  };
}

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
  organization_id?: string;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  client_id: string;
  project_lead_id: string;
  designer_id?: string;
  status: ProjectStatus;
  type: ProjectType;
  location?: string;
  budget?: number;
  start_date: Date;
  end_date?: Date;
  completion_percentage: number;
  organization_id: string;
  created_at: Date;
  updated_at: Date;
}

export type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
export type ProjectType = 'residential' | 'commercial' | 'industrial' | 'landscape' | 'interior';

// Task Types
export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: Date;
  position: number;
  column: string;
  dependencies?: string[];
  tags?: string[];
  estimated_hours?: number;
  actual_hours?: number;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Financial Types
export interface Invoice {
  id: string;
  project_id: string;
  invoice_number: string;
  client_id: string;
  amount: number;
  tax_amount?: number;
  total_amount: number;
  status: InvoiceStatus;
  due_date: Date;
  paid_date?: Date;
  payment_method?: string;
  notes?: string;
  items: InvoiceItem[];
  created_at: Date;
  updated_at: Date;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Quotation {
  id: string;
  project_id?: string;
  quotation_number: string;
  client_id: string;
  valid_until: Date;
  status: QuotationStatus;
  subtotal: number;
  tax_amount?: number;
  discount?: number;
  total_amount: number;
  terms?: string;
  notes?: string;
  items: QuotationItem[];
  created_at: Date;
  updated_at: Date;
}

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

// Marketplace Types
export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  unit: string;
  images: string[];
  specifications?: Record<string, any>;
  in_stock: boolean;
  stock_quantity?: number;
  minimum_order?: number;
  tags?: string[];
  rating?: number;
  reviews_count?: number;
  created_at: Date;
  updated_at: Date;
}

export type ProductCategory = 
  | 'materials' 
  | 'furniture' 
  | 'fixtures' 
  | 'tools' 
  | 'services' 
  | 'equipment';

export interface Order {
  id: string;
  user_id: string;
  vendor_id: string;
  order_number: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shipping_address?: Address;
  billing_address?: Address;
  payment_method?: string;
  payment_status: PaymentStatus;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled';

export type PaymentStatus = 
  | 'pending' 
  | 'paid' 
  | 'failed' 
  | 'refunded';

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface CartItem {
  product_id: string;
  quantity: number;
  selected: boolean;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

// File Types
export interface FileUpload {
  id: string;
  filename: string;
  original_name: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
  uploaded_by: string;
  project_id?: string;
  task_id?: string;
  created_at: Date;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

// Socket Events
export interface SocketEvents {
  'project:update': (project: Project) => void;
  'task:update': (task: Task) => void;
  'task:move': (data: { taskId: string; column: string; position: number }) => void;
  'user:online': (userId: string) => void;
  'user:offline': (userId: string) => void;
  'notification': (notification: Notification) => void;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  created_at: Date;
}

export type NotificationType = 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'task' 
  | 'project' 
  | 'payment';