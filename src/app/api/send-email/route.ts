
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { verifyAuthToken } from '@/lib/serverAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Allowed admin roles that can send emails
const EMAIL_ALLOWED_ROLES = [
    'President', 'VP_AIML', 'VP_DSA', 'CTO', 'AdminHead',
    'PRHead', 'Treasurer', 'Mentor', 'Faculty', 'Activator', 'admin'
];

// Allowed recipient domains (prevents open relay abuse)
const ALLOWED_RECIPIENT_DOMAINS = [
    'av.students.amrita.edu',
    'av.amrita.edu',
    'gmail.com', // For reluavv@gmail.com notifications
];

export async function POST(request: Request) {
    try {
        // 1. Verify Firebase Auth token
        const authResult = await verifyAuthToken(request);
        if (!authResult) {
            return NextResponse.json(
                { error: 'Unauthorized — valid authentication required' },
                { status: 401 }
            );
        }

        // 2. Verify the user is an admin
        const adminDoc = await getDoc(doc(db, 'admins', authResult.uid));
        if (!adminDoc.exists() || !EMAIL_ALLOWED_ROLES.includes(adminDoc.data().role)) {
            return NextResponse.json(
                { error: 'Forbidden — admin role required to send emails' },
                { status: 403 }
            );
        }

        // 3. Parse and validate request body
        const { to, subject, text, html } = await request.json();

        if (!to || !subject || (!text && !html)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 4. Validate recipient domain
        const recipientDomain = to.split('@')[1]?.toLowerCase();
        if (!recipientDomain || !ALLOWED_RECIPIENT_DOMAINS.includes(recipientDomain)) {
            return NextResponse.json(
                { error: `Emails can only be sent to: ${ALLOWED_RECIPIENT_DOMAINS.join(', ')}` },
                { status: 400 }
            );
        }

        // 5. Validate field lengths
        if (subject.length > 200 || (text && text.length > 10000) || (html && html.length > 50000)) {
            return NextResponse.json({ error: 'Field length exceeds limits' }, { status: 400 });
        }

        // 6. Send email via Nodemailer (Gmail SMTP)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"ReLU - AI&ML Club" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        };

        const info = await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true, messageId: info.messageId });

    } catch (error: any) {
        console.error('Email send error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
