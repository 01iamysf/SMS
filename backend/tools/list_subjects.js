import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subject from '../models/Subject.js';

dotenv.config({ path: './backend/.env' });

const listSubjects = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const subjects = await Subject.find().populate('departmentId', 'departmentName');
        console.log('Found subjects:', subjects.length);
        subjects.forEach(s => {
            console.log(`- ${s.subjectName} (${s._id}) [Dept: ${s.departmentId?.departmentName || 'N/A'}]`);
        });

        process.exit(0);
    } catch (err) {
        console.error('FAILED:', err);
        process.exit(1);
    }
};

listSubjects();
