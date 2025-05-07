import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatosGateway } from './gateways/datos.gateway';
import { EmisionAutomaticaService } from './servicios/emision-automatica.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, DatosGateway, EmisionAutomaticaService],
})
export class AppModule {}
