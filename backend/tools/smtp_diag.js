import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const logFile = '/tmp/smtp_diagnostic.log';
const log = (msg) => {
    fs.appendFileSync(logFile, msg + '\n');
    console.log(msg);
};

if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

log('--- SMTP DIAGNOSTIC ---');
log(`User: ${process.env.SMTP_EMAIL}`);
log(`Pass length: ${process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.length : 0}`);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
    }
});

log('Verifying connection...');
transporter.verify(function (error, success) {
    if (error) {
        log('❌ VERIFICATION FAILED: ' + error.message);
    } else {
        log('✅ VERIFICATION SUCCESSFUL: Server is ready to take our messages');
    }
    process.exit(0);
});
