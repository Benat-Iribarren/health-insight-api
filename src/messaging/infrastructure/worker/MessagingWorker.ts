import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import nodeHtmlToImage from 'node-html-to-image';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    process.exit(1);
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const htmlTemplate = `
<html>
<head>
    <style>
        body { font-family: Arial; background: #f4f4f4; padding: 20px; }
        .card { background: white; border-radius: 8px; padding: 20px; text-align: center; }
        .donut { width: 200px; height: 200px; border-radius: 50%; background: conic-gradient(#4caf50 {{percentage}}%, #e0e0e0 0); margin: auto; }
    </style>
</head>
<body>
    <div class="card">
        <h2>Progreso de {{patientName}}</h2>
        <div class="donut"></div>
        <p>{{completed}} sesiones completadas de {{total}}</p>
    </div>
</body>
</html>
`;

async function runWorker() {
    while (true) {
        const { data: messages, error } = await supabase
            .from('MessagingOutbox')
            .select('*')
            .eq('status', 'PENDING')
            .limit(10);

        if (error || !messages || messages.length === 0) {
            await new Promise(r => setTimeout(r, 30000));
            continue;
        }

        for (const msg of messages) {
            try {
                await supabase.from('MessagingOutbox').update({ status: 'PROCESSING' }).eq('id', msg.id);

                const stats = msg.payload.stats;
                const total = (stats.completed || 0) + (stats.notStarted || 0) + (stats.inProgress || 0);
                const percentage = total > 0 ? (stats.completed / total) * 100 : 0;

                const image = await nodeHtmlToImage({
                    html: htmlTemplate,
                    content: {
                        patientName: stats.patientName,
                        completed: stats.completed,
                        total: total,
                        percentage: percentage
                    }
                }) as Buffer;

                await transporter.sendMail({
                    from: process.env.SMTP_FROM,
                    to: msg.payload.email,
                    subject: msg.payload.subject,
                    html: '<p>Adjunto encontrarás tu balance semanal.</p>',
                    attachments: [{ filename: 'balance.png', content: image }]
                });

                await supabase.from('MessagingOutbox').update({ status: 'SENT', updated_at: new Date() }).eq('id', msg.id);
            } catch (err: any) {
                await supabase.from('MessagingOutbox').update({
                    status: 'FAILED',
                    last_error: err.message,
                    updated_at: new Date()
                }).eq('id', msg.id);
            }
        }
    }
}

runWorker();