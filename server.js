const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Configuration
const ACCESS_PASSWORD = 'PBL-Submission-2026';
const NOTIFY_EMAIL = 'bhavik.itmbu@gmail.com';
const SMTP_USER = 'bhavik.itmbu@gmail.com';
const SMTP_PASS = 'qlyanvagtiyhtple'; // Gmail App Password

// Transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
    }
});

// Enrollment Regex Rule: 24 or 25 + C + 21, 22, 23, or 24 + 001-200 or 501-600
const ENROLLMENT_REGEX = /^(24|25)C(21|22|23|24)(00[1-9]|0[1-9][0-9]|1[0-9]{2}|200|50[1-9]|5[1-9][0-9]|600)$/i;

// Root Route - Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Verification and Notification Endpoint
app.post('/api/verify-and-download', async (req, res) => {
    try {
        const { password, name, email, enrollment, sender } = req.body;

        // 1. Password Verification
        if (!password || password.trim() !== ACCESS_PASSWORD) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid Access Key! Please check the password provided by Bhavik or Diya.' 
            });
        }

        // 2. Details Validation
        if (!name || !email || !enrollment) {
            return res.status(400).json({ 
                success: false, 
                error: 'Please fill out all required details (Name, Email, Enrollment).' 
            });
        }

        // 3. Regex Validation
        const cleanEnrollment = enrollment.trim().toUpperCase();
        if (!ENROLLMENT_REGEX.test(cleanEnrollment)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid Enrollment Number! Format must be (24 or 25) + C(21/22/23/24) + (001-200 or 501-600). Example: 24C21003 or 25C21503.' 
            });
        }

        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        // 4. Send Instant Email Alert to Bhavik
        const mailOptions = {
            from: `"PROJECT SHARE Portal" <${SMTP_USER}>`,
            to: NOTIFY_EMAIL,
            subject: `🚨 [PROJECT SHARE ALERT] New Download by ${name} (${cleanEnrollment})`,
            html: `
            <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 25px; border-radius: 8px;">
                <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
                    <div style="background: #0c2340; color: #ffffff; padding: 20px 25px; text-align: center;">
                        <h2 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">PROJECT SHARE - VAULT NOTIFICATION</h2>
                        <p style="margin: 5px 0 0; font-size: 13px; color: #93c5fd;">Bhavik Patel &amp; Diya Matariya</p>
                    </div>
                    <div style="padding: 25px;">
                        <p style="font-size: 14px; color: #334155; margin-top: 0;">
                            <strong>Jay Swaminarayan Bhavik &amp; Diya</strong>,<br>
                            A student has just verified their academic credentials and downloaded the <strong>PROJECT SHARE</strong> package:
                        </p>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13.5px;">
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 10px; font-weight: bold; color: #64748b; width: 40%; background: #f8fafc;">Student Name:</td>
                                <td style="padding: 10px; color: #0c2340; font-weight: bold;">${name}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 10px; font-weight: bold; color: #64748b; background: #f8fafc;">Email Address:</td>
                                <td style="padding: 10px; color: #1e293b;"><a href="mailto:${email}" style="color: #2563eb;">${email}</a></td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 10px; font-weight: bold; color: #64748b; background: #f8fafc;">Enrollment Number:</td>
                                <td style="padding: 10px; color: #059669; font-weight: bold; font-family: monospace; font-size: 15px;">${cleanEnrollment} (VERIFIED)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 10px; font-weight: bold; color: #64748b; background: #f8fafc;">Referred By:</td>
                                <td style="padding: 10px; color: #1e293b;">${sender || 'Direct Share'}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 10px; font-weight: bold; color: #64748b; background: #f8fafc;">Timestamp (IST):</td>
                                <td style="padding: 10px; color: #475569;">${timestamp}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold; color: #64748b; background: #f8fafc;">IP Address:</td>
                                <td style="padding: 10px; color: #475569; font-family: monospace;">${clientIp}</td>
                            </tr>
                        </table>
                    </div>
                    <div style="background: #f1f5f9; padding: 12px 25px; text-align: center; font-size: 11px; color: #64748b;">
                        ITM SLS Baroda University, Vadodara • School of Computer Science &amp; Engineering
                    </div>
                </div>
            </div>
            `
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('[EMAIL NOTIFICATION NOTICE]', err.message);
            } else {
                console.log(`[EMAIL DISPATCHED] Notified Bhavik of download by ${name} (${cleanEnrollment})`);
            }
        });

        // 5. Append to download audit log file
        const logEntry = {
            timestamp,
            name,
            email,
            enrollment: cleanEnrollment,
            sender: sender || 'Unknown',
            ip: clientIp
        };

        const logPath = path.join(__dirname, 'download_audit.json');
        let logs = [];
        if (fs.existsSync(logPath)) {
            try {
                logs = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
            } catch (e) { logs = []; }
        }
        logs.unshift(logEntry);
        fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));

        return res.json({
            success: true,
            message: 'Credentials verified! Download starting...',
            downloadUrl: '/download-project-zip'
        });

    } catch (err) {
        console.error('Download error:', err);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// Download Route
app.get('/download-project-zip', (req, res) => {
    const zipPath = path.join(__dirname, 'PROJECT-SHARE.zip');
    if (fs.existsSync(zipPath)) {
        res.download(zipPath, 'PROJECT-SHARE.zip');
    } else {
        res.status(404).send('PROJECT-SHARE.zip not found on server.');
    }
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(70));
    console.log(`  PROJECT SHARE - VAULT PORTAL RUNNING`);
    console.log(`  Local URL   : http://localhost:${PORT}`);
    console.log(`  Password    : ${ACCESS_PASSWORD}`);
    console.log(`  Alert Email : ${NOTIFY_EMAIL}`);
    console.log('='.repeat(70));
});
