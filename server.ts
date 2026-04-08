import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Email Transporter - Using explicit SMTP settings for Gmail
  const transporter = nodemailer.createTransport({
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
  transporter.verify((error) => {
    if (error) {
      console.error('Email Transporter Error:', error.message);
      if (error.message.includes('EAUTH') || error.message.includes('Invalid login')) {
        console.warn('CRITICAL: Gmail authentication failed. Please check your App Password.');
      }
    } else {
      console.log('Email server is ready to send messages');
    }
  });

  // API Routes
  app.post('/api/send-verification', async (req, res) => {
    const { email, token } = req.body;
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    const adminEmail = process.env.ADMIN_EMAIL || 'jithinullodi@gmail.com';
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
    const adminEmail = process.env.ADMIN_EMAIL || 'jithinullodi@gmail.com';

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

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
