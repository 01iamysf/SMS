import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Class from './models/Class.js';

dotenv.config();

const fix = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const teacher = await User.findOne({ name: 'Md Yusuf', role: 'teacher' });
        const targetClass = await Class.findOne({ className: 'CS-A' });

        if (teacher && targetClass) {
            console.log(`Current Coordinator For: ${teacher.classCoordinatorFor}`);
            console.log(`Target Class ID: ${targetClass._id}`);

            teacher.classCoordinatorFor = targetClass._id;
            await teacher.save();

            console.log(`Successfully updated Md Yusuf to be coordinator for ${targetClass.className} (${targetClass._id})`);
        } else {
            console.log('Teacher or Class not found');
            console.log('Teacher:', !!teacher);
            console.log('Class:', !!targetClass);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fix();
