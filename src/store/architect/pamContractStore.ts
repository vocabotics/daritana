import { create } from 'zustand';
import { PAMContract, PaymentCertificate, Variation, PAMClause, ContractAmendment } from '@/types/architect';
import { pamContractService } from '@/services/architect/pamContract.service';

interface PAMContractStore {
  // State
  contracts: PAMContract[];
  currentContract: PAMContract | null;
  pamClauses: PAMClause[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchContracts: (projectId?: string) => Promise<void>;
  fetchContract: (id: string) => Promise<void>;
  createContract: (contract: Omit<PAMContract, 'id' | 'contractNumber' | 'createdAt' | 'updatedAt'>) => Promise<PAMContract>;
  updateContract: (id: string, updates: Partial<PAMContract>) => Promise<void>;
  createPaymentCertificate: (contractId: string, certificate: Omit<PaymentCertificate, 'id' | 'certificateNumber'>) => Promise<PaymentCertificate>;
  certifyPayment: (contractId: string, certificateId: string, certifiedBy: string) => Promise<void>;
  createVariation: (contractId: string, variation: Omit<Variation, 'id' | 'variationNumber'>) => Promise<Variation>;
  approveVariation: (contractId: string, variationId: string, approvedBy: string) => Promise<void>;
  createAmendment: (contractId: string, amendment: Omit<ContractAmendment, 'id' | 'amendmentNumber'>) => Promise<ContractAmendment>;
  fetchPAMClauses: (version: 'PAM2018' | 'PAM2006') => Promise<void>;
  generateContractDocument: (contractId: string) => Promise<string>;
  clearError: () => void;
}

export const usePAMContractStore = create<PAMContractStore>((set, get) => ({
  // Initial state
  contracts: [],
  currentContract: null,
  pamClauses: [],
  loading: false,
  error: null,

  // Fetch all contracts
  fetchContracts: async (projectId?: string) => {
    set({ loading: true, error: null });
    try {
      const contracts = await pamContractService.getContracts(projectId);
      set({ contracts, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch contracts', loading: false });
      console.error(error);
    }
  },

  // Fetch single contract
  fetchContract: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const contract = await pamContractService.getContract(id);
      set({ currentContract: contract, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch contract', loading: false });
      console.error(error);
    }
  },

  // Create new contract
  createContract: async (contract: Omit<PAMContract, 'id' | 'contractNumber' | 'createdAt' | 'updatedAt'>) => {
    set({ loading: true, error: null });
    try {
      const newContract = await pamContractService.createContract(contract);
      set((state) => ({
        contracts: [newContract, ...state.contracts],
        loading: false,
      }));
      return newContract;
    } catch (error) {
      set({ error: 'Failed to create contract', loading: false });
      console.error(error);
      throw error;
    }
  },

  // Update contract
  updateContract: async (id: string, updates: Partial<PAMContract>) => {
    set({ loading: true, error: null });
    try {
      const updatedContract = await pamContractService.updateContract(id, updates);
      set((state) => ({
        contracts: state.contracts.map(contract => contract.id === id ? updatedContract : contract),
        currentContract: state.currentContract?.id === id ? updatedContract : state.currentContract,
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to update contract', loading: false });
      console.error(error);
    }
  },

  // Create payment certificate
  createPaymentCertificate: async (contractId: string, certificate: Omit<PaymentCertificate, 'id' | 'certificateNumber'>) => {
    set({ loading: true, error: null });
    try {
      const newCertificate = await pamContractService.createPaymentCertificate(contractId, certificate);
      set((state) => {
        const updatedContracts = state.contracts.map(contract => {
          if (contract.id === contractId) {
            return {
              ...contract,
              certificates: [...contract.certificates, newCertificate],
            };
          }
          return contract;
        });

        const updatedCurrentContract = state.currentContract?.id === contractId
          ? { ...state.currentContract, certificates: [...state.currentContract.certificates, newCertificate] }
          : state.currentContract;

        return {
          contracts: updatedContracts,
          currentContract: updatedCurrentContract,
          loading: false,
        };
      });
      return newCertificate;
    } catch (error) {
      set({ error: 'Failed to create payment certificate', loading: false });
      console.error(error);
      throw error;
    }
  },

  // Certify payment
  certifyPayment: async (contractId: string, certificateId: string, certifiedBy: string) => {
    set({ loading: true, error: null });
    try {
      const updatedCertificate = await pamContractService.certifyPayment(contractId, certificateId, certifiedBy);
      set((state) => {
        const updatedContracts = state.contracts.map(contract => {
          if (contract.id === contractId) {
            return {
              ...contract,
              certificates: contract.certificates.map(cert =>
                cert.id === certificateId ? updatedCertificate : cert
              ),
            };
          }
          return contract;
        });

        const updatedCurrentContract = state.currentContract?.id === contractId
          ? {
              ...state.currentContract,
              certificates: state.currentContract.certificates.map(cert =>
                cert.id === certificateId ? updatedCertificate : cert
              ),
            }
          : state.currentContract;

        return {
          contracts: updatedContracts,
          currentContract: updatedCurrentContract,
          loading: false,
        };
      });
    } catch (error) {
      set({ error: 'Failed to certify payment', loading: false });
      console.error(error);
    }
  },

  // Create variation
  createVariation: async (contractId: string, variation: Omit<Variation, 'id' | 'variationNumber'>) => {
    set({ loading: true, error: null });
    try {
      const newVariation = await pamContractService.createVariation(contractId, variation);
      set((state) => {
        const updatedContracts = state.contracts.map(contract => {
          if (contract.id === contractId) {
            return {
              ...contract,
              variations: [...contract.variations, newVariation],
            };
          }
          return contract;
        });

        const updatedCurrentContract = state.currentContract?.id === contractId
          ? { ...state.currentContract, variations: [...state.currentContract.variations, newVariation] }
          : state.currentContract;

        return {
          contracts: updatedContracts,
          currentContract: updatedCurrentContract,
          loading: false,
        };
      });
      return newVariation;
    } catch (error) {
      set({ error: 'Failed to create variation', loading: false });
      console.error(error);
      throw error;
    }
  },

  // Approve variation
  approveVariation: async (contractId: string, variationId: string, approvedBy: string) => {
    set({ loading: true, error: null });
    try {
      const updatedVariation = await pamContractService.approveVariation(contractId, variationId, approvedBy);
      set((state) => {
        const updatedContracts = state.contracts.map(contract => {
          if (contract.id === contractId) {
            return {
              ...contract,
              variations: contract.variations.map(variation =>
                variation.id === variationId ? updatedVariation : variation
              ),
            };
          }
          return contract;
        });

        const updatedCurrentContract = state.currentContract?.id === contractId
          ? {
              ...state.currentContract,
              variations: state.currentContract.variations.map(variation =>
                variation.id === variationId ? updatedVariation : variation
              ),
            }
          : state.currentContract;

        return {
          contracts: updatedContracts,
          currentContract: updatedCurrentContract,
          loading: false,
        };
      });
    } catch (error) {
      set({ error: 'Failed to approve variation', loading: false });
      console.error(error);
    }
  },

  // Create amendment
  createAmendment: async (contractId: string, amendment: Omit<ContractAmendment, 'id' | 'amendmentNumber'>) => {
    set({ loading: true, error: null });
    try {
      const newAmendment = await pamContractService.createAmendment(contractId, amendment);
      set((state) => {
        const updatedContracts = state.contracts.map(contract => {
          if (contract.id === contractId) {
            return {
              ...contract,
              amendments: [...contract.amendments, newAmendment],
            };
          }
          return contract;
        });

        const updatedCurrentContract = state.currentContract?.id === contractId
          ? { ...state.currentContract, amendments: [...state.currentContract.amendments, newAmendment] }
          : state.currentContract;

        return {
          contracts: updatedContracts,
          currentContract: updatedCurrentContract,
          loading: false,
        };
      });
      return newAmendment;
    } catch (error) {
      set({ error: 'Failed to create amendment', loading: false });
      console.error(error);
      throw error;
    }
  },

  // Fetch PAM clauses
  fetchPAMClauses: async (version: 'PAM2018' | 'PAM2006') => {
    try {
      const pamClauses = await pamContractService.getPAMClauses(version);
      set({ pamClauses });
    } catch (error) {
      console.error('Failed to fetch PAM clauses:', error);
    }
  },

  // Generate contract document
  generateContractDocument: async (contractId: string) => {
    set({ loading: true, error: null });
    try {
      const documentUrl = await pamContractService.generateContractDocument(contractId);
      set({ loading: false });
      return documentUrl;
    } catch (error) {
      set({ error: 'Failed to generate contract document', loading: false });
      console.error(error);
      throw error;
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));