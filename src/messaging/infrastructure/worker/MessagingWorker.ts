import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import nodeHtmlToImage from 'node-html-to-image';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

async function runWorker() {
    while (true) {
        const { data: messages } = await supabase
            .from('MessagingOutbox')
            .select('*')
            .eq('status', 'PENDING')
            .limit(1);

        if (messages && messages.length > 0) {
            const msg = messages[0];
            try {
                await supabase.from('MessagingOutbox').update({ status: 'PROCESSING' }).eq('id', msg.id);

                if (msg.type === 'WEEKLY_STATS') {
                    const stats = msg.payload.stats;
                    const total = (stats.completed || 0) + (stats.notStarted || 0) + (stats.inProgress || 0);
                    const percentage = total > 0 ? (stats.completed / total) * 100 : 0;

                    const image = await nodeHtmlToImage({
                        html: '<html><body><div style="background: conic-gradient(#4caf50 {{p}}%, #eee 0); width:100px; height:100px; border-radius:50%;"></div></body></html>',
                        content: { p: percentage }
                    }) as Buffer;

                    await transporter.sendMail({
                        from: process.env.SMTP_FROM,
                        to: msg.payload.email,
                        subject: msg.payload.subject,
                        html: '<p>Tu balance semanal.</p>',
                        attachments: [{ filename: 'stats.png', content: image }]
                    });
                } else {
                    await transporter.sendMail({
                        from: process.env.SMTP_FROM,
                        to: msg.payload.email,
                        subject: msg.payload.subject,
                        text: msg.payload.body
                    });
                }

                await supabase.from('MessagingOutbox').delete().eq('id', msg.id);
            } catch (err: any) {
                await supabase.from('MessagingOutbox').update({ status: 'FAILED', last_error: err.message }).eq('id', msg.id);
            }
        }
        await new Promise(r => setTimeout(r, 10000));
    }
}

runWorker();