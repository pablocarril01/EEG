// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import historicoRouter from './historico/historico';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Aquí obtenemos la instancia de Express que usa Nest:
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use('/api/historico', historicoRouter);

  app.enableCors({
    origin: ['http://localhost:3001', 'http://193.146.34.10'],
    credentials: true,
  });

  await app.listen(3000, '0.0.0.0');
}
bootstrap();
