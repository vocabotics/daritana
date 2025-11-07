import { Router } from 'express';
import {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  sendQuotation,
  approveQuotation,
  rejectQuotation,
  deleteQuotation,
  downloadQuotationPDF,
  getItemLibrary,
  createItemLibraryEntry,
  updateItemLibraryEntry,
  deleteItemLibraryEntry
} from '../controllers/quotation.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Quotation routes
router.post('/quotations', createQuotation);
router.get('/quotations', getQuotations);
router.get('/quotations/:id', getQuotationById);
router.put('/quotations/:id', updateQuotation);
router.post('/quotations/:id/send', sendQuotation);
router.post('/quotations/:id/approve', approveQuotation);
router.post('/quotations/:id/reject', rejectQuotation);
router.get('/quotations/:id/pdf', downloadQuotationPDF);
router.delete('/quotations/:id', deleteQuotation);

// Item Library routes
router.get('/item-library', getItemLibrary);
router.post('/item-library', createItemLibraryEntry);
router.put('/item-library/:id', updateItemLibraryEntry);
router.delete('/item-library/:id', deleteItemLibraryEntry);

export default router;