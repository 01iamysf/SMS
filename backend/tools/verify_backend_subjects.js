import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subject from '../models/Subject.js';
import Department from '../models/Department.js';
import User from '../models/User.js';

dotenv.config();

const verifyBackend = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Check if we can create a subject
        let dept = await Department.findOne();
        if (!dept) {
            dept = await Department.create({ departmentName: 'Test Dept' });
        }

        const subName = 'Test Subject ' + Date.now();
        const sub = await Subject.create({ subjectName: subName, departmentId: dept._id });
        console.log('Created subject:', sub._id);

        // 2. Check if we can update it
        const updatedSub = await Subject.findByIdAndUpdate(sub._id, { subjectName: subName + ' Updated' }, { new: true });
        console.log('Updated subject name:', updatedSub.subjectName);

        // 3. Check if we can delete it
        await Subject.findByIdAndDelete(sub._id);
        console.log('Deleted subject:', sub._id);

        // 4. Check student enrollment logic
        const student = await User.findOne({ role: 'student' });
        if (student) {
            const tempSub = await Subject.create({ subjectName: 'Enroll Test', departmentId: dept._id });

            // Enroll
            student.enrolledSubjects.push({ subject: tempSub._id, semester: '1', year: '1st Year' });
            await student.save();
            console.log('Enrolled student in test subject');

            // Remove enrollment
            student.enrolledSubjects = student.enrolledSubjects.filter(es => es.subject.toString() !== tempSub._id.toString());
            await student.save();
            console.log('Removed enrollment');

            await Subject.findByIdAndDelete(tempSub._id);
        }

        console.log('Backend verification SUCCESS');
        process.exit(0);
    } catch (err) {
        console.error('Backend verification FAILED:', err);
        process.exit(1);
    }
};

verifyBackend();
