import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import SubjectAllocation from '../models/SubjectAllocation.js';

export const getStudentAttendance = async (req, res) => {
    try {
        const parentId = req.user._id;
        const parentEmail = req.user.email;
        const students = await User.find({
            $or: [{ parentId }, { parentEmail }],
            role: 'student'
        }).select('-password');
        if (!students || students.length === 0) {
            return res.status(404).json({ message: 'No students found for this parent' });
        }

        const studentIds = students.map(s => s._id);
        const attendanceRecords = await Attendance.find({ studentId: { $in: studentIds } })
            .populate('studentId', 'name rollNumber classId section')
            .populate('subjectId', 'subjectName');
        res.json(attendanceRecords);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getStudentSummary = async (req, res) => {
    try {
        const parentId = req.user._id;
        const parentEmail = req.user.email;
        const students = await User.find({
            $or: [{ parentId }, { parentEmail }],
            role: 'student'
        });
        if (!students || students.length === 0) {
            return res.status(404).json({ message: 'No students found for this parent' });
        }

        const summary = [];
        for (const student of students) {
            const totalClasses = await Attendance.countDocuments({ studentId: student._id });
            const presentClasses = await Attendance.countDocuments({ studentId: student._id, status: 'present' });
            const leaveClasses = await Attendance.countDocuments({ studentId: student._id, status: 'leave' });

            const percentage = totalClasses > 0 ? ((presentClasses / totalClasses) * 100).toFixed(2) : 0;

            summary.push({
                studentId: student._id,
                name: student.name,
                totalClasses,
                presentClasses,
                leaveClasses,
                attendancePercentage: percentage,
                currentStreak: student.streakCount,
                bestStreak: student.bestStreak
            });
        }

        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getStudentLeaves = async (req, res) => {
    try {
        const parentId = req.user._id;
        const parentEmail = req.user.email;
        const students = await User.find({
            $or: [{ parentId }, { parentEmail }],
            role: 'student'
        }).select('_id');
        if (!students || students.length === 0) {
            return res.status(404).json({ message: 'No students found for this parent' });
        }

        const studentIds = students.map(s => s._id);
        const leaves = await LeaveRequest.find({ userId: { $in: studentIds } })
            .populate('userId', 'name rollNumber')
            .sort({ createdAt: -1 });

        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getStudentAcademic = async (req, res) => {
    try {
        const parentId = req.user._id;
        const parentEmail = req.user.email;
        const students = await User.find({
            $or: [{ parentId }, { parentEmail }],
            role: 'student'
        }).populate('departmentId', 'departmentName')
          .populate('classId', 'className section year');

        if (!students || students.length === 0) {
            return res.status(404).json({ message: 'No students found for this parent' });
        }

        const academicData = [];
        for (const student of students) {
            // Find class coordinator
            let coordinator = null;
            if (student.classId) {
                coordinator = await User.findOne({
                    role: 'teacher',
                    classCoordinatorFor: student.classId._id
                }).select('name email avatar');
            }

            // Find subject allocations for this class
            const allocations = await SubjectAllocation.find({ classId: student.classId?._id })
                .populate('teacherId', 'name email avatar')
                .populate('subjectId', 'subjectName subjectCode');

            academicData.push({
                studentId: student._id,
                name: student.name,
                rollNumber: student.rollNumber,
                department: student.departmentId?.departmentName || 'N/A',
                classInfo: student.classId ? {
                    name: student.classId.className,
                    section: student.classId.section,
                    year: student.classId.year
                } : null,
                coordinator,
                subjects: allocations.map(a => ({
                    _id: a._id,
                    name: a.subjectId?.subjectName || 'Unknown Subject',
                    code: a.subjectId?.subjectCode,
                    teacher: a.teacherId ? {
                        name: a.teacherId.name,
                        email: a.teacherId.email,
                        avatar: a.teacherId.avatar
                    } : null,
                    schedule: {
                        day: a.dayOfWeek,
                        start: a.startTime,
                        end: a.endTime
                    }
                }))
            });
        }

        res.json(academicData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
