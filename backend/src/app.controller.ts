import { Controller, Get, Param, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api/hexValues')
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Llamado desde el frontend al pulsar "Cargar Datos".
   * Permite opcionalmente filtrar por canal.
   */
  @Get('PEPI/:usuarioId')
  async iniciarDatos(
    @Param('usuarioId') usuarioId: string,
    @Query('canalId') canalIdStr?: string,
  ): Promise<{ mensaje: string }> {
    const canalId =
      canalIdStr !== undefined ? parseInt(canalIdStr, 10) : undefined;

    console.log(
      `📨 [Controller] Recibida petición para usuario ${usuarioId}, canalId: ${canalId}`,
    );

    // 👇 canalId es de tipo number | undefined
    await this.appService.procesarYEmitirDatos(usuarioId, canalId);

    console.log(
      `✅ [Controller] Servicio procesó y emitió datos para ${usuarioId}`,
    );

    return {
      mensaje:
        `Datos procesados y enviados para ${usuarioId}` +
        (canalId !== undefined ? ` (canal ${canalId})` : ''),
    };
  }
}
