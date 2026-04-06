import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();
async function run() {
    await connectDB();
    const student = await User.findOne({role: 'student'}).populate('enrolledSubjects.subject');
    const individualSubjects = (student.enrolledSubjects || [])
        .filter(es => es && es.subject)
        .map(es => ({
            _id: es._id ? es._id.toString() : `enrolled_${es.subject._id}`,
            subjectId: es.subject.toObject ? es.subject.toObject() : es.subject,
            timeSlot: `Semester ${es.semester || 'N/A'}, Year ${es.year || 'N/A'}`,
            isIndividuallyAssigned: true
        }));
    console.log(JSON.stringify(individualSubjects));
    process.exit(0);
}
run();
