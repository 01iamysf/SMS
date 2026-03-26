import mongoose from 'mongoose';
import User from './models/User.js';
import SubjectAllocation from './models/SubjectAllocation.js';
import Class from './models/Class.js';
import Subject from './models/Subject.js';
import dotenv from 'dotenv';

dotenv.config();

const diagnose = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB successfully');

        // 1. Find a student
        const student = await User.findOne({ role: 'student' }).populate('classId');
        if (!student) {
            console.log('No student found');
            return;
        }

        console.log(`\nStudent: ${student.name} (${student.email})`);
        console.log(`Class ID in User: ${student.class?._id || student.class}`);
        console.log(`Class Name: ${student.class?.className || 'N/A'}`);

        const classId = student.class?._id || student.class;

        if (classId) {
            // 2. Find allocations for this class
            const allocations = await SubjectAllocation.find({ classId: classId })
                .populate('teacherId', 'name')
                .populate('subjectId', 'subjectName');

            console.log(`\nAllocations for Class ${classId}: ${allocations.length}`);
            allocations.forEach(a => {
                console.log(`- Subject: ${a.subjectId?.subjectName}, Teacher: ${a.teacherId?.name}, Schedule: ${a.dayOfWeek} ${a.startTime}-${a.endTime}`);
            });
        } else {
            console.log('\nStudent has no class assigned.');
        }

        // 3. Find all allocations just to see what exists
        const totalAllocations = await SubjectAllocation.countDocuments();
        console.log(`\nTotal SubjectAllocations in DB: ${totalAllocations}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

diagnose();
