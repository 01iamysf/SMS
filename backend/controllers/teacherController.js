import Subject from '../models/Subject.js';
import SubjectAllocation from '../models/SubjectAllocation.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Class from '../models/Class.js';

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
