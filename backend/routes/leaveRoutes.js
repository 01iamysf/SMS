import express from 'express';
import {
    applyLeave, getMyLeaves, getCoordinatorLeaves, approveLeave, rejectLeave, revokeLeave
} from '../controllers/leaveController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/apply', upload.single('document'), applyLeave);
router.get('/my-leaves', getMyLeaves);

// Coordinator Routes
router.get('/coordinator/all', authorizeRoles('admin', 'teacher'), getCoordinatorLeaves);
router.put('/approve/:id', authorizeRoles('admin', 'teacher'), approveLeave);
router.put('/reject/:id', authorizeRoles('admin', 'teacher'), rejectLeave);
router.put('/revoke/:id', authorizeRoles('admin', 'teacher'), revokeLeave);

export default router;
