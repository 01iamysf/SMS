import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import SubjectAllocation from './models/SubjectAllocation.js';
import Subject from './models/Subject.js';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const classId = '69ab223b11d21cc5e1a011b4';

        // Find students in this class
        const students = await User.find({ class: classId, role: 'student' });
        console.log(`Found ${students.length} students in class ${classId}`);

        for (const student of students) {
            console.log(`\nStudent: ${student.name} (${student._id})`);
            console.log('Enrolled Subjects raw:', JSON.stringify(student.enrolledSubjects, null, 2));

            // Check allocations
            const allocations = await SubjectAllocation.find({ classId }).populate('subjectId');
            console.log(`Allocations for class: ${allocations.length}`);
            allocations.forEach(a => console.log(` - ${a.subjectId?.subjectName} (${a.subjectId?._id})`));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
