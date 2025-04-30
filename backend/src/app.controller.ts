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

    const resultado = await this.appService.getProyectoInfo(
      proyectoId,
      usuarioId,
    );

    // Aquí también devolvemos un resumen útil en la respuesta HTTP
    return {
      status: 'ok',
      datos: resultado.datos.slice(-10), // opcional: último bloque para debug
      total: resultado.datos.length,
      comentarios: resultado.comentarios,
    };
  }
}
