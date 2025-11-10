/**
 * OAuth2 Service
 *
 * Handles OAuth2 authentication flows for third-party integrations:
 * - Google Drive & Google Workspace
 * - Microsoft OneDrive & Office 365
 * - Slack
 * - WhatsApp Business
 * - Dropbox
 *
 * SECURITY: All tokens are stored securely in backend, not frontend
 */

export interface OAuth2Config {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  authEndpoint: string;
  tokenEndpoint: string;
}

export interface OAuth2Tokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  scope?: string;
}

export type OAuthProvider = 'google' | 'microsoft' | 'slack' | 'dropbox';

class OAuth2Service {
  private readonly configs: Record<OAuthProvider, OAuth2Config> = {
    google: {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      redirectUri: `${window.location.origin}/oauth/callback/google`,
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
    },
    microsoft: {
      clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID || '',
      redirectUri: `${window.location.origin}/oauth/callback/microsoft`,
      scopes: [
        'Files.ReadWrite',
        'User.Read',
        'offline_access',
      ],
      authEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    },
    slack: {
      clientId: import.meta.env.VITE_SLACK_CLIENT_ID || '',
      redirectUri: `${window.location.origin}/oauth/callback/slack`,
      scopes: [
        'chat:write',
        'files:write',
        'channels:read',
        'users:read',
      ],
      authEndpoint: 'https://slack.com/oauth/v2/authorize',
      tokenEndpoint: 'https://slack.com/api/oauth.v2.access',
    },
    dropbox: {
      clientId: import.meta.env.VITE_DROPBOX_CLIENT_ID || '',
      redirectUri: `${window.location.origin}/oauth/callback/dropbox`,
      scopes: [
        'files.content.write',
        'files.content.read',
      ],
      authEndpoint: 'https://www.dropbox.com/oauth2/authorize',
      tokenEndpoint: 'https://api.dropboxapi.com/oauth2/token',
    },
  };

  /**
   * Generate OAuth2 authorization URL with PKCE
   */
  async initiateAuth(provider: OAuthProvider): Promise<string> {
    const config = this.configs[provider];

    if (!config.clientId) {
      throw new Error(`${provider} OAuth not configured. Please add client ID to environment variables.`);
    }

    // Generate PKCE challenge
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    // Store code verifier for later exchange
    sessionStorage.setItem(`oauth_${provider}_verifier`, codeVerifier);

    // Generate state for CSRF protection
    const state = this.generateState();
    sessionStorage.setItem(`oauth_${provider}_state`, state);

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      access_type: 'offline', // Request refresh token
      prompt: 'consent', // Force consent screen for refresh token
    });

    return `${config.authEndpoint}?${params.toString()}`;
  }

  /**
   * Open OAuth popup window
   */
  async openAuthPopup(provider: OAuthProvider): Promise<{ code: string; state: string }> {
    const authUrl = await this.initiateAuth(provider);

    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      `oauth_${provider}`,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
    );

    if (!popup) {
      throw new Error('Failed to open OAuth popup. Please allow popups for this site.');
    }

    // Wait for callback
    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          reject(new Error('OAuth popup closed by user'));
        }
      }, 1000);

      // Listen for callback message
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === `oauth_callback_${provider}`) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          popup.close();

          const { code, state } = event.data;

          // Verify state to prevent CSRF
          const savedState = sessionStorage.getItem(`oauth_${provider}_state`);
          if (state !== savedState) {
            reject(new Error('Invalid state parameter - possible CSRF attack'));
            return;
          }

          resolve({ code, state });
        }
      };

      window.addEventListener('message', handleMessage);
    });
  }

  /**
   * Exchange authorization code for tokens (handled by backend)
   */
  async exchangeCodeForTokens(
    provider: OAuthProvider,
    code: string
  ): Promise<OAuth2Tokens> {
    const codeVerifier = sessionStorage.getItem(`oauth_${provider}_verifier`);

    if (!codeVerifier) {
      throw new Error('Code verifier not found - PKCE verification failed');
    }

    // Send to backend for token exchange (secure)
    const response = await fetch('/api/oauth/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        provider,
        code,
        codeVerifier,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange authorization code');
    }

    const tokens = await response.json();

    // Clean up session storage
    sessionStorage.removeItem(`oauth_${provider}_verifier`);
    sessionStorage.removeItem(`oauth_${provider}_state`);

    return tokens;
  }

  /**
   * Complete OAuth flow: open popup, exchange code, return tokens
   */
  async connect(provider: OAuthProvider): Promise<OAuth2Tokens> {
    try {
      const { code } = await this.openAuthPopup(provider);
      const tokens = await this.exchangeCodeForTokens(provider, code);
      return tokens;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`OAuth ${provider} connection failed:`, error);
      }
      throw error;
    }
  }

  /**
   * Disconnect OAuth integration (handled by backend)
   */
  async disconnect(provider: OAuthProvider): Promise<void> {
    const response = await fetch(`/api/oauth/disconnect/${provider}`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to disconnect ${provider}`);
    }
  }

  // PKCE helpers
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return this.base64URLEncode(new Uint8Array(hash));
  }

  private base64URLEncode(buffer: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }
}

export const oauth2Service = new OAuth2Service();
export default oauth2Service;
