import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import User from './models/User.js';
import LeaveRequest from './models/LeaveRequest.js';

dotenv.config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const leaves = await LeaveRequest.find().populate('userId', 'name role class').lean();
        const users = await User.find().select('name role class classCoordinatorFor').lean();

        const output = {
            leaves,
            users,
            timestamp: new Date().toISOString()
        };

        fs.writeFileSync('db_diagnostics_output.json', JSON.stringify(output, null, 2));
        console.log('Diagnostics written to db_diagnostics_output.json');
        process.exit(0);
    } catch (err) {
        fs.writeFileSync('db_diagnostics_error.txt', err.stack || err.message);
        process.exit(1);
    }
};

check();
