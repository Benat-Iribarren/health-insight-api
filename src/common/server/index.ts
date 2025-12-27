import { buildServer } from './serverBuild';

const start = async () => {
    const server = await buildServer();

    try {
        await server.listen({ port: 3000, host: '0.0.0.0' });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();