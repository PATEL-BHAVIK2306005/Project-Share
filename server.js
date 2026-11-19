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

// 10 Authorized Referral Codes generated for Bhavik Patel
const VALID_REFERRAL_CODES = [
    'BHAVIK-701-VIP',
    'BHAVIK-702-VIP',
    'BHAVIK-703-VIP',
    'BHAVIK-704-VIP',
    'BHAVIK-705-VIP',
    'ITMBU-CSE-801',
    'ITMBU-CSE-802',
    'ITMBU-CSE-803',
    'PBL-GOLD-901',
    'PBL-GOLD-902'
];

// Transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
    }
});

// Enrollment Regex Rule: (24 or 25) + C + (21/22/23/24) + (001-200 or 501-600)
const ENROLLMENT_REGEX = /^(24|25)C(21|22|23|24)(00[1-9]|0[1-9][0-9]|1[0-9]{2}|200|50[1-9]|5[1-9][0-9]|600)$/i;

// Root Route - Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Verification and Notification Endpoint
app.post('/api/verify-and-download', async (req, res) => {
    try {
        const { password, name, email, enrollment, referralCode } = req.body;

        // 1. Master Password Verification
        if (!password || password.trim() !== ACCESS_PASSWORD) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid Access Key! Please enter the authorized master password provided by Bhavik.' 
            });
        }

        // 2. Details Validation
        if (!name || !email || !enrollment || !referralCode) {
            return res.status(400).json({ 
                success: false, 
                error: 'Please fill out all required details (Name, Email, Enrollment, and Referral Code).' 
            });
        }

        // 3. Referral Code Validation (1 of the 10 codes)
        const cleanRefCode = referralCode.trim().toUpperCase();
        if (!VALID_REFERRAL_CODES.includes(cleanRefCode)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid Referral Code! Please contact Bhavik Patel directly to obtain an authorized referral code.' 
            });
        }

        // 4. Enrollment Regex Validation
        const cleanEnrollment = enrollment.trim().toUpperCase();
        if (!ENROLLMENT_REGEX.test(cleanEnrollment)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid Enrollment Number! Format must be (24 or 25) + C(21/22/23/24) + (001-200 or 501-600). Example: 24C21003 or 25C21503.' 
            });
        }

        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        // 5. Send Instant Email Alert to Bhavik
        const mailOptions = {
            from: `"PROJECT SHARE Security" <${SMTP_USER}>`,
            to: NOTIFY_EMAIL,
            subject: `🚨 [PROJECT SHARE] Project Downloaded by ${name} (${cleanEnrollment})`,
            html: `
            <div style="font-family: Arial, sans-serif; background: #070d19; padding: 25px; border-radius: 8px;">
                <div style="max-width: 580px; margin: 0 auto; background: #0c1a30; border-radius: 8px; border: 1px solid #1a3052; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
                    <div style="background: linear-gradient(135deg, #059669 0%, #0c2340 50%, #d97706 100%); color: #ffffff; padding: 20px 25px; text-align: center;">
                        <h2 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">PROJECT SHARE - ACCESS ALERT</h2>
                        <p style="margin: 5px 0 0; font-size: 13px; color: #fde68a;">Jay Swaminarayan • Bhavik Patel Repository</p>
                    </div>
                    <div style="padding: 25px; color: #f8fafc;">
                        <p style="font-size: 14px; color: #cbd5e1; margin-top: 0;">
                            <strong>Jay Swaminarayan Bhavik</strong>,<br>
                            A student has just unlocked your project vault with an authorized referral code and initiated download:
                        </p>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13.5px; background: #071224; border-radius: 6px; overflow: hidden;">
                            <tr style="border-bottom: 1px solid #1a3052;">
                                <td style="padding: 10px 14px; font-weight: bold; color: #94a3b8; width: 40%;">Student Name:</td>
                                <td style="padding: 10px 14px; color: #ffffff; font-weight: bold;">${name}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #1a3052;">
                                <td style="padding: 10px 14px; font-weight: bold; color: #94a3b8;">Email Address:</td>
                                <td style="padding: 10px 14px; color: #38bdf8;"><a href="mailto:${email}" style="color: #38bdf8;">${email}</a></td>
                            </tr>
                            <tr style="border-bottom: 1px solid #1a3052;">
                                <td style="padding: 10px 14px; font-weight: bold; color: #94a3b8;">Enrollment Number:</td>
                                <td style="padding: 10px 14px; color: #10b981; font-weight: bold; font-family: monospace; font-size: 15px;">${cleanEnrollment} (VERIFIED)</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #1a3052;">
                                <td style="padding: 10px 14px; font-weight: bold; color: #94a3b8;">Referral Code Used:</td>
                                <td style="padding: 10px 14px; color: #fbbf24; font-weight: bold; font-family: monospace; font-size: 14px;">🔑 ${cleanRefCode}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #1a3052;">
                                <td style="padding: 10px 14px; font-weight: bold; color: #94a3b8;">Timestamp (IST):</td>
                                <td style="padding: 10px 14px; color: #e2e8f0;">${timestamp}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 14px; font-weight: bold; color: #94a3b8;">Origin IP:</td>
                                <td style="padding: 10px 14px; color: #e2e8f0; font-family: monospace;">${clientIp}</td>
                            </tr>
                        </table>
                    </div>
                    <div style="background: #071224; padding: 12px 25px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #1a3052;">
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
                console.log(`[EMAIL DISPATCHED] Notified Bhavik of download by ${name} (${cleanEnrollment}) using ${cleanRefCode}`);
            }
        });

        // 6. Append to download audit log
        const logEntry = {
            timestamp,
            name,
            email,
            enrollment: cleanEnrollment,
            referralCode: cleanRefCode,
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
    console.log(`  Valid Codes : ${VALID_REFERRAL_CODES.length} codes active`);
    console.log('='.repeat(70));
});
