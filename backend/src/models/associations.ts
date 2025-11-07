import User from './User'
import Project from './Project'
import Task from './Task'
import Document from './Document'
import Invoice from './Invoice'
import Payment from './Payment'
import Compliance from './Compliance'
import Notification from './Notification'
import Quotation from './Quotation'
import QuotationItem from './QuotationItem'
import ItemLibrary from './ItemLibrary'
import DesignBrief from './DesignBrief'

// User associations
User.hasMany(Project, { as: 'clientProjects', foreignKey: 'clientId' })
User.hasMany(Project, { as: 'leadProjects', foreignKey: 'projectLeadId' })
User.hasMany(Project, { as: 'designProjects', foreignKey: 'designerId' })
User.hasMany(Task, { as: 'assignedTasks', foreignKey: 'assigneeId' })
User.hasMany(Task, { as: 'reportedTasks', foreignKey: 'reporterId' })
User.hasMany(Document, { as: 'documents', foreignKey: 'userId' })
User.hasMany(Invoice, { as: 'clientInvoices', foreignKey: 'clientId' })
User.hasMany(Invoice, { as: 'issuedInvoices', foreignKey: 'issuedBy' })
User.hasMany(Payment, { as: 'paymentsOut', foreignKey: 'payerId' })
User.hasMany(Payment, { as: 'paymentsIn', foreignKey: 'receiverId' })
User.hasMany(Notification, { as: 'receivedNotifications', foreignKey: 'recipientId' })
User.hasMany(Notification, { as: 'sentNotifications', foreignKey: 'senderId' })

// Project associations
Project.belongsTo(User, { as: 'client', foreignKey: 'clientId' })
Project.belongsTo(User, { as: 'projectLead', foreignKey: 'projectLeadId' })
Project.belongsTo(User, { as: 'designer', foreignKey: 'designerId' })
Project.hasMany(Task, { as: 'tasks', foreignKey: 'projectId', onDelete: 'CASCADE' })
Project.hasMany(Document, { as: 'documents', foreignKey: 'projectId', onDelete: 'CASCADE' })
Project.hasMany(Invoice, { as: 'invoices', foreignKey: 'projectId', onDelete: 'CASCADE' })
Project.hasMany(Payment, { as: 'payments', foreignKey: 'projectId', onDelete: 'CASCADE' })
Project.hasMany(Compliance, { as: 'compliances', foreignKey: 'projectId', onDelete: 'CASCADE' })

// Task associations
Task.belongsTo(Project, { as: 'project', foreignKey: 'projectId' })
Task.belongsTo(User, { as: 'assignee', foreignKey: 'assigneeId' })
Task.belongsTo(User, { as: 'reporter', foreignKey: 'reporterId' })
Task.belongsTo(Task, { as: 'parentTask', foreignKey: 'parentTaskId' })
Task.hasMany(Task, { as: 'subtasks', foreignKey: 'parentTaskId' })

// Document associations
Document.belongsTo(Project, { as: 'project', foreignKey: 'projectId' })
Document.belongsTo(User, { as: 'user', foreignKey: 'userId' })
Document.belongsTo(Document, { as: 'parent', foreignKey: 'parentId' })
Document.hasMany(Document, { as: 'children', foreignKey: 'parentId' })

// Invoice associations
Invoice.belongsTo(Project, { as: 'project', foreignKey: 'projectId' })
Invoice.belongsTo(User, { as: 'client', foreignKey: 'clientId' })
Invoice.belongsTo(User, { as: 'issuer', foreignKey: 'issuedBy' })
Invoice.hasMany(Payment, { as: 'payments', foreignKey: 'invoiceId' })

// Payment associations
Payment.belongsTo(Invoice, { as: 'invoice', foreignKey: 'invoiceId' })
Payment.belongsTo(Project, { as: 'project', foreignKey: 'projectId' })
Payment.belongsTo(User, { as: 'payer', foreignKey: 'payerId' })
Payment.belongsTo(User, { as: 'receiver', foreignKey: 'receiverId' })

// Compliance associations
Compliance.belongsTo(Project, { as: 'project', foreignKey: 'projectId' })
Compliance.belongsTo(User, { as: 'submitter', foreignKey: 'submittedBy' })
Compliance.belongsTo(User, { as: 'reviewer', foreignKey: 'reviewedBy' })
Compliance.belongsTo(User, { as: 'approver', foreignKey: 'approvedBy' })

// Notification associations
Notification.belongsTo(User, { as: 'recipient', foreignKey: 'recipientId' })
Notification.belongsTo(User, { as: 'sender', foreignKey: 'senderId' })

// Quotation associations
Quotation.belongsTo(Project, { as: 'project', foreignKey: 'project_id' })
Quotation.belongsTo(User, { as: 'client', foreignKey: 'client_id' })
Quotation.belongsTo(User, { as: 'preparedBy', foreignKey: 'prepared_by' })
Quotation.belongsTo(User, { as: 'approvedByUser', foreignKey: 'approved_by' })
Quotation.hasMany(QuotationItem, { as: 'items', foreignKey: 'quotation_id', onDelete: 'CASCADE' })
Project.hasMany(Quotation, { as: 'quotations', foreignKey: 'project_id', onDelete: 'CASCADE' })
User.hasMany(Quotation, { as: 'clientQuotations', foreignKey: 'client_id' })
User.hasMany(Quotation, { as: 'preparedQuotations', foreignKey: 'prepared_by' })

// QuotationItem associations
QuotationItem.belongsTo(Quotation, { as: 'quotation', foreignKey: 'quotation_id' })

// ItemLibrary associations
ItemLibrary.belongsTo(User, { as: 'creator', foreignKey: 'created_by' })
User.hasMany(ItemLibrary, { as: 'itemLibraryEntries', foreignKey: 'created_by' })

// DesignBrief associations
DesignBrief.belongsTo(Project, { as: 'project', foreignKey: 'project_id' })
DesignBrief.belongsTo(User, { as: 'client', foreignKey: 'client_id' })
DesignBrief.belongsTo(User, { as: 'submittedBy', foreignKey: 'submitted_by' })
DesignBrief.belongsTo(User, { as: 'reviewedBy', foreignKey: 'reviewed_by' })
DesignBrief.belongsTo(User, { as: 'approvedBy', foreignKey: 'approved_by' })
Project.hasMany(DesignBrief, { as: 'designBriefs', foreignKey: 'project_id', onDelete: 'CASCADE' })
User.hasMany(DesignBrief, { as: 'clientDesignBriefs', foreignKey: 'client_id' })
User.hasMany(DesignBrief, { as: 'submittedDesignBriefs', foreignKey: 'submitted_by' })

export { User, Project, Task, Document, Invoice, Payment, Compliance, Notification, Quotation, QuotationItem, ItemLibrary, DesignBrief }