import { Router } from 'express';
import {
  createDoctor,
  toggleDoctorStatus,
  listPatients,
  listDepartments,
  createDepartment,
  getAuditLogs,
} from '../controllers/adminController.ts';
import { authenticate, authorize } from '../middleware/auth.ts';

const router = Router();

// Department list is public/authenticated; modification is admin-only
router.get('/departments', listDepartments);

// All following routes require admin role
router.use(authenticate, authorize(['admin']));

router.post('/doctors', createDoctor);
router.patch('/doctors/:id/toggle-status', toggleDoctorStatus);

router.get('/patients', listPatients);

router.post('/departments', createDepartment);

router.get('/audit-logs', getAuditLogs);

export default router;
