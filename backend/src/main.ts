import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });
  await app.listen(3000, '0.0.0.0');
  app.enableCors({
    origin: ['http://localhost:3001', 'http://193.146.34.10'],
    credentials: true,
  });
}

bootstrap();
