import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hexValues/:proyectoId/:usuarioId')
  async getProyecto(
    @Param('proyectoId') proyectoId: string,
    @Param('usuarioId') usuarioId: string,
  ) {
    console.log('✅ Entró en getHexValues controlador');
    return await this.appService.getProyectoInfo(proyectoId, usuarioId);
  }
}
