import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    const isGmail = (process.env.SMTP_HOST || '').includes('gmail');

    const transporter = nodemailer.createTransport({
        service: isGmail ? 'gmail' : undefined,
        host: isGmail ? undefined : (process.env.SMTP_HOST || 'smtp.mailtrap.io'),
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_PORT == 465,
        auth: {
            user: process.env.SMTP_EMAIL || 'user',
            pass: process.env.SMTP_PASSWORD || 'pass',
        },
    });

    const message = {
        from: options.from || `${process.env.FROM_NAME || 'Attendance System'} <${process.env.FROM_EMAIL || 'noreply@school.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    const info = await transporter.sendMail(message);
    console.log('Message sent: %s', info.messageId);
};

export default sendEmail;
