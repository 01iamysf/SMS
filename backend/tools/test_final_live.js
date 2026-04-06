import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import User from './models/User.js';
import sendEmail from './services/emailService.js';

dotenv.config();

const LOG_FILE = '/tmp/gmail_test_final.log';
const log = (msg) => {
    const formatted = `[${new Date().toISOString()}] ${msg}`;
    console.log(formatted);
    fs.appendFileSync(LOG_FILE, formatted + '\n');
};

const runTest = async () => {
    if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
    log('--- GMAIL FINAL VERIFICATION ---');

    try {
        const email = process.env.SMTP_EMAIL;
        const pass = process.env.SMTP_PASSWORD;
        log(`Using Account: ${email}`);
        log(`Using Password (masked): ${pass.substring(0, 3)}...${pass.substring(pass.length - 3)}`);

        const testData = {
            studentName: 'Md Yunus',
            attendancePercentage: '68%',
            parentEmail: '01mdyusuf2004@gmail.com'
        };

        const message = `Hello,\n\nThis is a live test of the Attendance System notification service from the university email account.\n\nEverything is working!`;

        log('Opening transporter and sending...');
        await sendEmail({
            email: testData.parentEmail,
            subject: '✅ Success: System Notification Verified',
            message: message
        });

        log('✅ SUCCESS! Email sent successfully.');
        process.exit(0);
    } catch (err) {
        log('❌ FAILED: ' + err.message);
        process.exit(1);
    }
};

runTest();
