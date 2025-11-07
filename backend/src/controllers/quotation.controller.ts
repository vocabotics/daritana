import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import Quotation from '../models/Quotation';
import QuotationItem from '../models/QuotationItem';
import ItemLibrary from '../models/ItemLibrary';
import User from '../models/User';
import Project from '../models/Project';
import sequelize from '../database/connection';
import { PDFService } from '../services/pdfService';

// Helper function to generate quotation number
const generateQuotationNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Find the latest quotation number for this month
  const latestQuotation = await Quotation.findOne({
    where: {
      quotation_number: {
        [Op.like]: `Q${year}${month}%`
      }
    },
    order: [['quotation_number', 'DESC']]
  });

  let sequence = 1;
  if (latestQuotation) {
    const lastNumber = latestQuotation.quotation_number;
    const lastSequence = parseInt(lastNumber.slice(-4));
    sequence = lastSequence + 1;
  }

  return `Q${year}${month}${String(sequence).padStart(4, '0')}`;
};

// Calculate SST (Sales and Service Tax) for Malaysian tax compliance
const calculateSST = (amount: number, sstRate: number = 8): { sstAmount: number; totalWithSST: number } => {
  const sstAmount = amount * (sstRate / 100);
  const totalWithSST = amount + sstAmount;
  return { sstAmount, totalWithSST };
};

export const createQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      project_id,
      client_id,
      valid_until,
      items,
      discount_percentage,
      discount_amount,
      terms_and_conditions,
      payment_terms,
      notes
    } = req.body;

    // Generate quotation number
    const quotation_number = await generateQuotationNumber();

    // Calculate totals
    let subtotal = 0;
    let totalSSTAmount = 0;

    // Process items to calculate subtotal and SST
    const processedItems = items.map((item: any) => {
      const itemTotal = item.quantity * item.unit_price;
      const discountedPrice = discount_percentage 
        ? itemTotal * (1 - discount_percentage / 100)
        : itemTotal - (item.discount_amount || 0);
      
      const { sstAmount } = calculateSST(discountedPrice, item.sst_rate || 8);
      
      subtotal += discountedPrice;
      totalSSTAmount += sstAmount;

      return {
        ...item,
        total_price: discountedPrice,
        sst_amount: sstAmount
      };
    });

    // Apply global discount if specified
    if (discount_amount && discount_amount > 0) {
      subtotal = subtotal - discount_amount;
    } else if (discount_percentage && discount_percentage > 0) {
      subtotal = subtotal * (1 - discount_percentage / 100);
    }

    const total_amount = subtotal + totalSSTAmount;

    // Create quotation
    const quotation = await Quotation.create({
      quotation_number,
      project_id,
      client_id,
      prepared_by: (req as any).user.id,
      status: 'draft',
      valid_until,
      subtotal,
      sst_amount: totalSSTAmount,
      total_amount,
      discount_amount,
      discount_percentage,
      terms_and_conditions,
      payment_terms,
      notes,
      revision_number: 0
    }, { transaction });

    // Create quotation items
    const quotationItems = await Promise.all(
      processedItems.map((item: any, index: number) =>
        QuotationItem.create({
          quotation_id: quotation.id,
          item_code: item.item_code,
          description: item.description,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total_price: item.total_price,
          sst_rate: item.sst_rate || 8,
          sst_amount: item.sst_amount,
          discount_amount: item.discount_amount,
          discount_percentage: item.discount_percentage,
          notes: item.notes,
          sort_order: index,
          is_optional: item.is_optional || false
        }, { transaction })
      )
    );

    await transaction.commit();

    // Fetch complete quotation with items
    const completeQuotation = await Quotation.findByPk(quotation.id, {
      include: [
        { model: QuotationItem, as: 'items', order: [['sort_order', 'ASC']] },
        { model: User, as: 'client', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: User, as: 'preparedBy', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'projectCode'] }
      ]
    });

    res.status(201).json({
      success: true,
      data: completeQuotation
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

export const getQuotations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { project_id, client_id, status, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause: any = {};
    if (project_id) whereClause.project_id = project_id;
    if (client_id) whereClause.client_id = client_id;
    if (status) whereClause.status = status;

    const { count, rows } = await Quotation.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'client', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: User, as: 'preparedBy', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'projectCode'] }
      ],
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getQuotationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const quotation = await Quotation.findByPk(id, {
      include: [
        { model: QuotationItem, as: 'items', order: [['sort_order', 'ASC']] },
        { model: User, as: 'client', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: User, as: 'preparedBy', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: User, as: 'approvedByUser', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: Project, as: 'project' }
      ]
    });

    if (!quotation) {
      res.status(404).json({
        success: false,
        error: 'Quotation not found'
      });
      return;
    }

    // Mark as viewed if sent to client
    if (quotation.status === 'sent' && !quotation.viewed_at) {
      await quotation.update({ viewed_at: new Date() });
    }

    res.json({
      success: true,
      data: quotation
    });
  } catch (error) {
    next(error);
  }
};

export const updateQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const updates = req.body;

    const quotation = await Quotation.findByPk(id);
    if (!quotation) {
      await transaction.rollback();
      res.status(404).json({
        success: false,
        error: 'Quotation not found'
      });
      return;
    }

    // If items are being updated, recalculate totals
    if (updates.items) {
      // Delete existing items
      await QuotationItem.destroy({
        where: { quotation_id: id },
        transaction
      });

      // Calculate new totals
      let subtotal = 0;
      let totalSSTAmount = 0;

      const processedItems = updates.items.map((item: any) => {
        const itemTotal = item.quantity * item.unit_price;
        const discountedPrice = updates.discount_percentage 
          ? itemTotal * (1 - updates.discount_percentage / 100)
          : itemTotal - (item.discount_amount || 0);
        
        const { sstAmount } = calculateSST(discountedPrice, item.sst_rate || 8);
        
        subtotal += discountedPrice;
        totalSSTAmount += sstAmount;

        return {
          ...item,
          total_price: discountedPrice,
          sst_amount: sstAmount
        };
      });

      // Apply global discount
      if (updates.discount_amount && updates.discount_amount > 0) {
        subtotal = subtotal - updates.discount_amount;
      } else if (updates.discount_percentage && updates.discount_percentage > 0) {
        subtotal = subtotal * (1 - updates.discount_percentage / 100);
      }

      updates.subtotal = subtotal;
      updates.sst_amount = totalSSTAmount;
      updates.total_amount = subtotal + totalSSTAmount;

      // Create new items
      await Promise.all(
        processedItems.map((item: any, index: number) =>
          QuotationItem.create({
            quotation_id: id,
            ...item,
            sort_order: index
          }, { transaction })
        )
      );
    }

    // Increment revision number if status is changing from rejected to draft
    if (quotation.status === 'rejected' && updates.status === 'draft') {
      updates.revision_number = quotation.revision_number + 1;
    }

    await quotation.update(updates, { transaction });
    await transaction.commit();

    const updatedQuotation = await Quotation.findByPk(id, {
      include: [
        { model: QuotationItem, as: 'items', order: [['sort_order', 'ASC']] },
        { model: User, as: 'client', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: User, as: 'preparedBy', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'projectCode'] }
      ]
    });

    res.json({
      success: true,
      data: updatedQuotation
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

export const sendQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { email_message } = req.body;

    const quotation = await Quotation.findByPk(id, {
      include: [
        { model: User, as: 'client' }
      ]
    });

    if (!quotation) {
      res.status(404).json({
        success: false,
        error: 'Quotation not found'
      });
      return;
    }

    // Update status to sent
    await quotation.update({
      status: 'sent',
      sent_at: new Date()
    });

    // TODO: Implement email sending logic here
    // This would integrate with SendGrid or another email service

    res.json({
      success: true,
      message: 'Quotation sent successfully',
      data: quotation
    });
  } catch (error) {
    next(error);
  }
};

export const approveQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { approval_notes } = req.body;

    const quotation = await Quotation.findByPk(id);
    if (!quotation) {
      res.status(404).json({
        success: false,
        error: 'Quotation not found'
      });
      return;
    }

    await quotation.update({
      status: 'approved',
      approved_by: (req as any).user.id,
      approved_at: new Date(),
      notes: approval_notes || quotation.notes
    });

    res.json({
      success: true,
      message: 'Quotation approved successfully',
      data: quotation
    });
  } catch (error) {
    next(error);
  }
};

export const rejectQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const quotation = await Quotation.findByPk(id);
    if (!quotation) {
      res.status(404).json({
        success: false,
        error: 'Quotation not found'
      });
      return;
    }

    await quotation.update({
      status: 'rejected',
      rejected_reason: reason
    });

    res.json({
      success: true,
      message: 'Quotation rejected',
      data: quotation
    });
  } catch (error) {
    next(error);
  }
};

export const deleteQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const quotation = await Quotation.findByPk(id);
    if (!quotation) {
      res.status(404).json({
        success: false,
        error: 'Quotation not found'
      });
      return;
    }

    // Only allow deletion of draft quotations
    if (quotation.status !== 'draft') {
      res.status(400).json({
        success: false,
        error: 'Only draft quotations can be deleted'
      });
      return;
    }

    await quotation.destroy();

    res.json({
      success: true,
      message: 'Quotation deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Item Library Controllers
export const getItemLibrary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, search, is_active = true } = req.query;
    
    const whereClause: any = {};
    if (category) whereClause.category = category;
    if (is_active !== undefined) whereClause.is_active = is_active === 'true';
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { item_code: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const items = await ItemLibrary.findAll({
      where: whereClause,
      order: [['category', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    next(error);
  }
};

export const createItemLibraryEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const itemData = {
      ...req.body,
      created_by: (req as any).user.id
    };

    const item = await ItemLibrary.create(itemData);

    res.status(201).json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

export const updateItemLibraryEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const item = await ItemLibrary.findByPk(id);
    if (!item) {
      res.status(404).json({
        success: false,
        error: 'Item not found'
      });
      return;
    }

    await item.update(req.body);

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

export const deleteItemLibraryEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const item = await ItemLibrary.findByPk(id);
    if (!item) {
      res.status(404).json({
        success: false,
        error: 'Item not found'
      });
      return;
    }

    // Soft delete by setting is_active to false
    await item.update({ is_active: false });

    res.json({
      success: true,
      message: 'Item deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const downloadQuotationPDF = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const quotation = await Quotation.findByPk(id);
    if (!quotation) {
      res.status(404).json({
        success: false,
        error: 'Quotation not found'
      });
      return;
    }

    const pdfService = PDFService.getInstance();
    const pdfBuffer = await pdfService.generateQuotationPDF(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${quotation.quotation_number}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};