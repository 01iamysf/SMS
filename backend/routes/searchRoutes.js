import express from 'express';
import { globalSearch } from '../controllers/searchController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/', globalSearch);

export default router;
