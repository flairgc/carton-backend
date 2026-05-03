import { buildApp } from './app.js';

const app = buildApp();

async function start() {
  try {
    await app.listen({ port: app.config.PORT, host: app.config.HOST });
    app.log.info(`Server started on ${app.config.HOST}:${app.config.PORT}`);
    app.ready(() => {
      console.log(app.printRoutes());
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
