import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.ts';
import {
  getPaymentConfig,
  createPaymentOrder,
  getMyPayments,
  getAllPaymentsAdmin,
  getPaymentReceipt,
  markPaymentAsPaidAdmin,
} from '../controllers/paymentController.ts';

const router = Router();

// Hospital Payment System Config
router.get('/config', authenticate, getPaymentConfig);

// Patient Appointment Booking (Pay at Hospital)
router.post('/create-order', authenticate, createPaymentOrder);

// Patient Payment History
router.get('/my-payments', authenticate, getMyPayments);

// Printable Hospital Slip / Payment Receipt (Patient or Admin)
router.get('/receipt/:id', authenticate, getPaymentReceipt);

// Admin-only Payments Ledger & Financial Analytics
router.get('/admin/all', authenticate, authorize(['admin']), getAllPaymentsAdmin);

// Admin-only Mark Payment as Paid (Counter collection)
router.patch('/admin/:id/mark-paid', authenticate, authorize(['admin']), markPaymentAsPaidAdmin);

export default router;
