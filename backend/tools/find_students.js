import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const test = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/attendance_system');
        const students = await User.find({ role: 'student' }).populate('parentId');
        console.log('STUDENTS_START');
        console.log(JSON.stringify(students.map(s => ({
            name: s.name,
            email: s.email,
            parentEmail: s.parentEmail,
            linkedParentEmail: s.parentId?.email
        })), null, 2));
        console.log('STUDENTS_END');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

test();
