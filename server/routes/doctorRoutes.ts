import { Router } from 'express';
import {
  listDoctors,
  getDoctorById,
  getDoctorSlots,
  updateDoctorProfile,
} from '../controllers/doctorController.ts';
import { authenticate } from '../middleware/auth.ts';

const router = Router();

router.get('/', listDoctors);
router.get('/:id', getDoctorById);
router.get('/:id/slots', getDoctorSlots);
router.put('/:id', authenticate, updateDoctorProfile);

export default router;
