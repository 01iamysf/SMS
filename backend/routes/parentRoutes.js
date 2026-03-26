import express from 'express';
import { getStudentAttendance, getStudentSummary, getStudentLeaves } from '../controllers/parentController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('parent'));

router.get('/student-attendance', getStudentAttendance);
router.get('/student-summary', getStudentSummary);
router.get('/student-leaves', getStudentLeaves);

export default router;
