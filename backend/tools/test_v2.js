import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import User from './models/User.js';
import sendEmail from './services/emailService.js';

dotenv.config();

const LOG_FILE = '/tmp/test_log.txt';
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\n');
};

const runTest = async () => {
    if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
    log('--- START TEST V2 ---');
    try {
        log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        log('Connected!');

        // Find any user with an email to use as a parent for the test
        const parent = await User.findOne({ role: 'parent' });
        const student = await User.findOne({ role: 'student' });

        let targetEmail = '';
        let studentName = 'Test Student';

        if (student && student.parentEmail) {
            targetEmail = student.parentEmail;
            studentName = student.name;
        } else if (parent && parent.email) {
            targetEmail = parent.email;
            studentName = student ? student.name : 'Sample Student';
        } else {
            // Fallback for verification if no parents are in DB
            targetEmail = 'admin@example.com';
            log('No parent/student with parentEmail found. Falling back to admin@example.com for verification.');
        }

        log(`Targeting Email: ${targetEmail}`);
        log(`Student Context: ${studentName}`);

        log('Sending notification email...');
        await sendEmail({
            email: targetEmail,
            subject: '🔔 System Verification: Parent Notification',
            message: `Hello,\n\nThis is a verification message of the Attendance System's notification engine for student ${studentName}.\n\nConnectivity: OK\nService logic: OK\n\nThank you!`
        });

        log('SUCCESS: Email sent.');
        process.exit(0);
    } catch (err) {
        log('FAILED: ' + err.message);
        process.exit(1);
    }
};

runTest();
