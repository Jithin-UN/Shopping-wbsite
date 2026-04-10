import express from 'express';
import path from 'path';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (serviceAccount) {
    try {
      const cert = JSON.parse(serviceAccount);
      admin.initializeApp({
        credential: admin.credential.cert(cert),
        projectId: process.env.VITE_FIREBASE_PROJECT_ID
      });
      console.log('Firebase Admin initialized with service account');
    } catch (err) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', err);
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.VITE_FIREBASE_PROJECT_ID
      });
    }
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.VITE_FIREBASE_PROJECT_ID
    });
    console.log('Firebase Admin initialized with applicationDefault');
  }
}

const db = admin.firestore();
const auth = admin.auth();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Email Transporter - Using explicit SMTP settings for Gmail
export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  tls: {
    // Do not fail on invalid certs (useful for some environments)
    rejectUnauthorized: false
  }
});

// Verify transporter on startup
if (process.env.NODE_ENV !== 'production') {
  transporter.verify((error) => {
    if (error) {
      console.error('Email Transporter Error:', error.message);
    } else {
      console.log('Email server is ready to send messages');
    }
  });
}

// API Routes
app.post('/api/send-verification', async (req, res) => {
    const { email, token } = req.body;
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    const adminEmail = process.env.ADMIN_EMAIL;
    const appUrl = process.env.VITE_APP_URL || `http://localhost:${PORT}`;

    if (!gmailUser || !gmailPass) {
      return res.status(500).json({ 
        error: 'Email configuration missing', 
        details: 'GMAIL_USER or GMAIL_APP_PASSWORD not set in environment variables.' 
      });
    }

    const verificationLink = `${appUrl}/verify?token=${token}&email=${email}`;

    try {
      // 1. Send Verification Email to User
      await transporter.sendMail({
        from: `"Prathiss Club" <${gmailUser}>`,
        to: email,
        subject: 'Verify your subscription to Prathiss Club',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
            <h2 style="color: #4f46e5;">Welcome to Prathiss Club!</h2>
            <p>Thank you for subscribing to our newsletter. Please click the button below to verify your email address and complete your subscription.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Verify Email Address</a>
            </div>
            <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center;">© 2026 Prathiss. All rights reserved.</p>
          </div>
        `,
      });

      // 2. Notify Admin
      await transporter.sendMail({
        from: `"Prathiss System" <${gmailUser}>`,
        to: adminEmail,
        subject: 'New Subscription Request',
        text: `A new user with email ${email} has requested to join the newsletter. Verification email has been sent.`,
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Email sending error:', error);
      const isAuthError = error.message?.includes('Invalid login') || error.code === 'EAUTH';
      res.status(500).json({ 
        error: isAuthError ? 'Email authentication failed' : 'Failed to send verification email',
        details: isAuthError ? 'Check your GMAIL_APP_PASSWORD in the Secrets panel.' : error.message
      });
    }
  });

  app.post('/api/send-confirmation', async (req, res) => {
    const { email } = req.body;
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!gmailUser || !gmailPass) {
      return res.status(500).json({ error: 'Email configuration missing' });
    }

    try {
      // 1. Send Confirmation Email to User
      await transporter.sendMail({
        from: `"Prathiss Club" <${gmailUser}>`,
        to: email,
        subject: 'Subscription Confirmed!',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
            <h2 style="color: #4f46e5;">You're in!</h2>
            <p>Your subscription to Prathiss Club has been verified. Get ready for special offers, free giveaways, and once-in-a-lifetime deals.</p>
            <p>Stay tuned!</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center;">© 2026 Prathiss. All rights reserved.</p>
          </div>
        `,
      });

      // 2. Notify Admin
      await transporter.sendMail({
        from: `"Prathiss System" <${gmailUser}>`,
        to: adminEmail,
        subject: 'Subscription Verified',
        text: `User ${email} has successfully verified their subscription.`,
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Confirmation email error:', error);
      res.status(500).json({ error: 'Failed to send confirmation email', details: error.message });
    }
  });

  // OTP Password Reset Routes
  app.post('/api/auth/send-otp', async (req, res) => {
    const { email } = req.body;
    const gmailUser = process.env.GMAIL_USER;

    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!gmailUser) return res.status(500).json({ error: 'Email configuration missing' });

    try {
      // Check if user exists
      try {
        await auth.getUserByEmail(email);
      } catch (err) {
        return res.status(404).json({ error: 'No account found with this email address.' });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Store OTP in Firestore
      await db.collection('passwordResets').doc(email).set({
        otp,
        expiresAt,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Send OTP Email
      await transporter.sendMail({
        from: `"Prathiss Security" <${gmailUser}>`,
        to: email,
        subject: `${otp} is your Prathiss verification code`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
            <h2 style="color: #4f46e5; text-align: center;">Reset Your Password</h2>
            <p>We received a request to reset your password. Use the verification code below to proceed:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background-color: #f3f4f6; color: #111827; padding: 20px 40px; border-radius: 12px; font-size: 32px; font-weight: bold; letter-spacing: 8px;">
                ${otp}
              </div>
            </div>
            <p style="color: #666; font-size: 14px; text-align: center;">This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px; text-align: center;">© 2026 Prathiss. All rights reserved.</p>
          </div>
        `,
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('OTP send error:', error);
      res.status(500).json({ error: 'Failed to send OTP email', details: error.message });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const resetRef = db.collection('passwordResets').doc(email);
      const resetDoc = await resetRef.get();

      if (!resetDoc.exists) {
        return res.status(400).json({ error: 'No reset request found for this email.' });
      }

      const data = resetDoc.data();
      if (data?.otp !== otp) {
        return res.status(400).json({ error: 'Invalid verification code.' });
      }

      if (Date.now() > data.expiresAt) {
        return res.status(400).json({ error: 'Verification code has expired.' });
      }

      // Update user password using Admin SDK
      const user = await auth.getUserByEmail(email);
      await auth.updateUser(user.uid, {
        password: newPassword
      });

      // Delete the reset request
      await resetRef.delete();

      res.json({ success: true });
    } catch (error: any) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: 'Failed to reset password', details: error.message });
    }
  });

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production' && !process.env.NETLIFY) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.NETLIFY) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

if (!process.env.NETLIFY) {
  startServer();
}
