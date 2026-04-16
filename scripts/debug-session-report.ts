// scripts/debug-session-report-http.ts
import 'dotenv/config';
import { build } from '@common/infrastructure/server/serverBuild';

async function main() {
    const app = build();
    await app.ready();

    const res = await app.inject({
        method: 'GET',
        url: '/biometrics/session-report/1/3',
    });

    console.log('STATUS:', res.statusCode);
    console.dir(res.json(), { depth: null });

    await app.close();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});