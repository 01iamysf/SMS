import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        console.log('URI:', process.env.MONGO_URI);
        if (!process.env.MONGO_URI) {
            console.error('ERROR: MONGO_URI is not defined in .env');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('MongoDB Connected Successfully.');
        await runCheck();
    } catch (err) {
        console.error('Connection Error:', err.message);
        process.exit(1);
    }
};

const runCheck = async () => {
    try {
        // 1. Check SystemSettings
        const SystemSetting = mongoose.model('SystemSetting', new mongoose.Schema({ key: String, value: String }));
        const settings = await SystemSetting.find({});
        console.log('\n--- System Settings ---');
        console.log(settings);

        // 2. Check Admin Profile
        const User = mongoose.model('User', new mongoose.Schema({ name: String, role: String, avatar: String, coverImage: String, email: String }));
        const admin = await User.findOne({ role: 'admin' });
        console.log('\n--- Admin User ---');
        if (admin) {
            console.log({
                name: admin.name,
                email: admin.email,
                hasAvatar: !!admin.avatar,
                hasCover: !!admin.coverImage
            });
        } else {
            console.log('No admin found');
        }

        // 3. Check Subject Allocations (if they exist)
        try {
            const SubjectAllocation = mongoose.model('SubjectAllocation', new mongoose.Schema({}, { strict: false }));
            const allocations = await SubjectAllocation.find({}).limit(5);
            console.log('\n--- Subject Allocation Sample (Max 5) ---');
            console.log(allocations);
        } catch (e) {
            console.log('SubjectAllocation model/collection might not exist yet.');
        }

        // 4. Check for Null/Undefined values in critical fields
        const allUsers = await User.find({});
        const problematicUsers = allUsers.filter(u => !u.role || !u.name || !u.email);
        if (problematicUsers.length > 0) {
            console.log('\n--- Problematic Users ---');
            console.log(problematicUsers.map(u => ({ id: u._id, name: u.name, role: u.role })));
        } else {
            console.log('\nNo problematic users found (missing name/role/email).');
        }

        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
};

connectDB();
