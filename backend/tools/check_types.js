import mongoose from 'mongoose';
import SubjectAllocation from './models/SubjectAllocation.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('--- checking SubjectAllocations ---');
        const allocations = await SubjectAllocation.find({}).limit(5);
        allocations.forEach(a => {
            console.log(`ID: ${a._id}, ClassId Type: ${typeof a.classId}, ClassId: ${a.classId}`);
        });

        console.log('--- checking a random Student ---');
        const student = await User.findOne({ role: 'student' });
        if (student) {
            console.log(`Student: ${student.name}, Class Type: ${typeof student.class}, Class: ${student.class}`);

            if (student.class) {
                const matched = await SubjectAllocation.find({ classId: student.class });
                console.log(`Matched allocations for student class: ${matched.length}`);
            }
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

check();
