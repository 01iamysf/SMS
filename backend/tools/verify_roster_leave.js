import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Attendance from './models/Attendance.js';
import SubjectAllocation from './models/SubjectAllocation.js';
import Class from './models/Class.js';
import Subject from './models/Subject.js';

dotenv.config();

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Find Md Yusuf (teacher)
        const teacher = await User.findOne({ name: 'Md Yusuf' });
        const student = await User.findOne({ name: 'Md Yunus' });

        if (!teacher || !student) throw new Error('Teacher or Student not found');

        // Find an allocation for this teacher
        const allocation = await SubjectAllocation.findOne({ teacherId: teacher._id });
        if (!allocation) throw new Error('No subject allocation for teacher');

        // Create a 'leave' attendance for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await Attendance.findOneAndUpdate(
            {
                studentId: student._id,
                subjectId: allocation.subjectId,
                date: today
            },
            {
                studentId: student._id,
                teacherId: teacher._id,
                classId: student.class,
                subjectId: allocation.subjectId,
                date: today,
                time: '00:00:00',
                method: 'manual',
                status: 'leave'
            },
            { upsert: true }
        );

        console.log('--- MOCK LEAVE ATTENDANCE CREATED ---');

        // Now simulate the controller logic
        const allocations = await SubjectAllocation.find({ teacherId: teacher._id })
            .populate('subjectId', 'subjectName');

        const roster = await Promise.all(allocations.map(async (all) => {
            const students = await User.find({ class: all.classId, role: 'student' }).select('name');

            const enriched = await Promise.all(students.map(async (std) => {
                const att = await Attendance.findOne({
                    studentId: std._id,
                    subjectId: all.subjectId._id,
                    date: today
                });
                return { name: std.name, attendanceStatus: att ? att.status : null };
            }));

            return { subject: all.subjectId.subjectName, students: enriched };
        }));

        console.log(JSON.stringify(roster, null, 2));

        const yunus = roster[0].students.find(s => s.name === 'Md Yunus');
        if (yunus && yunus.attendanceStatus === 'leave') {
            console.log('VERIFICATION SUCCESS: Md Yunus is marked as ON LEAVE in roster');
        } else {
            console.log('VERIFICATION FAILED');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

runTest();
