import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Subject from './models/Subject.js';

dotenv.config();

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'yns@gmail.com' }).populate('enrolledSubjects.subject');
        if (!user) {
            console.log("User not found");
        } else {
            console.log("User:", user.name, "Role:", user.role);
            console.log("Enrolled Subjects:", JSON.stringify(user.enrolledSubjects, null, 2));
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkUser();
