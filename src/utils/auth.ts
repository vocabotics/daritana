/**
 * Authentication utility functions
 */

/**
 * Get the current authentication token from localStorage
 * @returns The access token or null if not found
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('access_token');
}

/**
 * Get the refresh token from localStorage
 * @returns The refresh token or null if not found
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}

/**
 * Set the authentication token in localStorage
 * @param token The access token to store
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('access_token', token);
}

/**
 * Set the refresh token in localStorage
 * @param token The refresh token to store
 */
export function setRefreshToken(token: string): void {
  localStorage.setItem('refresh_token', token);
}

/**
 * Remove authentication tokens from localStorage
 */
export function clearAuthTokens(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

/**
 * Check if user is authenticated (has a valid token)
 * @returns True if authenticated, false otherwise
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}
