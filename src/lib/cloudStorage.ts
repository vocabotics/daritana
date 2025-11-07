import { 
  PublicClientApplication, 
  InteractionRequiredAuthError,
  AccountInfo 
} from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';
import { api } from './api';

// Microsoft Graph API Configuration
const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || 'your-client-id',
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false
  }
};

const msalInstance = new PublicClientApplication(msalConfig);

// Google Drive API Configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id';
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || 'your-api-key';
const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/drive.file';

export interface CloudFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
  modifiedAt: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
  webUrl?: string;
  provider: 'google' | 'microsoft' | 'local';
  filePath?: string;
  fileName?: string;
}

export class CloudStorageService {
  private msGraphClient: Client | null = null;
  private googleAuth: any = null;
  private isGoogleApiLoaded = false;

  // Initialize Microsoft Graph client
  async initMicrosoftGraph(): Promise<boolean> {
    try {
      await msalInstance.initialize();
      
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length === 0) {
        // No accounts, need to login
        return false;
      }

      const silentRequest = {
        scopes: ['Files.ReadWrite', 'User.Read'],
        account: accounts[0]
      };

      const response = await msalInstance.acquireTokenSilent(silentRequest);
      
      this.msGraphClient = Client.init({
        authProvider: (done) => {
          done(null, response.accessToken);
        }
      });

      return true;
    } catch (error) {
      console.error('Microsoft Graph initialization failed:', error);
      return false;
    }
  }

  // Microsoft Authentication
  async loginMicrosoft(): Promise<boolean> {
    try {
      // Check if API credentials are properly configured
      const clientId = import.meta.env.VITE_AZURE_CLIENT_ID || 'your-client-id';
      if (clientId === 'your-client-id') {
        console.warn('Microsoft OneDrive integration not configured - using placeholder credentials');
        return false;
      }

      const loginRequest = {
        scopes: ['Files.ReadWrite', 'User.Read']
      };

      const response = await msalInstance.loginPopup(loginRequest);
      
      if (response) {
        this.msGraphClient = Client.init({
          authProvider: (done) => {
            done(null, response.accessToken);
          }
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Microsoft login failed:', error);
      if (error?.errorCode?.includes('user_cancelled')) {
        console.warn('Microsoft login cancelled by user');
      }
      return false;
    }
  }

  // Load Google API
  async loadGoogleApi(): Promise<void> {
    if (this.isGoogleApiLoaded) return;

    // Check if API credentials are configured
    if (GOOGLE_CLIENT_ID === 'your-google-client-id' || GOOGLE_API_KEY === 'your-api-key') {
      throw new Error('Google Drive API credentials not configured');
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        (window as any).gapi.load('client:auth2', async () => {
          try {
            await (window as any).gapi.client.init({
              apiKey: GOOGLE_API_KEY,
              clientId: GOOGLE_CLIENT_ID,
              scope: GOOGLE_SCOPES,
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
            });
            this.googleAuth = (window as any).gapi.auth2.getAuthInstance();
            this.isGoogleApiLoaded = true;
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      };
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.body.appendChild(script);
    });
  }

  // Google Authentication
  async loginGoogle(): Promise<boolean> {
    try {
      // Check if API credentials are properly configured
      if (GOOGLE_CLIENT_ID === 'your-google-client-id' || GOOGLE_API_KEY === 'your-api-key') {
        console.warn('Google Drive integration not configured - using placeholder credentials');
        return false;
      }

      await this.loadGoogleApi();
      
      if (!this.googleAuth.isSignedIn.get()) {
        await this.googleAuth.signIn();
      }
      
      return this.googleAuth.isSignedIn.get();
    } catch (error) {
      console.error('Google login failed:', error);
      if (error?.error === 'idpiframe_initialization_failed') {
        console.warn('Google OAuth not configured for this domain. Please add http://localhost:8080 to your Google OAuth settings.');
      }
      return false;
    }
  }

  // Upload file to server (local storage)
  async uploadToLocalServer(file: File, projectId?: string): Promise<CloudFile | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (projectId) {
        formData.append('projectId', projectId);
      }
      formData.append('type', 'document');
      formData.append('isPublic', 'false');
      
      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data && response.data.document) {
        const doc = response.data.document;
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
        
        return {
          id: doc.id,
          name: doc.name,
          size: doc.fileSize,
          mimeType: doc.mimeType,
          createdAt: doc.createdAt,
          modifiedAt: doc.updatedAt,
          downloadUrl: `${baseUrl}/api/files/${doc.id}/download`,
          provider: 'local',
          filePath: doc.filePath,
          fileName: doc.fileName
        };
      }
      return null;
    } catch (error) {
      console.error('Server upload failed:', error);
      return null;
    }
  }
  
  // List files from server
  async listServerFiles(projectId?: string): Promise<CloudFile[]> {
    try {
      const params: any = {};
      if (projectId) {
        params.projectId = projectId;
      }
      
      const response = await api.get('/documents', { params });
      
      if (response.data && response.data.documents) {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
        
        return response.data.documents.map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          size: doc.fileSize,
          mimeType: doc.mimeType,
          createdAt: doc.createdAt,
          modifiedAt: doc.updatedAt,
          downloadUrl: `${baseUrl}/api/files/${doc.id}/download`,
          provider: 'local' as const,
          filePath: doc.filePath,
          fileName: doc.fileName
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to list server files:', error);
      return [];
    }
  }
  
  // Download file from server
  async downloadFromServer(fileId: string): Promise<Blob | null> {
    try {
      const response = await api.get(`/files/${fileId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to download from server:', error);
      return null;
    }
  }
  
  // Delete file from server
  async deleteFromServer(fileId: string): Promise<boolean> {
    try {
      await api.delete(`/files/${fileId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete from server:', error);
      return false;
    }
  }
  
  // Upload file to OneDrive
  async uploadToOneDrive(file: File, folderPath: string = '/Daritana'): Promise<CloudFile | null> {
    if (!this.msGraphClient) {
      const success = await this.loginMicrosoft();
      if (!success) return null;
    }

    try {
      const fileName = file.name;
      const content = await this.fileToArrayBuffer(file);

      // Create folder if it doesn't exist
      try {
        await this.msGraphClient!
          .api('/me/drive/root/children')
          .post({
            name: 'Daritana',
            folder: {},
            '@microsoft.graph.conflictBehavior': 'rename'
          });
      } catch (e) {
        // Folder might already exist
      }

      // Upload file
      const uploadPath = `/me/drive/root:${folderPath}/${fileName}:/content`;
      const response = await this.msGraphClient!
        .api(uploadPath)
        .put(content);

      return {
        id: response.id,
        name: response.name,
        size: response.size,
        mimeType: response.file?.mimeType || file.type,
        createdAt: response.createdDateTime,
        modifiedAt: response.lastModifiedDateTime,
        downloadUrl: response['@microsoft.graph.downloadUrl'],
        webUrl: response.webUrl,
        provider: 'microsoft'
      };
    } catch (error) {
      console.error('OneDrive upload failed:', error);
      return null;
    }
  }

  // Upload file to Google Drive
  async uploadToGoogleDrive(file: File, folderId?: string): Promise<CloudFile | null> {
    try {
      await this.loadGoogleApi();
      
      if (!this.googleAuth.isSignedIn.get()) {
        const success = await this.loginGoogle();
        if (!success) return null;
      }

      // Create or get Daritana folder
      if (!folderId) {
        folderId = await this.getOrCreateGoogleFolder('Daritana');
      }

      const metadata = {
        name: file.name,
        mimeType: file.type,
        parents: folderId ? [folderId] : []
      };

      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', file);

      const accessToken = this.googleAuth.currentUser.get().getAuthResponse().access_token;
      
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,mimeType,createdTime,modifiedTime,webViewLink,webContentLink,thumbnailLink', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      const data = await response.json();

      return {
        id: data.id,
        name: data.name,
        size: parseInt(data.size || '0'),
        mimeType: data.mimeType,
        createdAt: data.createdTime,
        modifiedAt: data.modifiedTime,
        thumbnailUrl: data.thumbnailLink,
        downloadUrl: data.webContentLink,
        webUrl: data.webViewLink,
        provider: 'google'
      };
    } catch (error) {
      console.error('Google Drive upload failed:', error);
      return null;
    }
  }

  // Get or create Google Drive folder
  private async getOrCreateGoogleFolder(folderName: string): Promise<string | null> {
    try {
      const gapi = (window as any).gapi;
      
      // Search for existing folder
      const searchResponse = await gapi.client.drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive'
      });

      if (searchResponse.result.files && searchResponse.result.files.length > 0) {
        return searchResponse.result.files[0].id;
      }

      // Create new folder
      const createResponse = await gapi.client.drive.files.create({
        resource: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder'
        },
        fields: 'id'
      });

      return createResponse.result.id;
    } catch (error) {
      console.error('Failed to get/create Google folder:', error);
      return null;
    }
  }

  // List files from OneDrive
  async listOneDriveFiles(folderPath: string = '/Daritana'): Promise<CloudFile[]> {
    if (!this.msGraphClient) {
      const success = await this.loginMicrosoft();
      if (!success) return [];
    }

    try {
      const response = await this.msGraphClient!
        .api(`/me/drive/root:${folderPath}:/children`)
        .select('id,name,size,file,createdDateTime,lastModifiedDateTime,webUrl')
        .get();

      return response.value.map((item: any) => ({
        id: item.id,
        name: item.name,
        size: item.size,
        mimeType: item.file?.mimeType || 'folder',
        createdAt: item.createdDateTime,
        modifiedAt: item.lastModifiedDateTime,
        webUrl: item.webUrl,
        provider: 'microsoft' as const
      }));
    } catch (error) {
      console.error('Failed to list OneDrive files:', error);
      return [];
    }
  }

  // List files from Google Drive
  async listGoogleDriveFiles(folderId?: string): Promise<CloudFile[]> {
    try {
      await this.loadGoogleApi();
      
      if (!this.googleAuth.isSignedIn.get()) {
        const success = await this.loginGoogle();
        if (!success) return [];
      }

      if (!folderId) {
        folderId = await this.getOrCreateGoogleFolder('Daritana');
      }

      const gapi = (window as any).gapi;
      const response = await gapi.client.drive.files.list({
        q: folderId ? `'${folderId}' in parents and trashed=false` : 'trashed=false',
        fields: 'files(id,name,size,mimeType,createdTime,modifiedTime,webViewLink,webContentLink,thumbnailLink)',
        orderBy: 'modifiedTime desc',
        pageSize: 100
      });

      return response.result.files.map((file: any) => ({
        id: file.id,
        name: file.name,
        size: parseInt(file.size || '0'),
        mimeType: file.mimeType,
        createdAt: file.createdTime,
        modifiedAt: file.modifiedTime,
        thumbnailUrl: file.thumbnailLink,
        downloadUrl: file.webContentLink,
        webUrl: file.webViewLink,
        provider: 'google' as const
      }));
    } catch (error) {
      console.error('Failed to list Google Drive files:', error);
      return [];
    }
  }

  // Download file from OneDrive
  async downloadFromOneDrive(fileId: string): Promise<Blob | null> {
    if (!this.msGraphClient) {
      const success = await this.loginMicrosoft();
      if (!success) return null;
    }

    try {
      const response = await this.msGraphClient!
        .api(`/me/drive/items/${fileId}/content`)
        .get();
      
      return response;
    } catch (error) {
      console.error('Failed to download from OneDrive:', error);
      return null;
    }
  }

  // Download file from Google Drive
  async downloadFromGoogleDrive(fileId: string): Promise<Blob | null> {
    try {
      if (!this.googleAuth || !this.googleAuth.isSignedIn.get()) {
        const success = await this.loginGoogle();
        if (!success) return null;
      }

      const accessToken = this.googleAuth.currentUser.get().getAuthResponse().access_token;
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return await response.blob();
    } catch (error) {
      console.error('Failed to download from Google Drive:', error);
      return null;
    }
  }

  // Helper function to convert File to ArrayBuffer
  private fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // Check authentication status
  async checkAuthStatus(): Promise<{
    microsoft: boolean;
    google: boolean;
  }> {
    const microsoftAuth = msalInstance.getAllAccounts().length > 0;
    
    let googleAuth = false;
    if (this.isGoogleApiLoaded && this.googleAuth) {
      googleAuth = this.googleAuth.isSignedIn.get();
    }

    return {
      microsoft: microsoftAuth,
      google: googleAuth
    };
  }

  // Logout from Microsoft
  async logoutMicrosoft(): Promise<void> {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      await msalInstance.logoutPopup({
        account: accounts[0]
      });
    }
    this.msGraphClient = null;
  }

  // Logout from Google
  async logoutGoogle(): Promise<void> {
    if (this.googleAuth) {
      await this.googleAuth.signOut();
    }
  }
}

export const cloudStorage = new CloudStorageService();