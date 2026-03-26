import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

dotenv.config();

const auditLog = '/tmp/system_audit.log';
if (fs.existsSync(auditLog)) fs.unlinkSync(auditLog);

const log = (section, msg, status = 'INFO') => {
    const entry = `[${status}] [${section}] ${msg}`;
    console.log(entry);
    fs.appendFileSync(auditLog, entry + '\n');
};

const runAudit = async () => {
    log('START', 'Beginning full system audit...');

    // 1. Database Check
    try {
        log('DATABASE', 'Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        log('DATABASE', 'Connected successfully.', 'SUCCESS');

        const collections = await mongoose.connection.db.listCollections().toArray();
        log('DATABASE', `Found ${collections.length} collections: ${collections.map(c => c.name).join(', ')}`);

        const userCount = await mongoose.connection.db.collection('users').countDocuments();
        log('DATABASE', `User count: ${userCount}`, userCount > 0 ? 'SUCCESS' : 'WARNING');

        await mongoose.disconnect();
    } catch (err) {
        log('DATABASE', `Connection failed: ${err.message}`, 'ERROR');
    }

    // 2. API Health Check
    try {
        log('API', 'Checking local server health (port 5000)...');
        const response = await axios.get('http://localhost:5000/');
        log('API', `Root endpoint response: ${response.data}`, 'SUCCESS');

        const authCheck = await axios.post('http://localhost:5000/api/auth/login', {}, { validateStatus: () => true });
        log('API', `Auth endpoint status: ${authCheck.status} (Expected 400/401 for empty body)`, authCheck.status < 500 ? 'SUCCESS' : 'ERROR');
    } catch (err) {
        log('API', `Server unreachable: ${err.message}. (Is it running?)`, 'WARNING');
    }

    // 3. File System Check
    const criticalFiles = [
        'server.js',
        'models/User.js',
        'controllers/attendanceController.js',
        'services/emailService.js',
        'jobs/weeklyReportJob.js',
        '../frontend/src/App.jsx',
        '../frontend/package.json'
    ];

    criticalFiles.forEach(file => {
        const fullPath = path.resolve(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
            log('FILES', `Found critical file: ${file}`, 'SUCCESS');
        } else {
            log('FILES', `MISSING CRITICAL FILE: ${file}`, 'ERROR');
        }
    });

    // 4. Notification & SMTP Check
    log('NOTIFICATIONS', `SMTP Configured: ${process.env.SMTP_EMAIL ? 'YES' : 'NO'}`);
    log('NOTIFICATIONS', `SMTP Host: ${process.env.SMTP_HOST || 'Not set'}`);

    if (process.env.SMTP_PASSWORD && process.env.SMTP_PASSWORD !== 'your_app_password_here') {
        log('NOTIFICATIONS', 'SMTP Password appears to be set.', 'SUCCESS');
    } else {
        log('NOTIFICATIONS', 'SMTP Password is using placeholder or missing.', 'WARNING');
    }

    log('END', 'Audit complete. Review details above.');
};

runAudit();
