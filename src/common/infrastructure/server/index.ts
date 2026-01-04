import { build, start } from './serverBuild';

const fastify = build();

const PORT = Number(process.env.PORT) || 3000;

start(fastify, PORT);