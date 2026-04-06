import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const logFile = '/tmp/smtp_trim_diag.log';
if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

const log = (msg) => {
    fs.appendFileSync(logFile, msg + '\n');
    console.log(msg);
};

const user_raw = process.env.SMTP_EMAIL;
const pass_raw = process.env.SMTP_PASSWORD;

const user = (user_raw || '').trim();
const pass = (pass_raw || '').trim();

log('--- TRIMMED SMTP DIAGNOSTIC ---');
log(`User: [${user}] (len: ${user.length})`);
log(`Pass: [${pass.substring(0, 3)}...${pass.substring(pass.length - 3)}] (len: ${pass.length})`);

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: user,
        pass: pass
    }
});

log('Transporter initialized. Verifying...');
transporter.verify(function (error, success) {
    if (error) {
        log('❌ TRIMMED VERIFICATION FAILED: ' + error.message);
    } else {
        log('✅ TRIMMED VERIFICATION SUCCESSFUL: THE GMAIL PASSWORD WORKS!');
    }
    process.exit(0);
});
