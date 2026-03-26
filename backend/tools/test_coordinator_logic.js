import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import LeaveRequest from './models/LeaveRequest.js';

dotenv.config();

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const teacher = await User.findOne({ name: 'Md Yusuf' });
        if (!teacher) throw new Error('Teacher not found');

        const classId = teacher.classCoordinatorFor;
        console.log(`Teacher Class ID: ${classId}`);

        const students = await User.find({ class: classId, role: 'student' }).select('_id name');
        console.log(`Students found in class: ${students.length}`);
        students.forEach(s => console.log(` - ${s.name} (${s._id})`));

        const studentIds = students.map(s => s._id);
        const leaves = await LeaveRequest.find({
            userId: { $in: studentIds }
        }).populate('userId', 'name rollNumber');

        console.log(`Leaves found: ${leaves.length}`);
        leaves.forEach(l => console.log(` - Leave ID: ${l._id} for ${l.userId.name} (Status: ${l.status})`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

test();
