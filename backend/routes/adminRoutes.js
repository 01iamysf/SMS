import express from 'express';
import {
    createDepartment, getDepartments, createClass, getClasses,
    createUser, createUsersBulk, getStudents, getTeachers, getUserDetails, getTimetableByClass, updateStudent, deleteStudent, deleteUser,
    createSubject, updateSubject, deleteSubject, assignSubject, assignClassCoordinator, revokeClassCoordinator, assignPermissions, updateUserPermissions, updateUser,
    enrollSubject, updateEnrolledSubject, removeEnrolledSubject, getSubjects,
    updateSubjectAllocation, deleteSubjectAllocation, getParents, getSystemActivity, getDashboardStats,
    updateAdminProfile, getSystemSettings, updateSystemSettings,
    deleteDepartment, deleteClass
} from '../controllers/adminController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('admin'));

router.post('/create-department', createDepartment);
router.get('/departments', getDepartments);
router.delete('/department/:id', deleteDepartment);

router.post('/create-class', createClass);
router.get('/classes', getClasses);
router.delete('/class/:id', deleteClass);

router.post('/create-student', (req, res, next) => { req.body.role = 'student'; next(); }, createUser);
router.post('/create-teacher', (req, res, next) => { req.body.role = 'teacher'; next(); }, createUser);
router.post('/create-user', createUser);
router.post('/create-users-bulk', createUsersBulk);

router.get('/students', getStudents);
router.get('/teachers', getTeachers);
router.get('/parents', getParents);
router.get('/user/:id', getUserDetails);
router.get('/user-details/:id', getUserDetails);
router.get('/timetable/:classId', getTimetableByClass);
router.get('/subjects', getSubjects);

router.put('/update-student/:id', updateStudent);
router.put('/update-user/:id', updateUser);
router.put('/user/:id/permissions', updateUserPermissions);
router.post('/user/:id/subjects', enrollSubject);
router.put('/user/:id/subjects/:subjectId', updateEnrolledSubject);
router.delete('/user/:id/subjects/:subjectId', removeEnrolledSubject);
router.delete('/delete-student/:id', deleteStudent);
router.delete('/user/:id', deleteUser);

router.post('/subjects', createSubject); // Formerly assignSubject
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);
router.post('/assign-subject', assignSubject);
router.put('/assign-subject/:id', updateSubjectAllocation);
router.delete('/assign-subject/:id', deleteSubjectAllocation);
router.post('/assign-class-coordinator', assignClassCoordinator);
router.delete('/revoke-coordinator/:teacherId', revokeClassCoordinator);
router.post('/assign-permissions', assignPermissions);
router.get('/activity', getSystemActivity);
router.get('/dashboard-stats', getDashboardStats);

// Profile and Settings
router.get('/profile', (req, res) => res.json(req.user));
router.put('/profile', updateAdminProfile);
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);

export default router;
