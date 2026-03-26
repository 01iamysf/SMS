import axios from 'axios';
import mongoose from 'mongoose';
import User from './models/User.js';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const main = async () => {
    await connectDB();
    const student = await User.findOne({ role: 'student' });
    console.log('Testing with student:', student.email);

    // Login
    const { data: authData } = await axios.post('http://localhost:5000/api/auth/login', {
        email: student.email,
        password: 'password123'
    });

    const token = authData.token;
    console.log('Got token');

    try {
        const { data } = await axios.get('http://localhost:5000/api/student/subjects', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Subjects Response:');
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('API Error:', e.response?.data || e.message);
    }
    process.exit(0);
};

main();
