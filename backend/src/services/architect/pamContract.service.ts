import axios from 'axios';
import { PAMContract, PaymentCertificate, Variation, PAMClause, ContractAmendment } from '@/types/architect';
import { getAuthToken } from '@/utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7001/api';

class PAMContractService {
  private getHeaders() {
    const token = getAuthToken();
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
  }

  async getContracts(projectId?: string): Promise<PAMContract[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/architect/contracts`, {
        headers: this.getHeaders(),
        params: { projectId },
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
      return this.getMockContracts();
    }
  }

  async getContract(id: string): Promise<PAMContract | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/architect/contracts/${id}`, {
        headers: this.getHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch contract:', error);
      const mockContracts = this.getMockContracts();
      return mockContracts.find(contract => contract.id === id) || null;
    }
  }

  async createContract(contract: Omit<PAMContract, 'id' | 'contractNumber' | 'createdAt' | 'updatedAt'>): Promise<PAMContract> {
    try {
      const response = await axios.post(`${API_BASE_URL}/architect/contracts`, contract, {
        headers: this.getHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to create contract:', error);
      return {
        ...contract,
        id: `contract-${Date.now()}`,
        contractNumber: `PAM-${String(Date.now()).slice(-6)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as PAMContract;
    }
  }

  async updateContract(id: string, updates: Partial<PAMContract>): Promise<PAMContract> {
    try {
      const response = await axios.put(`${API_BASE_URL}/architect/contracts/${id}`, updates, {
        headers: this.getHeaders(),
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to update contract:', error);
      throw error;
    }
  }

  async createPaymentCertificate(contractId: string, certificate: Omit<PaymentCertificate, 'id' | 'certificateNumber'>): Promise<PaymentCertificate> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/architect/contracts/${contractId}/certificates`,
        certificate,
        {
          headers: this.getHeaders(),
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to create payment certificate:', error);
      return {
        ...certificate,
        id: `cert-${Date.now()}`,
        certificateNumber: `PC-${String(Date.now()).slice(-4)}`,
      } as PaymentCertificate;
    }
  }

  async certifyPayment(contractId: string, certificateId: string, certifiedBy: string): Promise<PaymentCertificate> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/architect/contracts/${contractId}/certificates/${certificateId}/certify`,
        { certifiedBy },
        {
          headers: this.getHeaders(),
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to certify payment:', error);
      throw error;
    }
  }

  async createVariation(contractId: string, variation: Omit<Variation, 'id' | 'variationNumber'>): Promise<Variation> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/architect/contracts/${contractId}/variations`,
        variation,
        {
          headers: this.getHeaders(),
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to create variation:', error);
      return {
        ...variation,
        id: `var-${Date.now()}`,
        variationNumber: `VO-${String(Date.now()).slice(-4)}`,
      } as Variation;
    }
  }

  async approveVariation(contractId: string, variationId: string, approvedBy: string): Promise<Variation> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/architect/contracts/${contractId}/variations/${variationId}/approve`,
        { approvedBy },
        {
          headers: this.getHeaders(),
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to approve variation:', error);
      throw error;
    }
  }

  async getPAMClauses(version: 'PAM2018' | 'PAM2006'): Promise<PAMClause[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/architect/pam-clauses`, {
        headers: this.getHeaders(),
        params: { version },
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch PAM clauses:', error);
      return this.getMockPAMClauses();
    }
  }

  async generateContractDocument(contractId: string): Promise<string> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/architect/contracts/${contractId}/generate`,
        {},
        {
          headers: this.getHeaders(),
        }
      );
      return response.data.data.documentUrl;
    } catch (error) {
      console.error('Failed to generate contract document:', error);
      return '/documents/contract-sample.pdf';
    }
  }

  async createAmendment(contractId: string, amendment: Omit<ContractAmendment, 'id' | 'amendmentNumber'>): Promise<ContractAmendment> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/architect/contracts/${contractId}/amendments`,
        amendment,
        {
          headers: this.getHeaders(),
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to create amendment:', error);
      return {
        ...amendment,
        id: `amd-${Date.now()}`,
        amendmentNumber: `AMD-${String(Date.now()).slice(-4)}`,
      } as ContractAmendment;
    }
  }

  private getMockContracts(): PAMContract[] {
    return [
      {
        id: 'contract-001',
        projectId: 'proj-001',
        projectName: 'KLCC Tower 3',
        contractNumber: 'PAM-2024-001',
        contractType: 'PAM2018',
        title: 'Main Building Contract - KLCC Tower 3',
        employer: {
          name: 'KLCC Properties Sdn Bhd',
          company: 'KLCC Properties Sdn Bhd',
          address: 'Kuala Lumpur City Centre, 50088 Kuala Lumpur',
          registrationNumber: '123456-K',
        },
        contractor: {
          name: 'Hassan Construction Sdn Bhd',
          company: 'Hassan Construction Sdn Bhd',
          address: 'No. 88, Jalan Ampang, 50450 Kuala Lumpur',
          registrationNumber: '789012-X',
          cidbGrade: 'G7',
        },
        contractSum: 125000000,
        commencementDate: '2024-01-01',
        completionDate: '2025-12-31',
        defectsLiabilityPeriod: 12,
        retentionPercentage: 5,
        liquidatedDamages: 50000,
        performanceBond: {
          amount: 6250000,
          bank: 'Maybank Berhad',
          validUntil: '2026-06-30',
        },
        insurances: [
          {
            id: 'ins-001',
            type: 'contractors_all_risk',
            provider: 'Allianz Malaysia',
            policyNumber: 'CAR-2024-001',
            amount: 125000000,
            validFrom: '2024-01-01',
            validTo: '2026-01-01',
            status: 'active',
          },
          {
            id: 'ins-002',
            type: 'public_liability',
            provider: 'AIG Malaysia',
            policyNumber: 'PL-2024-001',
            amount: 10000000,
            validFrom: '2024-01-01',
            validTo: '2026-01-01',
            status: 'active',
          },
        ],
        variations: [
          {
            id: 'var-001',
            variationNumber: 'VO-001',
            description: 'Additional fire escape staircase',
            reason: 'Client request for enhanced safety',
            amount: 250000,
            status: 'approved',
            approvedBy: 'Datuk Ahmad',
            approvedDate: '2024-01-11',
          },
        ],
        certificates: [
          {
            id: 'cert-001',
            certificateNumber: 'PC-001',
            periodFrom: '2024-01-01',
            periodTo: '2024-01-31',
            workDone: 2500000,
            materials: 500000,
            variations: 0,
            previousCertified: 0,
            currentCertified: 3000000,
            retention: 150000,
            releaseRetention: 0,
            netPayment: 2850000,
            status: 'paid',
            certifiedBy: 'Sarah Lee',
            certifiedDate: '2024-02-05',
            paidDate: '2024-02-15',
          },
        ],
        status: 'active',
        clauses: [],
        amendments: [],
        createdAt: '2023-12-15T10:00:00Z',
        updatedAt: '2024-01-15T14:00:00Z',
      },
      {
        id: 'contract-002',
        projectId: 'proj-002',
        projectName: 'Penang Heritage Hotel',
        contractNumber: 'PAM-2024-002',
        contractType: 'PAM2018',
        title: 'Heritage Restoration Contract',
        employer: {
          name: 'Heritage Hotels Sdn Bhd',
          company: 'Heritage Hotels Sdn Bhd',
          address: 'George Town, 10200 Penang',
          registrationNumber: '456789-P',
        },
        contractor: {
          name: 'Heritage Builders Sdn Bhd',
          company: 'Heritage Builders Sdn Bhd',
          address: 'Butterworth, Penang',
          registrationNumber: '321654-B',
          cidbGrade: 'G5',
        },
        contractSum: 35000000,
        commencementDate: '2023-10-01',
        completionDate: '2024-09-30',
        defectsLiabilityPeriod: 24,
        retentionPercentage: 10,
        liquidatedDamages: 15000,
        performanceBond: {
          amount: 1750000,
          bank: 'CIMB Bank',
          validUntil: '2025-03-31',
        },
        insurances: [
          {
            id: 'ins-003',
            type: 'contractors_all_risk',
            provider: 'Great Eastern',
            policyNumber: 'CAR-2023-002',
            amount: 35000000,
            validFrom: '2023-10-01',
            validTo: '2025-01-01',
            status: 'active',
          },
          {
            id: 'ins-004',
            type: 'professional_indemnity',
            provider: 'Zurich Malaysia',
            policyNumber: 'PI-2023-001',
            amount: 5000000,
            validFrom: '2023-10-01',
            validTo: '2025-01-01',
            status: 'active',
          },
        ],
        variations: [
          {
            id: 'var-002',
            variationNumber: 'VO-002',
            description: 'Additional foundation reinforcement',
            reason: 'Unexpected soil conditions',
            amount: 150000,
            status: 'approved',
            approvedBy: 'Tan Sri Lee',
            approvedDate: '2024-01-08',
          },
        ],
        certificates: [
          {
            id: 'cert-002',
            certificateNumber: 'PC-002',
            periodFrom: '2024-01-01',
            periodTo: '2024-01-31',
            workDone: 1500000,
            materials: 300000,
            variations: 150000,
            previousCertified: 8000000,
            currentCertified: 1950000,
            retention: 195000,
            releaseRetention: 0,
            netPayment: 1755000,
            status: 'certified',
            certifiedBy: 'Dr. Fatimah Ibrahim',
            certifiedDate: '2024-02-03',
          },
        ],
        status: 'active',
        clauses: [],
        amendments: [],
        createdAt: '2023-09-01T09:00:00Z',
        updatedAt: '2024-02-03T16:00:00Z',
      },
    ];
  }

  private getMockPAMClauses(): PAMClause[] {
    return [
      {
        id: 'clause-001',
        clauseNumber: '23.1',
        title: 'Commencement and Completion',
        description: 'The Contractor shall commence the Works on the Commencement Date and shall proceed regularly and diligently with the same and shall complete the Works on or before the Completion Date.',
        category: 'Time',
        mandatory: true,
      },
      {
        id: 'clause-002',
        clauseNumber: '24.1',
        title: 'Extension of Time',
        description: 'If the Contractor is delayed in the completion of the Works by any of the Relevant Events, the Architect shall grant a fair and reasonable extension of time.',
        category: 'Time',
        mandatory: true,
      },
      {
        id: 'clause-003',
        clauseNumber: '30.1',
        title: 'Interim Certificates and Payments',
        description: 'The Architect shall issue Interim Certificates at intervals of not more than one month calculated from the date of commencement of the Works.',
        category: 'Payment',
        mandatory: true,
      },
      {
        id: 'clause-004',
        clauseNumber: '11.1',
        title: 'Variations',
        description: 'The Architect may issue instructions requiring a Variation and the Contractor shall comply with such instruction.',
        category: 'Variations',
        mandatory: true,
      },
      {
        id: 'clause-005',
        clauseNumber: '27.1',
        title: 'Practical Completion',
        description: 'When the Architect is of the opinion that the Works have reached Practical Completion, he shall issue a Certificate of Practical Completion.',
        category: 'Completion',
        mandatory: true,
      },
    ];
  }
}

export const pamContractService = new PAMContractService();