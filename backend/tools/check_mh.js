import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Subject from '../models/Subject.js';

dotenv.config({ path: './backend/.env' });

const checkMH = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected');

        const user = await User.findOne({ email: 'hsn@gmail.com' }).populate('enrolledSubjects.subject');
        if (!user) {
            console.log('User not found');
            process.exit(1);
        }

        console.log('User:', user.name, '(', user._id, ')');
        console.log('Enrolled Subjects:', user.enrolledSubjects.length);
        user.enrolledSubjects.forEach(es => {
            console.log(`- ${es.subject?.subjectName} (ID: ${es.subject?._id})`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkMH();
