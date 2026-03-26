import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LeaveRequest from './models/LeaveRequest.js';
import User from './models/User.js';

dotenv.config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const leaves = await LeaveRequest.find().populate('userId', 'name role class').lean();
        console.log('--- LEAVE RECORDS ---');
        console.log(JSON.stringify(leaves, null, 2));

        const coordinators = await User.find({ role: 'teacher', classCoordinatorFor: { $exists: true } }).select('name email classCoordinatorFor');
        console.log('--- COORDINATORS ---');
        console.log(JSON.stringify(coordinators, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check();
