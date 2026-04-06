import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config({ path: './.env' });

const checkAdminImages = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log('Admin user not found');
        } else {
            console.log('Admin User Found:');
            console.log('Name:', admin.name);
            console.log('Email:', admin.email);
            console.log('Avatar length:', admin.avatar ? admin.avatar.length : 0);
            console.log('CoverImage length:', admin.coverImage ? admin.coverImage.length : 0);

            if (admin.avatar) console.log('Avatar (start):', admin.avatar.substring(0, 50) + '...');
            if (admin.coverImage) console.log('CoverImage (start):', admin.coverImage.substring(0, 50) + '...');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
};

checkAdminImages();
