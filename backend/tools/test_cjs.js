const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// Manual config for test
const MONGO_URI = 'mongodb://127.0.0.1:27017/attendance_system';

async function runTest() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected!');

        const student = await mongoose.connection.db.collection('users').findOne({ role: 'student' });

        if (!student) {
            console.log('No student found.');
            process.exit(0);
        }

        const emailTo = student.parentEmail || 'test_parent@example.com';
        console.log(`Sending test email to: ${emailTo}`);

        // Simplified transporter for test
        const transporter = nodemailer.createTransport({
            host: 'smtp.mailtrap.io',
            port: 2525,
            auth: {
                user: 'user', // Replace with real if possible, but I'll use the service
                pass: 'pass'
            }
        });

        const message = {
            from: 'Attendance System <noreply@school.com>',
            to: emailTo,
            subject: '🔔 System Test: Parent Notification',
            text: `Hello,\n\nThis is a test notification for ${student.name}.\n\nThe notification system is functional.\n\nThank you!`
        };

        const info = await transporter.sendMail(message);
        console.log('Email sent: ' + info.messageId);

        process.exit(0);
    } catch (err) {
        console.error('Error during test:', err);
        process.exit(1);
    }
}

runTest();
