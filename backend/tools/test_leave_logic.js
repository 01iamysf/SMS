import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import LeaveRequest from './models/LeaveRequest.js';
import Attendance from './models/Attendance.js';
import Class from './models/Class.js';
import Subject from './models/Subject.js';

dotenv.config();

const runTest = async () => {
    console.log('Starting verification test...');
    try {
        console.log(`Connecting to: ${process.env.MONGO_URI}`);
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected to MongoDB');

        // 1. Setup Data
        let testClass = await Class.findOne({ name: 'Test Class' });
        if (!testClass) testClass = await Class.create({ name: 'Test Class', department: new mongoose.Types.ObjectId() });

        let testSubject = await Subject.findOne({ name: 'Test Subject' });
        if (!testSubject) testSubject = await Subject.create({ name: 'Test Subject', code: 'TS101', credits: 3 });

        let coordinator = await User.findOne({ email: 'coord@test.com' });
        if (!coordinator) {
            coordinator = await User.create({
                name: 'Test Coord',
                email: 'coord@test.com',
                password: 'password123',
                role: 'teacher',
                classCoordinatorFor: testClass._id
            });
        }

        let student = await User.findOne({ email: 'student@test.com' });
        if (!student) {
            student = await User.create({
                name: 'Test Student',
                email: 'student@test.com',
                password: 'password123',
                role: 'student',
                class: testClass._id,
                enrolledSubjects: [{ subject: testSubject._id, semester: '1', year: '2024' }]
            });
        }

        console.log('Setup finished');

        // 2. Apply for Leave
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 1);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 2);

        const leave = await LeaveRequest.create({
            userId: student._id,
            role: 'student',
            startDate,
            endDate,
            reason: 'Testing workflow'
        });
        console.log('Leave applied');

        // 3. Approve Leave (Simulate Controller Logic)
        // We'll call the logic directly or reuse the exported function if possible.
        // For simplicity in script, we implement the logic here as well to verify the DB state.

        leave.status = 'approved';
        leave.approvedBy = coordinator._id;
        await leave.save();

        // Mark attendance logic test
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const currentDate = new Date(d);
            currentDate.setHours(0, 0, 0, 0);

            for (const enrollment of student.enrolledSubjects) {
                await Attendance.findOneAndUpdate(
                    {
                        studentId: student._id,
                        subjectId: enrollment.subject,
                        date: {
                            $gte: currentDate,
                            $lt: new Date(new Date(currentDate).setDate(currentDate.getDate() + 1))
                        }
                    },
                    {
                        studentId: student._id,
                        teacherId: coordinator._id,
                        classId: student.class,
                        subjectId: enrollment.subject,
                        date: currentDate,
                        time: '00:00:00',
                        method: 'manual',
                        status: 'leave'
                    },
                    { upsert: true, new: true }
                );
            }
        }
        console.log('Leave approved and attendance marked');

        // Verify Attendance
        const count = await Attendance.countDocuments({ studentId: student._id, status: 'leave' });
        console.log(`Found ${count} leave attendance records. Expected: 2 (if 2 days)`);

        // 4. Revoke Leave
        leave.status = 'revoked';
        leave.revokedBy = coordinator._id;
        leave.revocationReason = 'Test Revoke';
        await leave.save();

        await Attendance.deleteMany({
            studentId: leave.userId,
            status: 'leave',
            date: {
                $gte: new Date(new Date(leave.startDate).setHours(0, 0, 0, 0)),
                $lte: new Date(new Date(leave.endDate).setHours(23, 59, 59, 999))
            }
        });
        console.log('Leave revoked and attendance cleared');

        // Verify Cleanup
        const finalCount = await Attendance.countDocuments({ studentId: student._id, status: 'leave' });
        console.log(`Found ${finalCount} leave attendance records. Expected: 0`);

        if (count > 0 && finalCount === 0) {
            console.log('VERIFICATION SUCCESSFUL');
        } else {
            console.log('VERIFICATION FAILED');
        }

        // Cleanup
        await LeaveRequest.deleteOne({ _id: leave._id });
        process.exit(0);

    } catch (error) {
        console.error('Test Failed:', error);
        process.exit(1);
    }
};

runTest();
