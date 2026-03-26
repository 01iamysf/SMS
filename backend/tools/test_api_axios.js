import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testFetch() {
    try {
        // Authenticate as Md Yunus
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'yns@gmail.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log("Logged in:", !!token);

        try {
            const getSubjectsRes = await axios.get('http://localhost:5000/api/student/subjects', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log("RESPONSE:", JSON.stringify(getSubjectsRes.data, null, 2));
        } catch (e) {
            console.log("ERROR fetching subjects:", e.response?.status, e.response?.data);
        }
    } catch (err) {
        console.log("LOGIN ERROR", err.response?.data || err.message);
    }
}
testFetch();
