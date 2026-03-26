import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import sendEmail from './services/emailService.js';

dotenv.config();

const MONGO_URI = 'mongodb://127.0.0.1:27017/attendance_system';

async function runTest() {
    console.log('--- START TEST ---');
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected successfully!');

        const student = await User.findOne({ role: 'student' });

        if (!student) {
            console.log('No student found in database.');
            process.exit(0);
        }

        const emailTo = student.parentEmail || 'test_parent@example.com';
        console.log(`Student Found: ${student.name}`);
        console.log(`Target Email: ${emailTo}`);

        console.log('Attempting to send email...');
        await sendEmail({
            email: emailTo,
            subject: '🔔 System Test: Parent Notification',
            message: `Hello,\n\nThis is a functional test of the Attendance Management System's notification engine for student: ${student.name}.\n\nThe notification system is verified and live.\n\nThank you!`
        });

        console.log('Email sent successfully!');
        process.exit(0);
    } catch (err) {
        console.error('--- TEST FAILED ---');
        console.error(err.message);
        process.exit(1);
    }
}

runTest();
