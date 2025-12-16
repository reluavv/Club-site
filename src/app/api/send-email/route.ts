
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    try {
        const { to, subject, text, html } = await request.json();

        if (!to || !subject || (!text && !html)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

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
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
