// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7001';
export const API_BASE_URL = `${API_URL}/api`;
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:7001';

// Environment
export const IS_DEVELOPMENT = import.meta.env.DEV;
export const IS_PRODUCTION = import.meta.env.PROD;

// App Configuration
export const APP_NAME = 'Daritana Architect Management';
export const APP_VERSION = '1.0.0';

// Default Settings
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_DEBOUNCE_DELAY = 300;

// File Upload Configuration
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'model/gltf-binary',
  'model/gltf+json',
  'application/octet-stream', // For .glb files
];

// Malaysian States
export const MALAYSIAN_STATES = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Kuala Lumpur',
  'Labuan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Penang',
  'Perak',
  'Perlis',
  'Putrajaya',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu',
];

// Malaysian Authorities
export const MALAYSIAN_AUTHORITIES = {
  FEDERAL: [
    { code: 'JKR', name: 'Jabatan Kerja Raya', jurisdiction: 'Federal' },
    { code: 'BOMBA', name: 'Jabatan Bomba dan Penyelamat Malaysia', jurisdiction: 'Federal' },
    { code: 'DOE', name: 'Department of Environment', jurisdiction: 'Federal' },
    { code: 'DOSH', name: 'Department of Occupational Safety and Health', jurisdiction: 'Federal' },
    { code: 'TNB', name: 'Tenaga Nasional Berhad', jurisdiction: 'Federal' },
    { code: 'IWK', name: 'Indah Water Konsortium', jurisdiction: 'Federal' },
    { code: 'SPAN', name: 'Suruhanjaya Perkhidmatan Air Negara', jurisdiction: 'Federal' },
  ],
  LOCAL: [
    { code: 'DBKL', name: 'Dewan Bandaraya Kuala Lumpur', jurisdiction: 'Local', state: 'Kuala Lumpur' },
    { code: 'MBPJ', name: 'Majlis Bandaraya Petaling Jaya', jurisdiction: 'Local', state: 'Selangor' },
    { code: 'MPSJ', name: 'Majlis Perbandaran Subang Jaya', jurisdiction: 'Local', state: 'Selangor' },
    { code: 'MPK', name: 'Majlis Perbandaran Kajang', jurisdiction: 'Local', state: 'Selangor' },
    { code: 'MPAJ', name: 'Majlis Perbandaran Ampang Jaya', jurisdiction: 'Local', state: 'Selangor' },
    { code: 'MBSA', name: 'Majlis Bandaraya Shah Alam', jurisdiction: 'Local', state: 'Selangor' },
    { code: 'MPPP', name: 'Majlis Perbandaran Pulau Pinang', jurisdiction: 'Local', state: 'Penang' },
    { code: 'MBIP', name: 'Majlis Bandaraya Ipoh', jurisdiction: 'Local', state: 'Perak' },
    { code: 'MBJB', name: 'Majlis Bandaraya Johor Bahru', jurisdiction: 'Local', state: 'Johor' },
    { code: 'MBMB', name: 'Majlis Bandaraya Melaka Bersejarah', jurisdiction: 'Local', state: 'Melaka' },
  ],
};

// Export all config
export default {
  API_URL,
  API_BASE_URL,
  WS_URL,
  IS_DEVELOPMENT,
  IS_PRODUCTION,
  APP_NAME,
  APP_VERSION,
  DEFAULT_PAGE_SIZE,
  DEFAULT_DEBOUNCE_DELAY,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  MALAYSIAN_STATES,
  MALAYSIAN_AUTHORITIES,
};