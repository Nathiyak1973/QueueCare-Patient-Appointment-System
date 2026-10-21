import { Router } from 'express';
import {
  getLiveQueue,
  getMyTokenStatus,
  callNextPatient,
  completeConsultation,
  markNoShow,
  getHospitalQueueSummary,
} from '../controllers/queueController.ts';
import { authenticate, authorize } from '../middleware/auth.ts';

const router = Router();

// Public/patient live queue inspection
router.get('/live', getLiveQueue);
router.get('/hospital-overview', getHospitalQueueSummary);
router.get('/token/:appointmentId', authenticate, getMyTokenStatus);

// Doctor & Admin queue operations
router.post('/call-next', authenticate, authorize(['doctor', 'admin']), callNextPatient);
router.post('/:appointmentId/complete', authenticate, authorize(['doctor', 'admin']), completeConsultation);
router.post('/:appointmentId/no-show', authenticate, authorize(['doctor', 'admin']), markNoShow);

export default router;
