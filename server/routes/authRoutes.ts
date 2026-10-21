import { Router } from 'express';
import { register, registerDoctor, login, getMe, updateProfile } from '../controllers/authController.ts';
import { authenticate } from '../middleware/auth.ts';

const router = Router();

router.post('/register', register);
router.post('/register-doctor', registerDoctor);
router.post('/register/doctor', registerDoctor);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);

export default router;
