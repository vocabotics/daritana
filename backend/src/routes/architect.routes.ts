import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as architectController from '../controllers/architect.controller';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * ARCHITECT FEATURES ROUTES
 * All 12 Malaysian architect practice management features
 */

// ============================================================
// 1. AUTHORITY SUBMISSIONS (DBKL, MBPJ, MBSA, etc.)
// ============================================================
router.get('/authority-submissions', architectController.getAuthoritySubmissions);
router.post('/authority-submissions', architectController.createAuthoritySubmission);
router.patch('/authority-submissions/:id', architectController.updateAuthoritySubmission);
router.delete('/authority-submissions/:id', architectController.deleteAuthoritySubmission);

// ============================================================
// 2. CCC APPLICATIONS (Certificate of Completion & Compliance)
// ============================================================
router.get('/ccc-applications', architectController.getCCCApplications);
router.post('/ccc-applications', architectController.createCCCApplication);
router.patch('/ccc-applications/:id', architectController.updateCCCApplication);

// ============================================================
// 3. CHANGE ORDERS (Variations & Change Requests)
// ============================================================
router.get('/change-orders', architectController.getChangeOrders);
router.post('/change-orders', architectController.createChangeOrder);
router.patch('/change-orders/:id', architectController.updateChangeOrder);

// ============================================================
// 4. DEFECTS LIABILITY PERIOD (DLP) TRACKING
// ============================================================
router.get('/dlp-records', architectController.getDLPRecords);
router.post('/dlp-records', architectController.createDLPRecord);
router.patch('/dlp-records/:id', architectController.updateDLPRecord);

// ============================================================
// 5. DRAWING MANAGEMENT
// ============================================================
router.get('/drawings', architectController.getDrawings);
router.post('/drawings', architectController.createDrawing);
router.patch('/drawings/:id', architectController.updateDrawing);

// ============================================================
// 6. MEETING MINUTES
// ============================================================
router.get('/meeting-minutes', architectController.getMeetingMinutes);
router.post('/meeting-minutes', architectController.createMeetingMinute);
router.patch('/meeting-minutes/:id', architectController.updateMeetingMinute);

// ============================================================
// 7. PAM CONTRACT ADMINISTRATION
// ============================================================
router.get('/pam-contracts', architectController.getPAMContracts);
router.post('/pam-contracts', architectController.createPAMContract);
router.patch('/pam-contracts/:id', architectController.updatePAMContract);

// ============================================================
// 8. PAYMENT CERTIFICATES (Interim & Final)
// ============================================================
router.get('/payment-certificates', architectController.getPaymentCertificates);
router.post('/payment-certificates', architectController.createPaymentCertificate);
router.patch('/payment-certificates/:id', architectController.updatePaymentCertificate);

// ============================================================
// 9. PUNCH LIST (SNAGGING LISTS)
// ============================================================
router.get('/punch-lists', architectController.getPunchLists);
router.post('/punch-lists', architectController.createPunchList);
router.patch('/punch-lists/:id', architectController.updatePunchList);

// ============================================================
// 10. RFI (REQUEST FOR INFORMATION)
// ============================================================
router.get('/rfis', architectController.getRFIs);
router.post('/rfis', architectController.createRFI);
router.patch('/rfis/:id', architectController.updateRFI);

// ============================================================
// 11. RETENTION TRACKING (5% Retention Money)
// ============================================================
router.get('/retention-records', architectController.getRetentionRecords);
router.post('/retention-records', architectController.createRetentionRecord);
router.patch('/retention-records/:id', architectController.updateRetentionRecord);

// ============================================================
// 12. SITE INSTRUCTION REGISTER
// ============================================================
router.get('/site-instructions', architectController.getSiteInstructions);
router.post('/site-instructions', architectController.createSiteInstruction);
router.patch('/site-instructions/:id', architectController.updateSiteInstruction);
router.delete('/site-instructions/:id', architectController.deleteSiteInstruction);

export default router;
