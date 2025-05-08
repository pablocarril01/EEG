import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './redis/redis.module';
import { DatosGateway } from './gateways/datos.gateway';
import { RedisProvider } from './redis/redis.provider';

// Asegúrate de importar correctamente los filtros si fueran necesarios

@Module({
  imports: [RedisModule],
  controllers: [AppController],
  providers: [AppService, DatosGateway, RedisProvider],
})
export class AppModule {}
