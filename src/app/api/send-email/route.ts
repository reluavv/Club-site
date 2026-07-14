
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { verifyAuthToken } from '@/lib/serverAuth';

export async function POST(request: Request) {
    try {
        // 1. Verify Firebase Auth token — only authenticated users can send emails
        const authResult = await verifyAuthToken(request);
        if (!authResult) {
            return NextResponse.json(
                { error: 'Unauthorized — valid authentication required' },
                { status: 401 }
            );
        }

        // 2. Parse and validate request body
        const { to, subject, text, html } = await request.json();

        if (!to || !subject || (!text && !html)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 3. Send email via Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
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
