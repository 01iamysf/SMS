import cron from 'node-cron';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import sendEmail from '../services/emailService.js';
import SystemSetting from '../models/SystemSetting.js';

const runWeeklyJob = () => {
    // Run every Friday at 18:00 (6 PM)
    cron.schedule('0 18 * * 5', async () => {
        console.log('Running weekly attendance job...');
        try {
            const universityEmailSetting = await SystemSetting.findOne({ key: 'universityEmail' });
            const universityEmail = universityEmailSetting ? universityEmailSetting.value : null;

            const students = await User.find({ role: 'student' }).populate('parentId');

            for (const student of students) {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                const recentAttendance = await Attendance.find({
                    studentId: student._id,
                    date: { $gte: sevenDaysAgo }
                });

                const totalClasses = recentAttendance.filter(a => a.status !== 'leave').length;
                const presentClasses = recentAttendance.filter(a => a.status === 'present').length;
                const percentage = totalClasses > 0 ? parseFloat(((presentClasses / totalClasses) * 100).toFixed(2)) : 0;

                const isLowAttendance = percentage < 75;
                const subject = isLowAttendance
                    ? `⚠️ LOW ATTENDANCE ALERT: ${student.name}`
                    : `Weekly Attendance Report: ${student.name}`;

                const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f9; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e1e8ed; }
        .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #ffffff; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; letter-spacing: 0.5px; }
        .content { padding: 30px 25px; }
        .greeting { font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 20px; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
        .stat-card { background: #f9fafb; padding: 15px; border-radius: 10px; border: 1px solid #f3f4f6; text-align: center; }
        .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 5px; }
        .stat-value { font-size: 20px; font-weight: 700; color: #111827; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-bottom: 25px; }
        .status-good { background-color: #dcfce7; color: #166534; }
        .status-warning { background-color: #fee2e2; color: #991b1b; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
        .divider { height: 1px; background: #eee; margin: 25px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Weekly Attendance Report</h1>
        </div>
        <div class="content">
            <div class="greeting">Hello,</div>
            <p>This is the weekly attendance summary for <strong>${student.name}</strong>.</p>
            
            <div class="divider"></div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Total Classes</div>
                    <div class="stat-value">${totalClasses}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Attended</div>
                    <div class="stat-value">${presentClasses}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Attendance Rate</div>
                    <div class="stat-value">${percentage}%</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Current Streak</div>
                    <div class="stat-value">${student.streakCount} Days</div>
                </div>
            </div>

            <div style="text-align: center;">
                ${isLowAttendance
                        ? `<div class="status-badge status-warning">⚠️ Action Required: Low Attendance</div>
                       <p style="color: #991b1b; font-size: 14px; font-weight: 500;">Warning: The attendance is below the required 75% threshold. Please ensure regular attendance to avoid penalties.</p>`
                        : `<div class="status-badge status-good">✓ Attendance Status: Good</div>`
                    }
            </div>

            <p style="margin-top: 30px;">Thank you for your cooperation.<br><strong>School Management System</strong></p>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} School Management System. All rights reserved.<br>
            This is an automated report. Please do not reply to this email.
        </div>
    </div>
</body>
</html>
`;

                // 1. Send to Student
                if (student.email) {
                    await sendEmail({
                        email: student.email,
                        subject,
                        message,
                        html,
                        from: universityEmail ? `University Admin <${universityEmail}>` : undefined
                    });
                }

                // 2. Send to Parent (via direct field)
                if (student.parentEmail) {
                    await sendEmail({
                        email: student.parentEmail,
                        subject,
                        message,
                        html,
                        from: universityEmail ? `University Admin <${universityEmail}>` : undefined
                    });
                }

                // 3. Send to Parent (via linked account)
                if (student.parentId && student.parentId.email && student.parentId.email !== student.parentEmail) {
                    await sendEmail({
                        email: student.parentId.email,
                        subject,
                        message,
                        html,
                        from: universityEmail ? `University Admin <${universityEmail}>` : undefined
                    });
                }
            }
            console.log('Weekly attendance emails sent.');
        } catch (error) {
            console.error('Error in weekly job:', error);
        }
    });
};

export default runWeeklyJob;
