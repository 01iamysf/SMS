import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import SubjectAllocation from '../models/SubjectAllocation.js';
import { isCurrentTimeInSlot } from '../utils/timeUtils.js';
import sendEmail from '../services/emailService.js';
import SystemSetting from '../models/SystemSetting.js';
import Notification from '../models/Notification.js';

/**
 * @desc    Mark manual attendance for a student
 * @route   POST /api/attendance/manual
 * @access  Private (Teacher)
 */
export const markManualAttendance = async (req, res) => {
    try {
        const { studentId, subjectId, classId, status } = req.body;

        // 1. Fetch Allocation to check time
        const allocation = await SubjectAllocation.findOne({
            teacherId: req.user._id,
            subjectId,
            classId
        });

        if (!allocation) {
            return res.status(404).json({ message: 'Subject allocation not found' });
        }

        // 2. Validate time slot unless teacher has bypass permission
        const hasBypass = req.user.permissions?.includes('bypassTimeRestraint');
        if (!hasBypass) {
            const inSlot = isCurrentTimeInSlot(allocation.startTime, allocation.endTime, allocation.dayOfWeek);
            if (!inSlot) {
                return res.status(403).json({
                    message: `Manual attendance is restricted to class time (${allocation.startTime} - ${allocation.endTime}).`
                });
            }
        }

        const attendance = await Attendance.create({
            studentId,
            teacherId: req.user._id,
            classId,
            subjectId,
            date: new Date(),
            time: new Date().toLocaleTimeString(),
            method: 'manual',
            status: status || 'present'
        });

        if (status === 'present') {
            const student = await User.findById(studentId);
            student.streakCount = (student.streakCount || 0) + 1;
            if (student.streakCount > (student.bestStreak || 0)) {
                student.bestStreak = student.streakCount;
            }
            student.lastAttendanceDate = new Date();
            await student.save();
        } else {
            const student = await User.findById(studentId);
            student.streakCount = 0;
            await student.save();

            // Notify parent if absent or on leave
            if (student.parentId && (status === 'absent' || status === 'leave')) {
                const statusLabel = status === 'absent' ? 'ABSENT 🔴' : 'on LEAVE 📋';
                await Notification.create({
                    userId: student.parentId,
                    message: `⚠️ Attendance Alert: ${student.name} was marked ${statusLabel} today.`,
                    type: 'info',
                    link: '/parent/history'
                });
            }
        }

        res.status(201).json({ message: 'Manual attendance marked', attendance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get attendance records for a class
 * @route   GET /api/attendance/:classId
 * @access  Private (Teacher/Admin)
 */
export const getClassAttendance = async (req, res) => {
    try {
        const { classId } = req.params;
        const { date } = req.query;

        let filter = { classId };
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            filter.date = { $gte: start, $lte: end };
        }

        const attendanceRecords = await Attendance.find(filter).populate('studentId', 'name rollNumber');
        res.json(attendanceRecords);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Bulk mark manual attendance for multiple students
 * @route   POST /api/attendance/bulk-manual
 * @access  Private (Teacher)
 */
export const bulkMarkManualAttendance = async (req, res) => {
    try {
        const { attendanceData, subjectId, classId } = req.body;

        if (!attendanceData || !Array.isArray(attendanceData)) {
            return res.status(400).json({ message: 'Invalid attendance data provided' });
        }

        // 1. Fetch Allocation to check time
        const allocation = await SubjectAllocation.findOne({
            teacherId: req.user._id,
            subjectId,
            classId
        });

        if (!allocation) {
            return res.status(404).json({ message: 'Subject allocation not found' });
        }

        // 2. Validate time slot unless teacher has bypass permission
        const hasBypass = req.user.permissions?.includes('bypassTimeRestraint');
        if (!hasBypass) {
            const inSlot = isCurrentTimeInSlot(allocation.startTime, allocation.endTime, allocation.dayOfWeek);
            if (!inSlot) {
                return res.status(403).json({
                    message: `Manual attendance is restricted to class time (${allocation.startTime} - ${allocation.endTime}).`
                });
            }
        }

        const today = new Date();
        const nowTime = today.toLocaleTimeString();

        const results = [];
        for (const record of attendanceData) {
            const { studentId, status } = record;

            const attendance = await Attendance.create({
                studentId,
                teacherId: req.user._id,
                classId,
                subjectId,
                date: today,
                time: nowTime,
                method: 'manual',
                status: status || 'present'
            });

            const student = await User.findById(studentId);
            if (student) {
                if (status === 'present') {
                    student.streakCount = (student.streakCount || 0) + 1;
                    if (student.streakCount > (student.bestStreak || 0)) {
                        student.bestStreak = student.streakCount;
                    }
                    student.lastAttendanceDate = today;
                } else {
                    student.streakCount = 0;
                }
                await student.save();

                // Notify parent if absent or on leave
                if (student.parentId && (status === 'absent' || status === 'leave')) {
                    const statusLabel = status === 'absent' ? 'ABSENT 🔴' : 'on LEAVE 📋';
                    await Notification.create({
                        userId: student.parentId,
                        message: `⚠️ Attendance Alert: ${student.name} was marked ${statusLabel} today.`,
                        type: 'info',
                        link: '/parent/history'
                    });
                }
            }
            results.push(attendance);
        }

        res.status(201).json({ message: 'Bulk attendance successfully recorded', count: results.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Test attendance notification email
 * @route   POST /api/attendance/test-email
 * @access  Private (Admin)
 */
export const testAttendanceEmail = async (req, res) => {
    try {
        const testData = {
            studentName: 'Md Yunus',
            attendancePercentage: '68%',
            parentEmail: '01mdyusuf2004@gmail.com', // Specific target
            course: 'BCA',
            semester: '4'
        };

        const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #fef2f2; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #fee2e2; }
        .header { background: #dc2626; color: #ffffff; padding: 25px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; letter-spacing: 0.5px; text-transform: uppercase; }
        .content { padding: 30px 25px; }
        .urgent-box { background: #fff1f2; border-left: 5px solid #dc2626; padding: 20px; margin-bottom: 25px; border-radius: 4px; }
        .greeting { font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 15px; }
        .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .details-table td { padding: 12px 15px; border-bottom: 1px solid #f3f4f6; }
        .details-label { font-weight: 600; color: #4b5563; width: 40%; }
        .details-value { color: #111827; font-weight: 700; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
        .warning-text { color: #dc2626; font-weight: 600; margin-top: 25px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Urgent: Low Attendance Warning</h1>
        </div>
        <div class="content">
            <div class="greeting">Dear Parent,</div>
            
            <div class="urgent-box">
                This is an automated notification regarding the academic standing of your child, <strong>${testData.studentName}</strong>. 
                Our records indicate that the student's attendance has dropped below the required <strong>75%</strong> threshold.
            </div>

            <table class="details-table">
                <tr>
                    <td class="details-label">Student Name</td>
                    <td class="details-value">${testData.studentName}</td>
                </tr>
                <tr>
                    <td class="details-label">Course / Dept</td>
                    <td class="details-value">${testData.course}</td>
                </tr>
                <tr>
                    <td class="details-label">Current Attendance</td>
                    <td class="details-value" style="color: #dc2626;">68%</td>
                </tr>
            </table>

            <p class="warning-text">Action Required:</p>
            <p>Please ensure that your child improves their attendance immediately. Regular attendance is a prerequisite for maintaining academic eligibility and avoiding penalties.</p>

            <p style="margin-top: 30px;">Regards,<br><strong>College Administration</strong></p>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} Attendance Management System. All rights reserved.<br>
            This is an official communication.
        </div>
    </div>
</body>
</html>
`;

        const universityEmailSetting = await SystemSetting.findOne({ key: 'universityEmail' });
        const universityEmail = universityEmailSetting ? universityEmailSetting.value : null;

        console.log(`Attempting to send mail from ${universityEmail || process.env.SMTP_EMAIL} to ${testData.parentEmail}...`);
        await sendEmail({
            email: testData.parentEmail,
            subject: 'Low Attendance Alert – Immediate Attention Required',
            message: 'Low Attendance Alert for Md Yunus',
            html,
            from: universityEmail ? `University Admin <${universityEmail}>` : undefined
        });

        console.log('Email sent successfully');
        res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('Email sending failed:', error.message);
        res.status(500).json({ message: 'Email sending failed', error: error.message });
    }
};
