import 'dotenv/config';
import { startMongo } from './config/database/mongoConnect.service';
import app from './app';
import { EnvironmentVariables } from './helpers/env/environmentVariables';
import { assertEnvDefined } from './helpers/env/environmentVariablesChecker';
import { logger } from './config/logger';

async function bootstrap() {
  try {
    assertEnvDefined(EnvironmentVariables, { label: 'Startup check' });

    await startMongo();

    const PORT = EnvironmentVariables.PORT ?? 3333;
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
