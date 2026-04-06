import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import User from './models/User.js';
import sendEmail from './services/emailService.js';

dotenv.config();

const LOG_FILE = '/tmp/gmail_test_output.log';
const log = (msg) => {
    const formatted = `[${new Date().toISOString()}] ${msg}`;
    console.log(formatted);
    fs.appendFileSync(LOG_FILE, formatted + '\n');
};

const runTest = async () => {
    if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
    log('--- START GMAIL LIVE TEST ---');

    try {
        log('Attempting to send mail...');
        log(`From: ${process.env.SMTP_EMAIL}`);
        log(`To: 01mdyusuf2004@gmail.com`);

        const testData = {
            studentName: 'Md Yunus',
            attendancePercentage: '68%',
            parentEmail: '01mdyusuf2004@gmail.com',
            course: 'BCA',
            semester: '4'
        };

        const message = `Dear Parent,

This is an automated notification from the Student Attendance Management System.

Your child ${testData.studentName} currently has an attendance percentage of ${testData.attendancePercentage}, which is below the required minimum attendance threshold of 75%.

Student Details:
Name: ${testData.studentName}
Current Attendance: ${testData.attendancePercentage}

Please ensure that your child improves attendance to meet the academic requirements.

Regards,
Attendance Management System
College Administration`;

        await sendEmail({
            email: testData.parentEmail,
            subject: 'Low Attendance Alert – Immediate Attention Required',
            message: message
        });

        log('✅ SUCCESS: Email sent successfully!');
        process.exit(0);
    } catch (err) {
        log('❌ FAILED: ' + err.message);
        if (err.stack) log(err.stack);
        process.exit(1);
    }
};

runTest();
