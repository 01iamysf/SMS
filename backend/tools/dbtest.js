// Simple mongoose query test to verify SubjectAllocation query
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import SubjectAllocation from './models/SubjectAllocation.js';
import User from './models/User.js';

dotenv.config();

const main = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        const student = await User.findOne({ role: 'student' });
        console.log('Found student:', student.email, 'Class:', student.class);

        console.log('Querying SubjectAllocation for classId:', student.class);

        // This is the identical query that is hanging
        const classSubjects = await SubjectAllocation.find({ classId: student.class });

        console.log('Query complete:', classSubjects.length, 'subjects found');

    } catch (e) {
        console.error('Error in script:', e);
    } finally {
        process.exit(0);
    }
};

main();
