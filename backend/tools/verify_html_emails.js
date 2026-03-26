import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import sendEmail from '../services/emailService.js';
import User from '../models/User.js';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyEmails = async () => {
    try {
        console.log('--- HTML Email Verification Tool ---');

        const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/attendance_system';
        await mongoose.connect(MONGO_URI);
        console.log('✓ Connected to Database');

        // Target Email (Change this to your actual email to test)
        const testEmail = process.env.SMTP_EMAIL;

        if (!testEmail) {
            console.error('✘ Error: SMTP_EMAIL not found in .env. Please check your configuration.');
            process.exit(1);
        }

        console.log(`\nEmail will be sent to: ${testEmail}`);

        // --- 1. Test Weekly Report HTML ---
        const weeklyHtml = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f9; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e1e8ed; }
        .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #ffffff; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; letter-spacing: 0.5px; }
        .content { padding: 30px 25px; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
        .stat-card { background: #f9fafb; padding: 15px; border-radius: 10px; border: 1px solid #f3f4f6; text-align: center; }
        .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 5px; }
        .stat-value { font-size: 20px; font-weight: 700; color: #111827; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-bottom: 25px; }
        .status-good { background-color: #dcfce7; color: #166534; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><h1>Weekly Report Test</h1></div>
        <div class="content">
            <p>Hello, this is a <strong>System Test</strong> of the new premium HTML Weekly Report.</p>
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-label">Total Classes</div><div class="stat-value">10</div></div>
                <div class="stat-card"><div class="stat-label">Attended</div><div class="stat-value">9</div></div>
                <div class="stat-card"><div class="stat-label">Attendance Rate</div><div class="stat-value">90.00%</div></div>
                <div class="stat-card"><div class="stat-label">Current Streak</div><div class="stat-value">5 Days</div></div>
            </div>
            <div style="text-align: center;"><div class="status-badge status-good">✓ Status: Excellent</div></div>
        </div>
        <div class="footer">&copy; ${new Date().getFullYear()} Attendance System Implementation Test</div>
    </div>
</body>
</html>`;

        console.log('Sending Weekly Report Sample...');
        await sendEmail({
            email: testEmail,
            subject: '🎨 NEW: Weekly Report HTML Preview',
            html: weeklyHtml
        });
        console.log('✓ Weekly Report Email sent.');

        // --- 2. Test Low Attendance HTML ---
        const alertHtml = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #fef2f2; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #fee2e2; }
        .header { background: #dc2626; color: #ffffff; padding: 25px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; text-transform: uppercase; }
        .content { padding: 30px 25px; }
        .urgent-box { background: #fff1f2; border-left: 5px solid #dc2626; padding: 20px; margin-bottom: 25px; border-radius: 4px; }
        .details-table { width: 100%; border-collapse: collapse; }
        .details-table td { padding: 12px 15px; border-bottom: 1px solid #f3f4f6; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header"><h1>Low Attendance Alert Preview</h1></div>
        <div class="content">
            <div class="urgent-box">This is a <strong>System Test</strong> of the new Low Attendance Alert template.</div>
            <table class="details-table">
                <tr><td><strong>Student Name</strong></td><td>Test User</td></tr>
                <tr><td><strong>Current Attendance</strong></td><td style="color: #dc2626;">62%</td></tr>
            </table>
            <p style="margin-top: 20px;">The template is ready for production.</p>
        </div>
        <div class="footer">&copy; ${new Date().getFullYear()} School Management System</div>
    </div>
</body>
</html>`;

        console.log('Sending Low Attendance Alert Sample...');
        await sendEmail({
            email: testEmail,
            subject: '🚨 NEW: Low Attendance Alert HTML Preview',
            html: alertHtml
        });
        console.log('✓ Low Attendance Alert sent.');

        console.log('\n--- SUCCESS ---');
        console.log('Please check your Gmail inbox to see the beautiful new HTML designs!');

        process.exit(0);
    } catch (err) {
        console.error('\n✘ Verification Failed:', err);
        process.exit(1);
    }
};

verifyEmails();
