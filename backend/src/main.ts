import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';
import {
  API_PREFIX,
  DEFAULT_MONGODB_URI,
  DEFAULT_PORT,
  MONGODB_COLLECTION_APP_USERS,
  MONGODB_DB_NAME,
} from './constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({ origin: true, credentials: true });

  const port = process.env.PORT ?? DEFAULT_PORT;
  await app.listen(port);

  const mongoUri = process.env.MONGODB_URI ?? DEFAULT_MONGODB_URI;
  const safeUri = mongoUri.replace(/:[^:@]+@/, ':***@');
  const logger = new Logger('Bootstrap');
  logger.log(`Backend listening on port ${port} (prefix /${API_PREFIX})`);
  logger.log(
    `MongoDB: ${safeUri} (db: ${MONGODB_DB_NAME}, collection: ${MONGODB_COLLECTION_APP_USERS})`,
  );
}
void bootstrap();
