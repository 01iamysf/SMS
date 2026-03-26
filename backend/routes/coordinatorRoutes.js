import express from 'express';
import {
    getCoordinatorStudents, getCoordinatorAttendance, sendNotificationToClass
} from '../controllers/coordinatorController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('teacher'));

router.get('/students', getCoordinatorStudents);
router.get('/attendance', getCoordinatorAttendance);
router.post('/notify', sendNotificationToClass);

export default router;
