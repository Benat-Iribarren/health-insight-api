import { build, start } from './serverBuild';

const fastify = build();

if (require.main === module) {
    const PORT = 3000; start(fastify, PORT);
}

export default fastify;