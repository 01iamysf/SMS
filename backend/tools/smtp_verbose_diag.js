import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const logFile = '/tmp/smtp_verbose_diag.log';
if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

const log = (msg) => {
    fs.appendFileSync(logFile, msg + '\n');
    console.log(msg);
};

log('--- GMAIL VERBOSE DIAGNOSTIC ---');
log(`Authenticating as: ${process.env.SMTP_EMAIL}`);
log(`Password length: ${process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.length : 0} characters`);

// Test with 'gmail' service first
const transporter1 = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
    },
    debug: true,
    logger: true
});

log('Testing Method 1 (service: gmail)...');
try {
    const info = await transporter1.verify();
    log('✅ Method 1 Success: ' + JSON.stringify(info));
} catch (err) {
    log('❌ Method 1 Failed: ' + err.message);
}

// Test with Port 465 SSL explicitly
const transporter2 = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
    }
});

log('Testing Method 2 (Port 465 SSL)...');
try {
    const info = await transporter2.verify();
    log('✅ Method 2 Success: ' + JSON.stringify(info));
} catch (err) {
    log('❌ Method 2 Failed: ' + err.message);
}

process.exit(0);
