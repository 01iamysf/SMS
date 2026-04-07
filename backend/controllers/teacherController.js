import Subject from '../models/Subject.js';
import SubjectAllocation from '../models/SubjectAllocation.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Class from '../models/Class.js';
import mongoose from 'mongoose';

export const getMySubjects = async (req, res) => {
    try {
        const teacherId = req.user._id;
        const subjects = await SubjectAllocation.find({ teacherId })
            .populate('classId', 'className section')
            .populate('subjectId', 'subjectName departmentId');

        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMyRoster = async (req, res) => {
    try {
        const teacherId = req.user._id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Get all unique classes assigned to this teacher via subject allocations
        const allocations = await SubjectAllocation.find({ teacherId })
            .populate('classId', 'className section')
            .populate('subjectId', 'subjectName');

        // 2. Fetch coordinator class if exists
        let coordinatedRoster = null;
        if (req.user.role === 'teacher' && req.user.classCoordinatorFor) {
            const classObj = await Class.findById(req.user.classCoordinatorFor);
            const students = await User.find({
                role: 'student',
                classId: req.user.classCoordinatorFor
            }).select('name rollNumber email streakCount bestStreak');

            coordinatedRoster = {
                type: 'coordinated',
                class: classObj || { className: 'Coordinated Class', section: '' },
                students: students.map(s => s.toObject())
            };
        }

        // 3. Map allocations to classes and fetch students for each class
        const roster = await Promise.all(allocations.map(async (allocation) => {
            const students = await User.find({
                role: 'student',
                classId: allocation.classId?._id
            }).select('name rollNumber email streakCount');

            const enrichedStudents = await Promise.all(students.map(async (student) => {
                const attendance = await Attendance.findOne({
                    studentId: student._id,
                    subjectId: allocation.subjectId?._id,
                    date: {
                        $gte: today,
                        $lt: new Date(new Date(today).setDate(today.getDate() + 1))
                    }
                });

                return {
                    ...student.toObject(),
                    attendanceStatus: attendance ? attendance.status : null
                };
            }));

            return {
                type: 'subject',
                allocationId: allocation._id,
                subject: allocation.subjectId,
                class: allocation.classId,
                students: enrichedStudents
            };
        }));

        res.json({
            subjectRoster: roster,
            coordinatedRoster
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getStudentProfile = async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await User.findById(studentId).select('-password')
            .populate('classId', 'className section')
            .populate('departmentId', 'departmentName');
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Security Check: Only the class coordinator or admin can view the full profile
        const isCoordinator = req.user.classCoordinatorFor?.toString() === student.classId?._id?.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isCoordinator && !isAdmin) {
            return res.status(403).json({ message: 'Access denied. Only the class coordinator can view detailed student performance.' });
        }

        // Fetch aggregate attendance stats
        const attendanceRecords = await Attendance.find({ studentId });
        const totalClasses = attendanceRecords.length;
        const presentCount = attendanceRecords.filter(a => a.status === 'present').length;
        const attendancePercentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(1) : 0;

        // Subject-wise attendance
        const subjectWise = await Attendance.aggregate([
            { $match: { studentId: student._id } },
            {
                $group: {
                    _id: '$subjectId',
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
                }
            }
        ]);

        const populatedSubjectWise = await Promise.all(subjectWise.map(async (item) => {
            const subject = await Subject.findById(item._id).select('subjectName');
            return {
                subjectName: subject?.subjectName || 'Unknown',
                percentage: ((item.present / item.total) * 100).toFixed(1),
                total: item.total,
                present: item.present
            };
        }));

        res.json({
            student,
            stats: {
                totalClasses,
                presentCount,
                attendancePercentage,
                subjectWise: populatedSubjectWise
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Generate an attendance report for the teacher's classes
 * @route   GET /api/teacher/report?classId=&subjectId=
 * @access  Private (Teacher)
 */
export const getAttendanceReport = async (req, res) => {
    try {
        const teacherId = req.user._id;
        const { classId, subjectId } = req.query;

        // 1. Find all allocations for this teacher (optionally filtered)
        const allocationFilter = { teacherId };
        if (classId) allocationFilter.classId = new mongoose.Types.ObjectId(classId);
        if (subjectId) allocationFilter.subjectId = new mongoose.Types.ObjectId(subjectId);

        const allocations = await SubjectAllocation.find(allocationFilter)
            .populate('classId', 'className section')
            .populate('subjectId', 'subjectName');

        if (!allocations.length) {
            return res.json({ report: [], classes: [], subjects: [] });
        }

        // 2. Aggregate attendance per student per subject
        const attendanceFilter = { teacherId };
        if (classId) attendanceFilter.classId = new mongoose.Types.ObjectId(classId);
        if (subjectId) attendanceFilter.subjectId = new mongoose.Types.ObjectId(subjectId);

        const aggregated = await Attendance.aggregate([
            { $match: { ...attendanceFilter, teacherId: new mongoose.Types.ObjectId(teacherId) } },
            {
                $group: {
                    _id: { studentId: '$studentId', subjectId: '$subjectId', classId: '$classId' },
                    total:   { $sum: 1 },
                    present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
                    absent:  { $sum: { $cond: [{ $eq: ['$status', 'absent']  }, 1, 0] } },
                    leave:   { $sum: { $cond: [{ $eq: ['$status', 'leave']   }, 1, 0] } },
                }
            }
        ]);

        // 3. Populate student, subject, class info
        const report = await Promise.all(aggregated.map(async (item) => {
            const student = await User.findById(item._id.studentId).select('name rollNumber');
            const subject = await Subject.findById(item._id.subjectId).select('subjectName');
            const cls     = await Class.findById(item._id.classId).select('className section');
            const percentage = item.total > 0 ? ((item.present / item.total) * 100).toFixed(1) : '0.0';
            return {
                studentName: student?.name || 'Unknown',
                rollNumber:  student?.rollNumber || '-',
                subjectName: subject?.subjectName || 'Unknown',
                className:   cls ? `${cls.className}${cls.section ? ' – ' + cls.section : ''}` : 'Unknown',
                total:       item.total,
                present:     item.present,
                absent:      item.absent,
                leave:       item.leave,
                percentage,
            };
        }));

        // 4. Also return unique classes & subjects for the filter dropdowns
        const classes = allocations
            .filter(a => a.classId)
            .reduce((acc, a) => {
                const key = a.classId._id.toString();
                if (!acc.find(x => x._id === key)) {
                    acc.push({ _id: key, label: `${a.classId.className}${a.classId.section ? ' – ' + a.classId.section : ''}` });
                }
                return acc;
            }, []);

        const subjects = allocations
            .filter(a => a.subjectId)
            .reduce((acc, a) => {
                const key = a.subjectId._id.toString();
                if (!acc.find(x => x._id === key)) {
                    acc.push({ _id: key, label: a.subjectId.subjectName });
                }
                return acc;
            }, []);

        // Sort: by class, then subject, then student name
        report.sort((a, b) =>
            a.className.localeCompare(b.className) ||
            a.subjectName.localeCompare(b.subjectName) ||
            a.studentName.localeCompare(b.studentName)
        );

        res.json({ report, classes, subjects });
    } catch (error) {
        console.error('[getAttendanceReport]', error);
        res.status(500).json({ message: error.message });
    }
};
