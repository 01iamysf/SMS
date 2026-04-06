import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Subject from '../models/Subject.js';
import SubjectAllocation from '../models/SubjectAllocation.js';

export const getMyStreak = async (req, res) => {
    try {
        const student = await User.findById(req.user._id).select('streakCount bestStreak lastAttendanceDate');
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await User.find({ role: 'student' })
            .sort({ streakCount: -1 })
            .limit(10)
            .select('name streakCount bestStreak classId section');

        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getStudentOverview = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch aggregate statistics
        let stats = { totalPresent: 0, totalAbsent: 0, totalClasses: 0, history: [], streakCount: 0, bestStreak: 0 };

        const user = await User.findById(userId).select('streakCount bestStreak');
        stats.streakCount = user?.streakCount || 0;
        stats.bestStreak = user?.bestStreak || 0;

        const attendanceRecords = await Attendance.find({ studentId: userId })
            .populate('subjectId', 'subjectName departmentId')
            .sort({ date: -1 });

        stats.totalPresent = attendanceRecords.filter(a => a.status === 'present').length;
        stats.totalAbsent = attendanceRecords.filter(a => a.status === 'absent').length;
        stats.totalClasses = attendanceRecords.length;
        stats.history = attendanceRecords;

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get subjects for the logged-in student (Class-allocated + Individually enrolled)
 * @route   GET /api/student/subjects
 * @access  Private (Student)
 */
export const getMySubjects = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch student with enrolledSubjects populated, using lean for plain objects
        const student = await User.findById(userId)
            .populate({
                path: 'enrolledSubjects.subject',
                model: 'Subject'
            })
            .lean();

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const classIdStr = student.classId ? (student.classId._id ? student.classId._id.toString() : student.classId.toString()) : null;

        // Start with class-allocated subjects (Timetable)
        let classAllocations = [];
        if (classIdStr) {
            classAllocations = await SubjectAllocation.find({ classId: classIdStr })
                .populate('teacherId', 'name email')
                .populate('classId', 'className section')
                .populate('subjectId', 'subjectName departmentId')
                .lean();
        }

        /**
         * Use a Map to deduplicate subjects by their Subject ID.
         * We prioritize classAllocations because they contain schedule and teacher info.
         */
        const subjectMap = new Map();

        // 1. Process Class Allocations (Timetable)
        classAllocations.forEach(alloc => {
            if (!alloc.subjectId) return;
            const subjectId = alloc.subjectId._id ? alloc.subjectId._id.toString() : alloc.subjectId.toString();

            // If multiple slots for same subject, we keep them all (they are different timetable entries)
            // But we can group them if needed. For now, we return them as separate entries if they have different IDs.
            // Actually, SubjectAllocation _is_ the entry. One subject might have multiple slots.
            // If the user wants to see unique subjects, we might need a different approach, 
            // but usually a student wants to see their timetable entries.
            // Let's assume we want to return all timetable entries + any individual ones not in timetable.
            subjectMap.set(alloc._id.toString(), {
                ...alloc,
                isEnrolled: false // Default
            });
        });

        const classSubjectIds = new Set(classAllocations.map(a =>
            a.subjectId?._id ? a.subjectId._id.toString() : a.subjectId?.toString()
        ).filter(Boolean));

        // 2. Process Individually Enrolled Subjects
        (student.enrolledSubjects || []).forEach(enrollment => {
            if (!enrollment.subject) return;
            const subjectObj = enrollment.subject;
            const subjectIdStr = subjectObj._id ? subjectObj._id.toString() : subjectObj.toString();

            if (classSubjectIds.has(subjectIdStr)) {
                // This subject is already in the class timetable.
                // Mark all matching class entries as "isEnrolled"
                classAllocations.forEach(alloc => {
                    const allocSubId = alloc.subjectId?._id ? alloc.subjectId._id.toString() : alloc.subjectId?.toString();
                    if (allocSubId === subjectIdStr) {
                        const existingEntry = subjectMap.get(alloc._id.toString());
                        if (existingEntry) existingEntry.isEnrolled = true;
                    }
                });
            } else {
                // Individual subject not in class timetable. Create a virtual allocation entry.
                const virtualId = enrollment._id ? enrollment._id.toString() : `enrolled_${subjectIdStr}`;
                subjectMap.set(virtualId, {
                    _id: virtualId,
                    subjectId: {
                        _id: subjectObj._id,
                        subjectName: subjectObj.subjectName,
                        departmentId: subjectObj.departmentId
                    },
                    teacherId: null,
                    timeSlot: `Semester ${enrollment.semester || 'N/A'}, Year ${enrollment.year || 'N/A'}`,
                    isIndividuallyAssigned: true,
                    isEnrolled: true
                });
            }
        });

        const allSubjects = Array.from(subjectMap.values());

        res.json(allSubjects);
    } catch (error) {
        console.error('CRITICAL ERROR in getMySubjects:', error);
        res.status(500).json({
            message: 'Internal server error while fetching subjects',
            error: error.message
        });
    }
};
