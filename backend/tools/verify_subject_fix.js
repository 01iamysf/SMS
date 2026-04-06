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

        const userId = '67cc32609054366ebce1764d'; // Example student ID from logs

        const student = await User.findById(userId)
            .populate({
                path: 'enrolledSubjects.subject',
                model: 'Subject'
            })
            .lean();

        if (!student) {
            console.log('Student not found. Check ID.');
            process.exit(1);
        }

        const classIdStr = student.class ? student.class.toString() : null;
        console.log(`Student Class ID: ${classIdStr}`);

        const classAllocations = await SubjectAllocation.find({ classId: classIdStr })
            .populate('subjectId')
            .lean();

        console.log(`Class Allocations found: ${classAllocations.length}`);

        const enrolledSubjects = student.enrolledSubjects || [];
        console.log(`Individually Enrolled Subjects: ${enrolledSubjects.length}`);

        // Reproduction logic (simplified version of the controller)
        const subjectMap = new Map();
        classAllocations.forEach(alloc => {
            if (!alloc.subjectId) return;
            const subjectId = alloc.subjectId._id.toString();
            subjectMap.set(alloc._id.toString(), {
                name: alloc.subjectId.subjectName,
                isEnrolled: false,
                isAllocation: true
            });
        });

        const classSubjectIds = new Set(classAllocations.map(a => a.subjectId?._id?.toString()).filter(Boolean));

        enrolledSubjects.forEach(enrollment => {
            if (!enrollment.subject) return;
            const subjectIdStr = enrollment.subject._id.toString();

            if (classSubjectIds.has(subjectIdStr)) {
                classAllocations.forEach(alloc => {
                    if (alloc.subjectId?._id.toString() === subjectIdStr) {
                        const entry = subjectMap.get(alloc._id.toString());
                        if (entry) entry.isEnrolled = true;
                    }
                });
            } else {
                subjectMap.set(`enrolled_${subjectIdStr}`, {
                    name: enrollment.subject.subjectName,
                    isEnrolled: true,
                    isAllocation: false
                });
            }
        });

        console.log('\nFinal Subject List Projection:');
        subjectMap.forEach((v, k) => {
            console.log(`- [${v.isAllocation ? 'ALLOC' : 'INDIV'}] ${v.name} (Enrolled: ${v.isEnrolled})`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
