import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Notification from '../models/Notification.js';

export const getCoordinatorStudents = async (req, res) => {
    try {
        const classId = req.user.classCoordinatorFor;
        if (!classId) return res.status(403).json({ message: 'Not a class coordinator' });

        const students = await User.find({ role: 'student', classId: classId }).select('-password');
        res.json(students);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getCoordinatorAttendance = async (req, res) => {
    try {
        const classId = req.user.classCoordinatorFor;
        if (!classId) return res.status(403).json({ message: 'Not a class coordinator' });

        const attendanceRecords = await Attendance.find({ classId }).populate('studentId', 'name rollNumber');
        res.json(attendanceRecords);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const sendNotificationToClass = async (req, res) => {
    try {
        const classId = req.user.classCoordinatorFor;
        if (!classId) return res.status(403).json({ message: 'Not a class coordinator' });

        const { message, type } = req.body;
        const students = await User.find({ role: 'student', classId: classId });

        const notifications = [];
        for (const student of students) {
            // To Student
            notifications.push({
                userId: student._id,
                message,
                type: type || 'info'
            });

            // To Parent
            if (student.parentId) {
                notifications.push({
                    userId: student.parentId,
                    message: `📢 Notice for ${student.name}: ${message}`,
                    type: type || 'info',
                    link: '/parent'
                });
            }
        }

        await Notification.insertMany(notifications);
        res.status(201).json({ message: 'Notifications sent to class and parents' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
