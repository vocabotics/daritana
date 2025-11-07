import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from './authStore'

// Mock the API module
vi.mock('@/lib/api', () => ({
  api: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  }
}))

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
  })

  describe('login', () => {
    it('should authenticate a valid user', async () => {
      const { login } = useAuthStore.getState()
      
      await login('admin@daritana.com', 'admin123')
      
      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(true)
      expect(state.user).toBeDefined()
      expect(state.user?.email).toBe('admin@daritana.com')
      expect(state.error).toBeNull()
    })

    it('should reject invalid credentials', async () => {
      const { login } = useAuthStore.getState()
      
      await login('invalid@email.com', 'wrongpassword')
      
      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.error).toBe('Invalid email or password')
    })

    it('should handle different user roles correctly', async () => {
      const testCases = [
        { email: 'john@example.com', password: 'password123', expectedRole: 'client' },
        { email: 'sarah@daritana.com', password: 'password123', expectedRole: 'designer' },
        { email: 'mike@contractor.com', password: 'password123', expectedRole: 'contractor' },
        { email: 'emma@daritana.com', password: 'password123', expectedRole: 'staff' },
      ]

      for (const testCase of testCases) {
        useAuthStore.setState({ user: null, isAuthenticated: false })
        
        const { login } = useAuthStore.getState()
        await login(testCase.email, testCase.password)
        
        const state = useAuthStore.getState()
        expect(state.user?.role).toBe(testCase.expectedRole)
      }
    })
  })

  describe('logout', () => {
    it('should clear user session', async () => {
      const { login, logout } = useAuthStore.getState()
      
      // First login
      await login('admin@daritana.com', 'admin123')
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      
      // Then logout
      logout()
      
      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.error).toBeNull()
    })
  })
})