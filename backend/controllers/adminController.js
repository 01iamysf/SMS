import User from '../models/User.js';
import Department from '../models/Department.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import SubjectAllocation from '../models/SubjectAllocation.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import SystemSetting from '../models/SystemSetting.js';

/**
 * @desc    Create a new department
 * @route   POST /api/admin/department
 * @access  Private (Admin)
 */
export const createDepartment = async (req, res) => {
    try {
        const { departmentName } = req.body;
        const department = await Department.create({ departmentName });
        res.status(201).json(department);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * @desc    Get all departments
 * @route   GET /api/admin/department
 * @access  Private (Admin/Teacher)
 */
export const getDepartments = async (req, res) => {
    try {
        const departments = await Department.find({});
        res.json(departments);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * @desc    Create a new class
 * @route   POST /api/admin/class
 * @access  Private (Admin)
 */
export const createClass = async (req, res) => {
    try {
        const { className, departmentId, section = 'A', year } = req.body;
        const newClass = await Class.create({ className, departmentId, section, year });
        res.status(201).json(newClass);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * @desc    Get all classes (optionally filtered by department)
 * @route   GET /api/admin/class
 * @access  Private (Admin/Teacher)
 */
export const getClasses = async (req, res) => {
    try {
        const { departmentId } = req.query;
        const filter = departmentId ? { departmentId } : {};
        const classes = await Class.find(filter).populate('departmentId', 'departmentName');
        res.json(classes);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * @desc    Delete a department and cascade removal
 * @route   DELETE /api/admin/department/:id
 * @access  Private (Admin)
 */
export const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const department = await Department.findByIdAndDelete(id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        // Cascade: Delete related classes (as Class.departmentId is required)
        await Class.deleteMany({ departmentId: id });

        // Cascade: Nullify departmentId in Users
        await User.updateMany({ departmentId: id }, { $set: { departmentId: null } });

        // Cascade: Find subjects in this department and delete them + their allocations
        const subjects = await Subject.find({ departmentId: id });
        const subjectIds = subjects.map(s => s._id);

        await Subject.deleteMany({ departmentId: id });
        await SubjectAllocation.deleteMany({ subjectId: { $in: subjectIds } });

        res.json({ message: 'Department and related data cleared successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * @desc    Delete a class and cascade removal
 * @route   DELETE /api/admin/class/:id
 * @access  Private (Admin)
 */
export const deleteClass = async (req, res) => {
    try {
        const { id } = req.params;
        const classObj = await Class.findByIdAndDelete(id);
        if (!classObj) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Cascade: Nullify classId and related fields in Users (Students)
        await User.updateMany({ classId: id }, { $set: { classId: null, section: null, rollNumber: null } });

        // Cascade: Remove allocations for this class
        await SubjectAllocation.deleteMany({ classId: id });

        // Cascade: Clear coordinator status for teachers
        await User.updateMany({ classCoordinatorFor: id }, { $set: { classCoordinatorFor: null } });

        res.json({ message: 'Class and related allocations cleared successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * @desc    Create a new user (Student/Teacher/Admin)
 * @route   POST /api/admin/user
 * @access  Private (Admin)
 */
export const createUser = async (req, res) => {
    try {
        const { name, email, password, role, department, departmentId, class: classInBody, classId, section, rollNumber, parentId, parentEmail } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        let finalParentId = parentId;

        // Special logic for student: automatic parent linking/creation via parentEmail
        if (role === 'student' && parentEmail) {
            let parent = await User.findOne({ email: parentEmail, role: 'parent' });
            if (parent) {
                // Update existing parent's password to match student's, as requested
                parent.password = password;
                await parent.save();
                finalParentId = parent._id;
            } else {
                // Check if the email is taken by a non-parent role
                const emailTaken = await User.findOne({ email: parentEmail });
                if (emailTaken) {
                    return res.status(400).json({ message: `The email ${parentEmail} is already taken by a ${emailTaken.role}` });
                }
                // Create new parent account
                const newParent = await User.create({
                    name: `Parent of ${name}`,
                    email: parentEmail,
                    password: password,
                    role: 'parent'
                });
                finalParentId = newParent._id;
            }
        }

        const user = await User.create({
            name, email, password, role,
            departmentId: departmentId || department, // Map incoming 'department' or 'departmentId'
            classId: classId || classInBody, // Map incoming 'class' or 'classId'
            section, rollNumber,
            parentId: finalParentId, parentEmail
        });

        const userRes = user.toObject();
        delete userRes.password;
        res.status(201).json(userRes);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * @desc    Bulk create users from an array
 * @route   POST /api/admin/users/bulk
 * @access  Private (Admin)
 */
export const createUsersBulk = async (req, res) => {
    try {
        const { users } = req.body;
        if (!Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ message: 'No users provided' });
        }

        const depCache = {};
        const classCache = {};

        const results = await Promise.allSettled(users.map(async (u, index) => {
            let { name, email, password, role, department, className, section, rollNumber } = u;

            if (!name || !email || !password || !role) {
                throw new Error(`Row ${index + 1}: Missing required fields (Name, Email, Password, Role)`);
            }

            const userExists = await User.findOne({ email });
            if (userExists) {
                throw new Error(`Row ${index + 1}: User with email ${email} already exists`);
            }

            let departmentId = null;
            if (department) {
                const depNameKey = department.toLowerCase().trim();
                if (!depCache[depNameKey]) {
                    const dep = await Department.findOne({ departmentName: new RegExp(`^${department}$`, 'i') });
                    if (!dep) throw new Error(`Row ${index + 1}: Department '${department}' not found`);
                    depCache[depNameKey] = dep._id;
                }
                departmentId = depCache[depNameKey];
            }

            let classId = null;
            if (className && departmentId) {
                const classKey = `${className.toLowerCase().trim()}-${departmentId}`;
                if (!classCache[classKey]) {
                    const cls = await Class.findOne({ className: new RegExp(`^${className}$`, 'i'), departmentId });
                    if (!cls) throw new Error(`Row ${index + 1}: Class '${className}' not found in department`);
                    classCache[classKey] = cls._id;
                }
                classId = classCache[classKey];
            }

            return User.create({
                name,
                email,
                password,
                role: role.toLowerCase(),
                departmentId,
                classId,
                section,
                rollNumber
            });
        }));

        const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
        const failed = results.filter(r => r.status === 'rejected').map(r => r.reason.message);

        res.status(201).json({
            message: `Successfully created ${successful.length} users. Failed: ${failed.length}`,
            successfulCount: successful.length,
            errors: failed
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * @desc    Get all students
 * @route   GET /api/admin/students
 * @access  Private (Admin/Teacher)
 */
export const getStudents = async (req, res) => {
    try {
        const { classId } = req.query;
        const filter = { role: 'student' };
        if (classId) filter.classId = classId;
        const students = await User.find(filter).select('-password').populate('departmentId').populate('classId');
        res.json(students);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * @desc    Get all teachers
 * @route   GET /api/admin/teachers
 * @access  Private (Admin)
 */
export const getTeachers = async (req, res) => {
    try {
        const { departmentId } = req.query;
        let filter = { role: 'teacher' };
        if (departmentId) filter.departmentId = departmentId;

        const teachers = await User.find(filter).select('-password').populate('departmentId');
        res.json(teachers);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * @desc    Get all parents
 * @route   GET /api/admin/parents
 * @access  Private (Admin)
 */
export const getParents = async (req, res) => {
    try {
        const parents = await User.find({ role: 'parent' }).select('-password');
        res.json(parents);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * @desc    Get comprehensive user details and activity stats
 * @route   GET /api/admin/user/:id
 * @access  Private (Admin)
 */
export const getUserDetails = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId)
            .select('-password')
            .populate('departmentId')
            .populate('classId')
            .populate('classCoordinatorFor', 'className section year')
            .populate('enrolledSubjects.subject');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch aggregate statistics based on role
        let stats = { totalPresent: 0, totalAbsent: 0, totalClasses: 0, history: [] };

        if (user.role === 'student') {
            const attendanceRecords = await Attendance.find({ studentId: userId })
                .sort({ date: -1 })
                .populate('subjectId', 'subjectName')
                .populate('teacherId', 'name')
                .populate('classId', 'className');
            stats.totalPresent = attendanceRecords.filter(a => a.status === 'present').length;
            stats.totalAbsent = attendanceRecords.filter(a => a.status === 'absent').length;
            stats.totalClasses = attendanceRecords.length;
            stats.history = attendanceRecords;
        } else if (user.role === 'teacher') {
            // How many unique sessions this teacher has conducted
            const classesConducted = await Attendance.distinct('date', { teacherId: userId });
            stats.totalClassesConducted = classesConducted.length;

            // Get recent sessions conducted
            const recentSessions = await Attendance.find({ teacherId: userId })
                .sort({ date: -1 })
                .populate('classId', 'className section')
                .populate('subjectId', 'subjectName');

            // Deduplicate by date + classId + subjectId for a cleaner history view
            const uniqueSessions = [];
            const seenKeys = new Set();
            for (const session of recentSessions) {
                const key = `${session.date.toISOString().split('T')[0]}_${session.classId?._id}_${session.subjectId?._id}`;
                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    uniqueSessions.push(session);
                }
            }
            stats.history = uniqueSessions;
        }

        // Fetch subjects if teacher
        let subjects = [];
        if (user.role === 'teacher') {
            subjects = await SubjectAllocation.find({ teacherId: userId })
                .populate('classId', 'className section')
                .populate('subjectId', 'subjectName departmentId');
        }

        // Return combined profile
        res.json({
            profile: user,
            stats,
            subjects
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * @desc    Update user details
 * @route   PUT /api/admin/user/:id
 * @access  Private (Admin)
 */
export const updateUser = async (req, res) => {
    try {
        const { name, email, password, role, department, departmentId, class: classInBody, classId, section, rollNumber, parentEmail } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        if (departmentId !== undefined || department !== undefined) user.departmentId = departmentId || department || null;
        if (classId !== undefined || classInBody !== undefined) user.classId = classId || classInBody || null;
        if (section !== undefined) user.section = section;
        if (rollNumber !== undefined) user.rollNumber = rollNumber;

        if (parentEmail !== undefined) {
            user.parentEmail = parentEmail;
            if (parentEmail && user.role === 'student') {
                let parent = await User.findOne({ email: parentEmail, role: 'parent' });
                if (!parent) {
                    const emailTaken = await User.findOne({ email: parentEmail });
                    if (!emailTaken) {
                        parent = await User.create({
                            name: `Parent of ${user.name}`,
                            email: parentEmail,
                            password: password || Math.random().toString(36).slice(-8),
                            role: 'parent'
                        });
                    }
                }
                if (parent) {
                    user.parentId = parent._id;
                    if (password) {
                        parent.password = password;
                        await parent.save();
                    }
                }
            }
        }

        if (password) {
            user.password = password; // The pre-save middleware will hash it
        }

        const updatedUserRaw = await user.save();
        const updatedUser = await User.findById(updatedUserRaw._id)
            .select('-password')
            .populate('departmentId')
            .populate('classId');

        const userRes = updatedUser.toObject();

        res.json(userRes);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * @desc    Update student details (Alias for updateUser)
 * @route   PUT /api/admin/student/:id
 * @access  Private (Admin)
 */
export const updateStudent = updateUser;

/**
 * @desc    Delete a user record (Student/Teacher/Parent)
 * @route   DELETE /api/admin/user/:id
 * @access  Private (Admin)
 */
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Additional cleanup: if teacher, remove their subject allocations
        if (user.role === 'teacher') {
            await SubjectAllocation.deleteMany({ teacherId: user._id });
        }

        // Additional cleanup: if student, maybe handle parent relationship if needed
        // but for now, simple deletion is requested.

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User removed successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * @desc    Delete a student record (Alias for deleteUser)
 * @route   DELETE /api/admin/student/:id
 * @access  Private (Admin)
 */
export const deleteStudent = deleteUser;

/**
 * @desc    Create a new subject
 * @route   POST /api/admin/subject
 * @access  Private (Admin)
 */
export const createSubject = async (req, res) => {
    try {
        const { subjectName, departmentId } = req.body;
        const subject = await Subject.create({
            subjectName,
            departmentId
        });
        res.status(201).json(subject);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * @desc    Update subject details
 * @route   PUT /api/admin/subject/:id
 * @access  Private (Admin)
 */
export const updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const subject = await Subject.findByIdAndUpdate(id, { subjectName: req.body.subjectName, departmentId: req.body.departmentId }, { new: true })
            .populate('departmentId', 'departmentName');

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.json(subject);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * @desc    Delete a subject and its related allocations
 * @route   DELETE /api/admin/subject/:id
 * @access  Private (Admin)
 */
export const deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const subject = await Subject.findByIdAndDelete(id);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        // Remove any allocations tied to this subject globally
        await SubjectAllocation.deleteMany({ subjectId: id });

        // Remove this subject from any student's enrolledSubjects
        await User.updateMany(
            { 'enrolledSubjects.subject': id },
            { $pull: { enrolledSubjects: { subject: id } } }
        );

        res.json({ message: 'Subject deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getTimetableByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const timetable = await SubjectAllocation.find({ classId })
            .populate('teacherId', 'name')
            .populate('subjectId', 'subjectName departmentId');
        res.json(timetable);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * @desc    Assign a teacher to a subject and class (Timetable entry)
 * @route   POST /api/admin/assign-subject
 * @access  Private (Admin)
 */
export const assignSubject = async (req, res) => {
    try {
        const { subjectId, teacherId, classId, timeSlot, dayOfWeek, startTime, endTime, roomNumber } = req.body;
        const allocation = await SubjectAllocation.create({
            subjectId,
            teacherId,
            classId,
            timeSlot,
            dayOfWeek,
            startTime,
            endTime,
            roomNumber
        });
        res.status(201).json(allocation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * @desc    Assign a teacher as a class coordinator
 * @route   POST /api/admin/assign-coordinator
 * @access  Private (Admin)
 */
export const assignClassCoordinator = async (req, res) => {
    try {
        const { teacherId, classId } = req.body;
        const teacher = await User.findOneAndUpdate(
            { _id: teacherId, role: 'teacher' },
            { classCoordinatorFor: classId },
            { new: true }
        ).select('-password');
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        res.json(teacher);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * @desc    Revoke a teacher's class coordinator status
 * @route   DELETE /api/admin/revoke-coordinator/:teacherId
 * @access  Private (Admin)
 */
export const revokeClassCoordinator = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const teacher = await User.findOneAndUpdate(
            { _id: teacherId, role: 'teacher' },
            { $unset: { classCoordinatorFor: '' } },
            { new: true }
        ).select('-password').populate('departmentId').populate('classId');
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        res.json(teacher);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const assignPermissions = async (req, res) => {
    try {
        const { department, classId, role, permissions } = req.body;
        let filter = {};
        if (role) filter.role = role;
        if (department) filter.departmentId = department;
        if (classId) filter.classId = classId;

        // Admin creates permissions for bulk users matching the scope
        const result = await User.updateMany(filter, { $set: { permissions } });
        res.json({ message: `${result.modifiedCount} users updated with new permissions` });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * @desc    Update a single user's permissions
 * @route   PUT /api/admin/user/:id/permissions
 * @access  Private (Admin)
 */
export const updateUserPermissions = async (req, res) => {
    try {
        const { permissions } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { permissions },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * @desc    Enroll a student in a specific subject
 * @route   POST /api/admin/student/:id/enroll
 * @access  Private (Admin)
 */
export const enrollSubject = async (req, res) => {
    try {
        const { subjectId, semester, year } = req.body;
        const user = await User.findById(req.params.id);
        if (!user || user.role !== 'student') {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Check if already enrolled
        const alreadyEnrolled = user.enrolledSubjects?.some(es => es.subject.toString() === subjectId);
        if (alreadyEnrolled) {
            return res.status(400).json({ message: 'Student is already enrolled in this subject' });
        }

        if (!user.enrolledSubjects) {
            user.enrolledSubjects = [];
        }

        user.enrolledSubjects.push({ subject: subjectId, semester, year });
        await user.save();

        const updatedUser = await User.findById(user._id)
            .select('-password')
            .populate('departmentId')
            .populate('classId')
            .populate('enrolledSubjects.subject');

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateEnrolledSubject = async (req, res) => {
    try {
        const { id, subjectId } = req.params;
        const { semester, year } = req.body;

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const subjectIndex = user.enrolledSubjects.findIndex(es => es.subject.toString() === subjectId);
        if (subjectIndex === -1) {
            return res.status(404).json({ message: 'Enrolled subject not found' });
        }

        if (semester) user.enrolledSubjects[subjectIndex].semester = semester;
        if (year) user.enrolledSubjects[subjectIndex].year = year;

        await user.save();

        const updatedUser = await User.findById(user._id)
            .select('-password')
            .populate('departmentId')
            .populate('classId')
            .populate('enrolledSubjects.subject');

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const removeEnrolledSubject = async (req, res) => {
    try {
        const { id, subjectId } = req.params;

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const sid = subjectId.trim();
        user.enrolledSubjects = user.enrolledSubjects.filter(es => {
            const target = es.subject?._id ? es.subject._id.toString() : es.subject?.toString();
            return target !== sid;
        });
        await user.save();

        const updatedUser = await User.findById(user._id)
            .select('-password')
            .populate('departmentId')
            .populate('classId')
            .populate('enrolledSubjects.subject');

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateSubjectAllocation = async (req, res) => {
    try {
        const { id } = req.params;
        const { subjectId, teacherId, classId, timeSlot, dayOfWeek, startTime, endTime, roomNumber } = req.body;

        const allocation = await SubjectAllocation.findByIdAndUpdate(id, {
            subjectId,
            teacherId,
            classId,
            timeSlot,
            dayOfWeek,
            startTime,
            endTime,
            roomNumber
        }, { new: true });

        if (!allocation) {
            return res.status(404).json({ message: 'Allocation not found' });
        }
        res.json(allocation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteSubjectAllocation = async (req, res) => {
    try {
        const { id } = req.params;
        const allocation = await SubjectAllocation.findByIdAndDelete(id);
        if (!allocation) {
            return res.status(404).json({ message: 'Allocation not found' });
        }
        res.json({ message: 'Allocation removed successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find({})
            .populate('departmentId', 'departmentName');
        res.json(subjects);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
/**
 * @desc    Get system-wide activity logs and counts
 * @route   GET /api/admin/system-activity
 * @access  Private (Admin)
 */
export const getSystemActivity = async (req, res) => {
    try {
        const { departmentId, startDate, endDate, search } = req.query;

        // Base filter for general counts
        const countFilter = departmentId ? { department: departmentId } : {};

        const studentCount = await User.countDocuments({ role: 'student', ...countFilter });
        const teacherCount = await User.countDocuments({ role: 'teacher', ...countFilter });
        const classCount = await Class.countDocuments(departmentId ? { departmentId } : {});

        // Detailed activity filter
        let activityFilter = {};
        if (startDate || endDate) {
            activityFilter.date = {};
            if (startDate) activityFilter.date.$gte = new Date(startDate);
            if (endDate) activityFilter.date.$lte = new Date(endDate);
        }

        if (departmentId) {
            // Need to find students in that department first
            const studentsInDept = await User.find({ departmentId, role: 'student' }).select('_id');
            const studentIds = studentsInDept.map(s => s._id);
            activityFilter.studentId = { $in: studentIds };
        }

        if (search) {
            const users = await User.find({ name: new RegExp(search, 'i') }).select('_id');
            const userIds = users.map(u => u._id);
            activityFilter.$or = [
                { studentId: { $in: userIds } },
                { teacherId: { $in: userIds } }
            ];
        }

        const recentActivity = await Attendance.find(activityFilter)
            .populate('studentId', 'name rollNumber')
            .populate('teacherId', 'name')
            .populate('subjectId', 'subjectName')
            .populate('classId', 'className')
            .sort({ date: -1, createdAt: -1 })
            .limit(50);

        res.json({
            counts: {
                students: studentCount,
                teachers: teacherCount,
                classes: classCount,
            },
            activity: recentActivity
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * @desc    Get aggregate dashboard stats (counts, trend, recent activity)
 * @route   GET /api/admin/dashboard-stats
 * @access  Private (Admin)
 */
export const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // 1. Basic Counts
        const studentCount = await User.countDocuments({ role: 'student' });
        const teacherCount = await User.countDocuments({ role: 'teacher' });
        const parentCount = await User.countDocuments({ role: 'parent' });
        const departmentCount = await Department.countDocuments({});
        const classCount = await Class.countDocuments({});
        const subjectCount = await Subject.countDocuments({});

        // 2. Today's Attendance Summary (Students)
        const todayAttendance = await Attendance.find({
            date: { $gte: today, $lt: tomorrow }
        });

        const attendanceSummary = {
            present: todayAttendance.filter(a => a.status === 'present').length,
            absent: todayAttendance.filter(a => a.status === 'absent').length,
            leave: todayAttendance.filter(a => a.status === 'leave').length,
            total: todayAttendance.length
        };

        // 2b. Today's Attendance Summary (Teachers)
        const teacherOnLeaveCount = await LeaveRequest.countDocuments({
            role: 'teacher',
            status: 'approved',
            startDate: { $lte: tomorrow },
            endDate: { $gte: today }
        });

        const performingTeachers = await Attendance.distinct('teacherId', {
            date: { $gte: today, $lt: tomorrow }
        });

        const teacherSummary = {
            present: performingTeachers.length,
            leave: teacherOnLeaveCount,
            absent: Math.max(0, teacherCount - performingTeachers.length - teacherOnLeaveCount),
            total: teacherCount
        };

        // 3. 7-Day Attendance Trend (Students)
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);

        const trendData = await Attendance.aggregate([
            {
                $match: {
                    date: { $gte: sevenDaysAgo, $lt: tomorrow }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
                    absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
                    leave: { $sum: { $cond: [{ $eq: ["$status", "leave"] }, 1, 0] } }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // 3b. 7-Day Teacher Attendance Trend
        const teacherTrendData = await Attendance.aggregate([
            {
                $match: {
                    date: { $gte: sevenDaysAgo, $lt: tomorrow }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    presentTeachers: { $addToSet: "$teacherId" }
                }
            },
            {
                $project: {
                    _id: 1,
                    present: { $size: "$presentTeachers" },
                    // Mocking total based on current count for trend visualization
                    total: { $literal: teacherCount }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // 4. Recent Activities
        const recentActivities = await Attendance.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .populate({ path: 'studentId', select: 'name departmentId', populate: { path: 'departmentId', select: 'departmentName' } })
            .populate('subjectId', 'subjectName')
            .populate('classId', 'className');

        // 5. Teacher Performance (Top 5 Active Teachers by Marks)
        const teacherPerformance = await Attendance.aggregate([
            {
                $group: {
                    _id: "$teacherId",
                    markingCount: { $sum: 1 }
                }
            },
            { $sort: { markingCount: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'teacherInfo'
                }
            },
            { $unwind: "$teacherInfo" },
            {
                $lookup: {
                    from: 'departments',
                    localField: 'teacherInfo.departmentId',
                    foreignField: '_id',
                    as: 'deptInfo'
                }
            },
            { $unwind: { path: "$deptInfo", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    markingCount: 1,
                    name: "$teacherInfo.name",
                    email: "$teacherInfo.email",
                    avatar: "$teacherInfo.avatar",
                    department: "$deptInfo.departmentName"
                }
            }
        ]);

        res.json({
            counts: {
                students: studentCount,
                teachers: teacherCount,
                parents: parentCount,
                departments: departmentCount,
                classes: classCount,
                subjects: subjectCount
            },
            todayAttendance: attendanceSummary,
            teacherAttendance: teacherSummary,
            trend: trendData,
            teacherTrend: teacherTrendData,
            recentActivities,
            teacherPerformance
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Update admin profile (name, email, password, avatar, cover)
 * @route   PUT /api/admin/profile
 * @access  Private (Admin)
 */
export const updateAdminProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.avatar = req.body.avatar || user.avatar;
            user.coverImage = req.body.coverImage || user.coverImage;

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                avatar: updatedUser.avatar,
                coverImage: updatedUser.coverImage,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get system settings
 * @route   GET /api/admin/settings
 * @access  Private (Admin)
 */
export const getSystemSettings = async (req, res) => {
    try {
        const settings = await SystemSetting.find({});

        // Add environment fallback for universityEmail if not in DB
        const hasUniversityEmail = settings.some(s => s.key === 'universityEmail');
        if (!hasUniversityEmail) {
            settings.push({
                key: 'universityEmail',
                value: process.env.FROM_EMAIL || process.env.SMTP_EMAIL || '',
                description: 'System Default (from Environment)'
            });
        }

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Update system settings
 * @route   PUT /api/admin/settings
 * @access  Private (Admin)
 */
export const updateSystemSettings = async (req, res) => {
    try {
        const { settings } = req.body; // Array of { key, value }

        for (const item of settings) {
            await SystemSetting.findOneAndUpdate(
                { key: item.key },
                { value: item.value },
                { upsert: true }
            );
        }

        const updatedSettings = await SystemSetting.find({});
        res.json(updatedSettings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
