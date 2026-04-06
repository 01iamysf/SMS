import express from 'express';
import { getMySubjects, getMyRoster, getStudentProfile } from '../controllers/teacherController.js';
import { protect, authorizeRoles, authorizePermissions } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/subjects', protect, authorizeRoles('teacher'), getMySubjects);
router.get('/roster', protect, authorizeRoles('teacher'), getMyRoster);
router.get('/student/:studentId/profile', protect, authorizeRoles('teacher'), getStudentProfile);

export default router;
