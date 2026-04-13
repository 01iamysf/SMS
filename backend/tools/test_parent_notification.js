import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import sendEmail from '../services/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const test = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/attendance_system');

        // Find a student with a parent email
        const student = await User.findOne({ role: 'student', parentEmail: { $exists: true, $ne: '' } });

        if (!student) {
            console.log('No student found with parentEmail. Creating a dummy one for testing.');
            // Create a temporary dummy student for testing if none exist
            const dummy = await User.create({
                name: 'Test Student',
                email: 'test_student@example.com',
                password: 'password123',
                role: 'student',
                parentEmail: 'parent_test@example.com'
            });

            console.log(`Sending test email to: ${dummy.parentEmail}`);
            await sendEmail({
                email: dummy.parentEmail,
                subject: '🔔 System Test: Parent Notification',
                message: `Hello,\n\nThis is a test notification from the Attendance Management System for ${dummy.name}.\n\nThe notification system is now functional.\n\nThank you!`
            });

            // Clean up dummy
            await User.deleteOne({ _id: dummy._id });
        } else {
            console.log(`Sending test email to: ${student.parentEmail} for student ${student.name}`);
            await sendEmail({
                email: student.parentEmail,
                subject: '🔔 System Test: Parent Notification',
                message: `Hello,\n\nThis is a test notification from the Attendance Management System for ${student.name}.\n\nThe notification system is now functional.\n\nThank you!`
            });
        }

        console.log('Test completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
};

test();
