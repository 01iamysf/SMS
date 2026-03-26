import express from 'express';
import {
    markManualAttendance, bulkMarkManualAttendance, getClassAttendance, testAttendanceEmail
} from '../controllers/attendanceController.js';
import { protect, authorizeRoles, authorizePermissions } from '../middleware/authMiddleware.js';

const router = express.Router();

// Test Route for Email (Unprotected for easy manual trigger)
router.get('/test-attendance-email', testAttendanceEmail);

router.use(protect);

router.post('/manual', authorizeRoles('teacher', 'admin'), authorizePermissions('markAttendance', 'manualAttendance'), markManualAttendance);
router.post('/manual-bulk', authorizeRoles('teacher', 'admin'), authorizePermissions('markAttendance', 'manualAttendance'), bulkMarkManualAttendance);
router.get('/class/:classId', authorizeRoles('teacher', 'admin', 'parent'), authorizePermissions('viewAttendance'), getClassAttendance);

export default router;
