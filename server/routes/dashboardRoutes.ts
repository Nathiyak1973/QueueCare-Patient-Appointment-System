import { Router } from 'express';
import {
  getPatientDashboard,
  getDoctorDashboard,
  getAdminDashboard,
} from '../controllers/dashboardController.ts';
import { authenticate, authorize } from '../middleware/auth.ts';

const router = Router();

router.get('/patient', authenticate, authorize(['patient']), getPatientDashboard);
router.get('/doctor', authenticate, authorize(['doctor']), getDoctorDashboard);
router.get('/admin', authenticate, authorize(['admin']), getAdminDashboard);

export default router;
