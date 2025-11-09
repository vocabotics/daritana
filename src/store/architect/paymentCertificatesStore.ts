/**
 * PAYMENT CERTIFICATES STORE
 * State management for interim and final payment certificates
 */

import { create } from 'zustand';
import { paymentCertificatesService, PaymentCertificate } from '@/services/architect.service';

interface PaymentCertificatesStore {
  certificates: PaymentCertificate[];
  currentCertificate: PaymentCertificate | null;
  loading: boolean;
  error: string | null;

  fetchCertificates: (projectId?: string) => Promise<void>;
  createCertificate: (certificate: Partial<PaymentCertificate>) => Promise<void>;
  updateCertificate: (id: string, updates: Partial<PaymentCertificate>) => Promise<void>;
  clearError: () => void;
}

export const usePaymentCertificatesStore = create<PaymentCertificatesStore>((set) => ({
  certificates: [],
  currentCertificate: null,
  loading: false,
  error: null,

  fetchCertificates: async (projectId?: string) => {
    set({ loading: true, error: null });
    try {
      const response = await paymentCertificatesService.getAll(projectId);
      set({ certificates: response.data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch payment certificates', loading: false });
    }
  },

  createCertificate: async (certificate: Partial<PaymentCertificate>) => {
    set({ loading: true, error: null });
    try {
      const response = await paymentCertificatesService.create(certificate);
      set((state) => ({
        certificates: [response.data, ...state.certificates],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to create payment certificate', loading: false });
    }
  },

  updateCertificate: async (id: string, updates: Partial<PaymentCertificate>) => {
    set({ loading: true, error: null });
    try {
      const response = await paymentCertificatesService.update(id, updates);
      set((state) => ({
        certificates: state.certificates.map((c) => (c.id === id ? response.data : c)),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to update payment certificate', loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
