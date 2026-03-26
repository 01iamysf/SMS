import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const user = await User.findOne({ email: 'admin@example.com' });
        if (user) {
            console.log('User found:', {
                id: user._id,
                email: user.email,
                role: user.role,
                hasPassword: !!user.password
            });
        } else {
            console.log('User NOT found');
        }
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

checkUser();
