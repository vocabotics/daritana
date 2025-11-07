import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as authController from '../controllers/authController';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
// router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
// router.post('/verify-email', authController.verifyEmail);

// Protected routes
router.use(authenticate); // All routes below require authentication
router.get('/me', authController.getCurrentUser);
router.post('/logout', authController.logout);
router.post('/change-password', authController.changePassword);

export default router;