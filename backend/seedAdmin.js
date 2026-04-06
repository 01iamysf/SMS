import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const userExists = await User.findOne({ email: 'admin@example.com' });

        if (userExists) {
            console.log('Admin user already exists. Credentials: admin@example.com / admin123');
            process.exit(0);
        }

        const adminUser = await User.create({
            name: 'System Admin',
            email: 'admin@example.com',
            password: 'admin123', // Will be hashed by pre-save middleware
            role: 'admin',
            permissions: ['manageSystem', 'manageStudents', 'viewReports']
        });

        console.log('Admin user created successfully');
        console.log('Email: admin@example.com');
        console.log('Password: admin123');
        process.exit(0);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedAdmin();
