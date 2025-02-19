import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { connectRedis } from './redis/redis.provider';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Habilitar CORS
  await connectRedis(); // Conectar Redis
  await app.listen(3000);
  console.log('Backend corriendo en http://localhost:3000');
}

bootstrap();
