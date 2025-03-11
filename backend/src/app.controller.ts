import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api/hexValues')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get(':proyectoId/:usuarioId')
  async obtenerUltimosDatos(
    @Param('proyectoId') proyectoId: string,
    @Param('usuarioId') usuarioId: string,
  ) {
    return { datos: await this.appService.getHexValues(proyectoId, usuarioId) };
  }
}
