import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../database/connection';
import { generateTokens, verifyRefreshToken } from '../middleware/auth';
import { User, TokenPayload } from '../types';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService';
import { logAuditEvent, AuditEventType } from '../services/auditService';

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const userResult = await query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      await logAuditEvent(AuditEventType.ACCESS_DENIED, req, {
        userEmail: email,
        metadata: { reason: 'User not found' }
      });
      
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    const user = userResult.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password!);
    if (!validPassword) {
      await logAuditEvent(AuditEventType.ACCESS_DENIED, req, {
        userId: user.id,
        userEmail: user.email,
        metadata: { reason: 'Invalid password' }
      });
      
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Generate tokens
    const tokenPayload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      organization_id: user.organization_id
    };
    
    const { accessToken, refreshToken } = generateTokens(tokenPayload);

    // Update last login
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Log successful login
    await logAuditEvent(AuditEventType.USER_LOGIN, req, {
      userId: user.id,
      userEmail: user.email,
      organizationId: user.organization_id
    });

    // Remove password from response
    delete user.password;

    res.json({
      success: true,
      data: {
        user,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
};

// Register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role = 'client', organization_id } = req.body;

    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    const newUser = await transaction(async (client) => {
      const userResult = await client.query<User>(
        `INSERT INTO users (id, email, password, name, role, organization_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, email, hashedPassword, name, role, organization_id]
      );

      return userResult.rows[0];
    });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      organization_id: newUser.organization_id
    };
    
    const { accessToken, refreshToken } = generateTokens(tokenPayload);

    // Send welcome email
    await sendWelcomeEmail(newUser.email, newUser.name);

    // Log registration
    await logAuditEvent(AuditEventType.USER_REGISTER, req, {
      userId: newUser.id,
      userEmail: newUser.email,
      organizationId: newUser.organization_id
    });

    // Remove password from response
    delete newUser.password;

    res.status(201).json({
      success: true,
      data: {
        user: newUser,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Refresh token required'
      });
      return;
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(payload);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }
};

// Logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user from request (set by auth middleware)
    const user = (req as any).user;

    if (user) {
      // Log logout event
      await logAuditEvent(AuditEventType.USER_LOGOUT, req, {
        userId: user.id,
        userEmail: user.email,
        organizationId: user.organization_id
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
};

// Request password reset
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Find user
    const userResult = await query<User>(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      // Don't reveal if email exists
      res.json({
        success: true,
        message: 'If the email exists, a reset link has been sent'
      });
      return;
    }

    const user = userResult.rows[0];

    // Generate reset token
    const resetToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // Save reset token
    await query(
      `INSERT INTO password_resets (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
       SET token = $2, expires_at = $3`,
      [user.id, resetToken, expiresAt]
    );

    // Send reset email
    await sendPasswordResetEmail(user.email, user.name, resetToken);

    // Log password reset request
    await logAuditEvent(AuditEventType.PASSWORD_RESET, req, {
      userId: user.id,
      userEmail: user.email
    });

    res.json({
      success: true,
      message: 'If the email exists, a reset link has been sent'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      error: 'Password reset request failed'
    });
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    // Find valid reset token
    const resetResult = await query<{ user_id: string }>(
      `SELECT user_id FROM password_resets
       WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );

    if (resetResult.rows.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
      return;
    }

    const userId = resetResult.rows[0].user_id;

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await transaction(async (client) => {
      await client.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, userId]
      );

      // Delete reset token
      const result = await client.query(
        'DELETE FROM password_resets WHERE user_id = $1 RETURNING *',
        [userId]
      );
      return result.rows[0];
    });

    // Log password change
    await logAuditEvent(AuditEventType.PASSWORD_CHANGE, req, {
      userId,
      metadata: { method: 'reset' }
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Password reset failed'
    });
  }
};

// Change password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = (req as any).user;

    // Get user with password
    const userResult = await query<User>(
      'SELECT password FROM users WHERE id = $1',
      [user.id]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password!);
    if (!validPassword) {
      res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, user.id]
    );

    // Log password change
    await logAuditEvent(AuditEventType.PASSWORD_CHANGE, req, {
      userId: user.id,
      userEmail: user.email,
      metadata: { method: 'change' }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      error: 'Password change failed'
    });
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;

    // Get full user details
    const userResult = await query<User>(
      'SELECT * FROM users WHERE id = $1',
      [user.id]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    const userData = userResult.rows[0];
    delete userData.password;

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user data'
    });
  }
};

// Update profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { name, phone, avatar } = req.body;

    // Update user profile
    const updatedUser = await query<User>(
      `UPDATE users 
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           avatar = COALESCE($3, avatar),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [name, phone, avatar, user.id]
    );

    if (updatedUser.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    const userData = updatedUser.rows[0];
    delete userData.password;

    // Log profile update
    await logAuditEvent(AuditEventType.USER_UPDATE, req, {
      userId: user.id,
      userEmail: user.email,
      entityType: 'user',
      entityId: user.id,
      newValues: { name, phone, avatar }
    });

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Profile update failed'
    });
  }
};