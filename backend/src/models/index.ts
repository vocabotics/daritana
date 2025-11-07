import { sequelize } from '../database/connection'
import './associations'

export { sequelize }
export { User, UserRole, UserStatus } from './User'
export { Project, ProjectStatus, ProjectType } from './Project'
export { Task, TaskStatus, TaskPriority, TaskType } from './Task'
export { Document, DocumentType, DocumentStatus, DocumentCategory } from './Document'
export { Invoice, InvoiceStatus, PaymentTerms } from './Invoice'
export { Payment, PaymentStatus, PaymentMethod, PaymentType } from './Payment'
export { Compliance, ComplianceType, ComplianceStatus, CompliancePriority } from './Compliance'
export { default as Notification, NotificationType, NotificationPriority } from './Notification'
export { default as Quotation } from './Quotation'
export { default as QuotationItem } from './QuotationItem'
export { default as ItemLibrary } from './ItemLibrary'
export { default as DesignBrief } from './DesignBrief'

// Export all models as default
export default {
  User: require('./User').default,
  Project: require('./Project').default,
  Task: require('./Task').default,
  Document: require('./Document').default,
  Invoice: require('./Invoice').default,
  Payment: require('./Payment').default,
  Compliance: require('./Compliance').default,
  Notification: require('./Notification').default,
  Quotation: require('./Quotation').default,
  QuotationItem: require('./QuotationItem').default,
  ItemLibrary: require('./ItemLibrary').default,
  DesignBrief: require('./DesignBrief').default
}