import { Request, Response } from 'express';
import { prisma } from '../server';


/**
 * ARCHITECT FEATURES CONTROLLER
 * Handles all 12 architect-specific features for Malaysian architectural practice
 */

// ============================================================
// 1. AUTHORITY SUBMISSIONS (DBKL, MBPJ, MBSA, etc.)
// ============================================================

export const getAuthoritySubmissions = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const organizationId = req.user?.organizationId;

    const where: any = { organizationId };
    if (projectId) where.projectId = projectId;

    const submissions = await prisma.authoritySubmission.findMany({
      where,
      include: {
        project: { select: { name: true, code: true } },
        createdByUser: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { submittedDate: 'desc' },
    });

    res.json({ success: true, data: submissions });
  } catch (error: any) {
    console.error('Error fetching authority submissions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createAuthoritySubmission = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    const submission = await prisma.authoritySubmission.create({
      data: {
        ...req.body,
        organizationId,
        createdById: userId,
      },
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    res.status(201).json({ success: true, data: submission });
  } catch (error: any) {
    console.error('Error creating authority submission:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateAuthoritySubmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    const submission = await prisma.authoritySubmission.update({
      where: { id, organizationId },
      data: req.body,
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    res.json({ success: true, data: submission });
  } catch (error: any) {
    console.error('Error updating authority submission:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteAuthoritySubmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    await prisma.authoritySubmission.delete({
      where: { id, organizationId },
    });

    res.json({ success: true, message: 'Authority submission deleted' });
  } catch (error: any) {
    console.error('Error deleting authority submission:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// 2. CCC APPLICATIONS (Certificate of Completion & Compliance)
// ============================================================

export const getCCCApplications = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const organizationId = req.user?.organizationId;

    const where: any = { organizationId };
    if (projectId) where.projectId = projectId;

    const applications = await prisma.cCCApplication.findMany({
      where,
      include: {
        project: { select: { name: true, code: true } },
        createdByUser: { select: { firstName: true, lastName: true } },
      },
      orderBy: { applicationDate: 'desc' },
    });

    res.json({ success: true, data: applications });
  } catch (error: any) {
    console.error('Error fetching CCC applications:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createCCCApplication = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    const application = await prisma.cCCApplication.create({
      data: {
        ...req.body,
        organizationId,
        createdById: userId,
      },
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    res.status(201).json({ success: true, data: application });
  } catch (error: any) {
    console.error('Error creating CCC application:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCCCApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    const application = await prisma.cCCApplication.update({
      where: { id, organizationId },
      data: req.body,
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    res.json({ success: true, data: application });
  } catch (error: any) {
    console.error('Error updating CCC application:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// 3. CHANGE ORDERS (Variations & Change Requests)
// ============================================================

export const getChangeOrders = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const organizationId = req.user?.organizationId;

    const where: any = { organizationId };
    if (projectId) where.projectId = projectId;

    const changeOrders = await prisma.changeOrder.findMany({
      where,
      include: {
        project: { select: { name: true, code: true } },
        requestedByUser: { select: { firstName: true, lastName: true } },
        approvedByUser: { select: { firstName: true, lastName: true } },
      },
      orderBy: { requestDate: 'desc' },
    });

    res.json({ success: true, data: changeOrders });
  } catch (error: any) {
    console.error('Error fetching change orders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createChangeOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    const changeOrder = await prisma.changeOrder.create({
      data: {
        ...req.body,
        organizationId,
        requestedById: userId,
      },
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    res.status(201).json({ success: true, data: changeOrder });
  } catch (error: any) {
    console.error('Error creating change order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateChangeOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    const changeOrder = await prisma.changeOrder.update({
      where: { id, organizationId },
      data: req.body,
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    res.json({ success: true, data: changeOrder });
  } catch (error: any) {
    console.error('Error updating change order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// 4. DEFECTS LIABILITY PERIOD (DLP) TRACKING
// ============================================================

export const getDLPRecords = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const organizationId = req.user?.organizationId;

    const where: any = { organizationId };
    if (projectId) where.projectId = projectId;

    const records = await prisma.defectsLiabilityPeriod.findMany({
      where,
      include: {
        project: { select: { name: true, code: true } },
      },
      orderBy: { startDate: 'desc' },
    });

    res.json({ success: true, data: records });
  } catch (error: any) {
    console.error('Error fetching DLP records:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createDLPRecord = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    const record = await prisma.defectsLiabilityPeriod.create({
      data: {
        ...req.body,
        organizationId,
        createdById: userId,
      },
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    res.status(201).json({ success: true, data: record });
  } catch (error: any) {
    console.error('Error creating DLP record:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateDLPRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    const record = await prisma.defectsLiabilityPeriod.update({
      where: { id, organizationId },
      data: req.body,
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    res.json({ success: true, data: record });
  } catch (error: any) {
    console.error('Error updating DLP record:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// 5. DRAWING MANAGEMENT
// ============================================================

export const getDrawings = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const organizationId = req.user?.organizationId;

    const where: any = { organizationId };
    if (projectId) where.projectId = projectId;

    const drawings = await prisma.drawing.findMany({
      where,
      include: {
        project: { select: { name: true, code: true } },
        preparedByUser: { select: { firstName: true, lastName: true } },
        checkedByUser: { select: { firstName: true, lastName: true } },
        approvedByUser: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ drawingNo: 'asc' }, { revision: 'desc' }],
    });

    res.json({ success: true, data: drawings });
  } catch (error: any) {
    console.error('Error fetching drawings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createDrawing = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    const drawing = await prisma.drawing.create({
      data: {
        ...req.body,
        organizationId,
        preparedById: userId,
      },
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    res.status(201).json({ success: true, data: drawing });
  } catch (error: any) {
    console.error('Error creating drawing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateDrawing = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    const drawing = await prisma.drawing.update({
      where: { id, organizationId },
      data: req.body,
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    res.json({ success: true, data: drawing });
  } catch (error: any) {
    console.error('Error updating drawing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// 6. MEETING MINUTES
// ============================================================

export const getMeetingMinutes = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const organizationId = req.user?.organizationId;

    const where: any = { organizationId };
    if (projectId) where.projectId = projectId;

    const minutes = await prisma.meetingMinute.findMany({
      where,
      include: {
        project: { select: { name: true, code: true } },
        preparedByUser: { select: { firstName: true, lastName: true } },
      },
      orderBy: { meetingDate: 'desc' },
    });

    res.json({ success: true, data: minutes });
  } catch (error: any) {
    console.error('Error fetching meeting minutes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createMeetingMinute = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    const minute = await prisma.meetingMinute.create({
      data: {
        ...req.body,
        organizationId,
        preparedById: userId,
      },
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    res.status(201).json({ success: true, data: minute });
  } catch (error: any) {
    console.error('Error creating meeting minute:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateMeetingMinute = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    const minute = await prisma.meetingMinute.update({
      where: { id, organizationId },
      data: req.body,
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    res.json({ success: true, data: minute });
  } catch (error: any) {
    console.error('Error updating meeting minute:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// 7. PAM CONTRACT ADMINISTRATION
// ============================================================

export const getPAMContracts = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const organizationId = req.user?.organizationId;

    const where: any = { organizationId };
    if (projectId) where.projectId = projectId;

    const contracts = await prisma.pAMContract.findMany({
      where,
      include: {
        project: { select: { name: true, code: true } },
      },
      orderBy: { contractDate: 'desc' },
    });

    res.json({ success: true, data: contracts });
  } catch (error: any) {
    console.error('Error fetching PAM contracts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createPAMContract = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    const contract = await prisma.pAMContract.create({
      data: {
        ...req.body,
        organizationId,
        createdById: userId,
      },
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    res.status(201).json({ success: true, data: contract });
  } catch (error: any) {
    console.error('Error creating PAM contract:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updatePAMContract = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    const contract = await prisma.pAMContract.update({
      where: { id, organizationId },
      data: req.body,
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    res.json({ success: true, data: contract });
  } catch (error: any) {
    console.error('Error updating PAM contract:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// 8. PAYMENT CERTIFICATES (Interim & Final)
// ============================================================

export const getPaymentCertificates = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const organizationId = req.user?.organizationId;

    const where: any = { organizationId };
    if (projectId) where.projectId = projectId;

    const certificates = await prisma.paymentCertificate.findMany({
      where,
      include: {
        project: { select: { name: true, code: true } },
        preparedByUser: { select: { firstName: true, lastName: true } },
        approvedByUser: { select: { firstName: true, lastName: true } },
      },
      orderBy: { certificateNo: 'desc' },
    });

    res.json({ success: true, data: certificates });
  } catch (error: any) {
    console.error('Error fetching payment certificates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createPaymentCertificate = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    const certificate = await prisma.paymentCertificate.create({
      data: {
        ...req.body,
        organizationId,
        preparedById: userId,
      },
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    res.status(201).json({ success: true, data: certificate });
  } catch (error: any) {
    console.error('Error creating payment certificate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updatePaymentCertificate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    const certificate = await prisma.paymentCertificate.update({
      where: { id, organizationId },
      data: req.body,
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    res.json({ success: true, data: certificate });
  } catch (error: any) {
    console.error('Error updating payment certificate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// 9. PUNCH LIST (SNAGGING LISTS)
// ============================================================

export const getPunchLists = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const organizationId = req.user?.organizationId;

    const where: any = { organizationId };
    if (projectId) where.projectId = projectId;

    const punchLists = await prisma.punchList.findMany({
      where,
      include: {
        project: { select: { name: true, code: true } },
        createdByUser: { select: { firstName: true, lastName: true } },
      },
      orderBy: { inspectionDate: 'desc' },
    });

    res.json({ success: true, data: punchLists });
  } catch (error: any) {
    console.error('Error fetching punch lists:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createPunchList = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    const punchList = await prisma.punchList.create({
      data: {
        ...req.body,
        organizationId,
        createdById: userId,
      },
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    res.status(201).json({ success: true, data: punchList });
  } catch (error: any) {
    console.error('Error creating punch list:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updatePunchList = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    const punchList = await prisma.punchList.update({
      where: { id, organizationId },
      data: req.body,
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    res.json({ success: true, data: punchList });
  } catch (error: any) {
    console.error('Error updating punch list:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// 10. RFI (REQUEST FOR INFORMATION)
// ============================================================

export const getRFIs = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const organizationId = req.user?.organizationId;

    const where: any = { organizationId };
    if (projectId) where.projectId = projectId;

    const rfis = await prisma.rFI.findMany({
      where,
      include: {
        project: { select: { name: true, code: true } },
        raisedByUser: { select: { firstName: true, lastName: true } },
        respondedByUser: { select: { firstName: true, lastName: true } },
      },
      orderBy: { raisedDate: 'desc' },
    });

    res.json({ success: true, data: rfis });
  } catch (error: any) {
    console.error('Error fetching RFIs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createRFI = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    const rfi = await prisma.rFI.create({
      data: {
        ...req.body,
        organizationId,
        raisedById: userId,
      },
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    res.status(201).json({ success: true, data: rfi });
  } catch (error: any) {
    console.error('Error creating RFI:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateRFI = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    const rfi = await prisma.rFI.update({
      where: { id, organizationId },
      data: req.body,
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    res.json({ success: true, data: rfi });
  } catch (error: any) {
    console.error('Error updating RFI:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// 11. RETENTION TRACKING (5% Retention Money)
// ============================================================

export const getRetentionRecords = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const organizationId = req.user?.organizationId;

    const where: any = { organizationId };
    if (projectId) where.projectId = projectId;

    const records = await prisma.retentionRecord.findMany({
      where,
      include: {
        project: { select: { name: true, code: true } },
      },
      orderBy: { retentionDate: 'desc' },
    });

    res.json({ success: true, data: records });
  } catch (error: any) {
    console.error('Error fetching retention records:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createRetentionRecord = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    const record = await prisma.retentionRecord.create({
      data: {
        ...req.body,
        organizationId,
        createdById: userId,
      },
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    res.status(201).json({ success: true, data: record });
  } catch (error: any) {
    console.error('Error creating retention record:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateRetentionRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    const record = await prisma.retentionRecord.update({
      where: { id, organizationId },
      data: req.body,
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    res.json({ success: true, data: record });
  } catch (error: any) {
    console.error('Error updating retention record:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// 12. SITE INSTRUCTION REGISTER
// ============================================================

export const getSiteInstructions = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const organizationId = req.user?.organizationId;

    const where: any = { organizationId };
    if (projectId) where.projectId = projectId;

    const instructions = await prisma.siteInstruction.findMany({
      where,
      include: {
        project: { select: { name: true, code: true } },
        issuedByUser: { select: { firstName: true, lastName: true } },
      },
      orderBy: { instructionNo: 'desc' },
    });

    res.json({ success: true, data: instructions });
  } catch (error: any) {
    console.error('Error fetching site instructions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createSiteInstruction = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;

    const instruction = await prisma.siteInstruction.create({
      data: {
        ...req.body,
        organizationId,
        issuedById: userId,
      },
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    res.status(201).json({ success: true, data: instruction });
  } catch (error: any) {
    console.error('Error creating site instruction:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateSiteInstruction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    const instruction = await prisma.siteInstruction.update({
      where: { id, organizationId },
      data: req.body,
      include: {
        project: { select: { name: true, code: true } },
      },
    });

    res.json({ success: true, data: instruction });
  } catch (error: any) {
    console.error('Error updating site instruction:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteSiteInstruction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;

    await prisma.siteInstruction.delete({
      where: { id, organizationId },
    });

    res.json({ success: true, message: 'Site instruction deleted' });
  } catch (error: any) {
    console.error('Error deleting site instruction:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
