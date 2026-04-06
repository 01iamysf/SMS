import mongoose from 'mongoose';
import dotenv from 'dotenv';
import sendEmail from '../services/emailService.js';
import SystemSetting from '../models/SystemSetting.js';

dotenv.config();

const test = async () => {
    try {
        console.log('--- Manual Test for Md Yunus ---');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/attendance_system');

        const testData = {
            studentName: 'Md Yunus',
            attendancePercentage: '68%',
            parentEmail: '01mdyusuf2004@gmail.com',
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

        console.log('Attempting to send email...');
        await sendEmail({
            email: testData.parentEmail,
            subject: '🚨 Urgent: Low Attendance Alert – Md Yunus',
            message: 'Low Attendance Alert for Md Yunus',
            html,
            from: universityEmail ? `University Admin <${universityEmail}>` : undefined
        });

        console.log('✅ Test email successfully sent to: ' + testData.parentEmail);
        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed:', err);
        process.exit(1);
    }
};

test();
