import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import LeaveRequest from './models/LeaveRequest.js';

dotenv.config();

console.log('ENV MONGO_URI:', process.env.MONGO_URI);

const check = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 2000 });
        console.log('Connected!');

        console.log('Fetching leaves...');
        const leaves = await LeaveRequest.find().populate('userId', 'name role class').lean();
        console.log(`Found ${leaves.length} leaves.`);
        console.log(JSON.stringify(leaves, null, 2));

        console.log('Fetching coordinators...');
        const coordinators = await User.find({ role: 'teacher', classCoordinatorFor: { $exists: true } }).select('name email classCoordinatorFor');
        console.log(`Found ${coordinators.length} coordinators.`);
        console.log(JSON.stringify(coordinators, null, 2));

        console.log('Done.');
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err.message);
        process.exit(1);
    }
};

check();
