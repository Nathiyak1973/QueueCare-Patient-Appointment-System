import { Router } from 'express';
import {
  createAppointment,
  listAppointments,
  getAppointmentById,
  cancelAppointment,
  updateAppointmentPaymentStatus,
} from '../controllers/appointmentController.ts';
import { authenticate, authorize } from '../middleware/auth.ts';

const router = Router();

// Patient/staff appointment booking & listing
router.post('/', authenticate, createAppointment);
router.get('/', authenticate, listAppointments);
router.get('/:id', authenticate, getAppointmentById);
router.patch('/:id/cancel', authenticate, cancelAppointment);

// Admin-only payment status update
router.patch('/:id/payment-status', authenticate, authorize(['admin']), updateAppointmentPaymentStatus);

export default router;
