import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hexValues/:proyectoId/:usuarioId')
  async getHexValues(
    @Param('proyectoId') proyectoId: string,
    @Param('usuarioId') usuarioId: string,
  ) {
    return this.appService.getHexValues(proyectoId, usuarioId);
  }
}
