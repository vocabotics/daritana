/**
 * PAM CONTRACT SERVICE - PRODUCTION VERSION
 * SECURITY: Uses lib/api.ts for HTTP-Only cookie authentication
 * NO MOCK DATA: All requests go to real backend
 */

import { api } from '@/lib/api';
import { PAMContract, PaymentCertificate, Variation, PAMClause, ContractAmendment } from '@/types/architect';

class PAMContractService {
  /**
   * Fetch all PAM contracts with optional project filter
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async getContracts(projectId?: string): Promise<PAMContract[]> {
    const response = await api.get('/architect/pam-contracts', {
      params: { projectId },
    });
    return response.data.data || [];
  }

  /**
   * Fetch single PAM contract by ID
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async getContract(id: string): Promise<PAMContract | null> {
    const response = await api.get(`/architect/pam-contracts/${id}`);
    return response.data.data;
  }

  /**
   * Create new PAM contract
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async createContract(contract: Omit<PAMContract, 'id' | 'contractNumber' | 'createdAt' | 'updatedAt'>): Promise<PAMContract> {
    const response = await api.post('/architect/pam-contracts', contract);
    return response.data.data;
  }

  /**
   * Update existing PAM contract
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async updateContract(id: string, updates: Partial<PAMContract>): Promise<PAMContract> {
    const response = await api.patch(`/architect/pam-contracts/${id}`, updates);
    return response.data.data;
  }

  /**
   * Add variation to contract
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async addVariation(contractId: string, variation: Omit<Variation, 'id'>): Promise<Variation> {
    const response = await api.post(`/architect/pam-contracts/${contractId}/variations`, variation);
    return response.data.data;
  }

  /**
   * Get all variations for contract
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async getVariations(contractId: string): Promise<Variation[]> {
    const response = await api.get(`/architect/pam-contracts/${contractId}/variations`);
    return response.data.data || [];
  }

  /**
   * Create payment certificate
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async createPaymentCertificate(contractId: string, certificate: Omit<PaymentCertificate, 'id' | 'certificateNumber'>): Promise<PaymentCertificate> {
    const response = await api.post(`/architect/pam-contracts/${contractId}/certificates`, certificate);
    return response.data.data;
  }

  /**
   * Get all payment certificates for contract
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async getPaymentCertificates(contractId: string): Promise<PaymentCertificate[]> {
    const response = await api.get(`/architect/pam-contracts/${contractId}/certificates`);
    return response.data.data || [];
  }

  /**
   * Add contract amendment
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async addAmendment(contractId: string, amendment: Omit<ContractAmendment, 'id'>): Promise<ContractAmendment> {
    const response = await api.post(`/architect/pam-contracts/${contractId}/amendments`, amendment);
    return response.data.data;
  }

  /**
   * Get contract financial summary
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async getFinancialSummary(contractId: string): Promise<{
    originalSum: number;
    approvedVariations: number;
    adjustedSum: number;
    certified: number;
    paid: number;
    retention: number;
    balance: number;
  }> {
    const response = await api.get(`/architect/pam-contracts/${contractId}/financial-summary`);
    return response.data.data;
  }

  /**
   * Upload contract document
   * SECURITY: Uses HTTP-Only cookies via lib/api
   */
  async uploadDocument(contractId: string, file: File, documentType: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    const response = await api.post(
      `/architect/pam-contracts/${contractId}/documents`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data.data.url;
  }
}

export const pamContractService = new PAMContractService();
