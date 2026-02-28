import mongoose from 'mongoose';
import { EnvironmentVariables } from '../../helpers/env/environmentVariables';
import { logger } from '../logger';

export async function startMongo(): Promise<void> {
  const uri = EnvironmentVariables.MONGODB_URL;

  if (!uri) {
    throw new Error(
      'MongoDB URL is not defined in .env!! Server cannot start!',
    );
  }

  await mongoose.connect(uri);
  logger.info('MongoDB connected successfully');
}
