import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const userId = '69a86a65ce3b9a16847a7269'; // Assuming this is student yns@gmail.com ID

const token = jwt.sign({ id: userId }, SECRET);

async function test() {
    try {
        const res = await axios.get('http://localhost:5000/api/student/subjects', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("API STATUS:", res.status);
        console.log("API DATA:", JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.log("API ERROR:", err.response?.status, err.response?.data || err.message);
    }
}
test();
