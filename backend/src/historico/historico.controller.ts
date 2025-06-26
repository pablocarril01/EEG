import {
  Controller,
  Get,
  Query,
  Res,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

@Controller('historico')
export class HistoricoController {
  private readonly logger = new Logger(HistoricoController.name);

  @Get('edf')
  downloadEdf(
    @Query('paciente') paciente: string,
    @Query('start') start: string,
    @Query('end') end: string,
    @Res() res: Response,
  ) {
    // 1) Validar params
    if (!paciente || !start || !end) {
      throw new BadRequestException(
        'Parámetros inválidos. Usa /api/historico/edf?paciente=XXX&start=YYYY-MM-DD&end=YYYY-MM-DD',
      );
    }

    // 2) Comprobar script Python
    const scriptPath = path.join(process.cwd(), 'scripts', 'postgres-edf.py');
    if (!fs.existsSync(scriptPath)) {
      this.logger.error(`Script no encontrado: ${scriptPath}`);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'Script EDF no encontrado en el servidor' });
    }

    // 3) Apuntar al Python del virtualenv (ajusta si tu venv está en otra ruta)
    const pythonBin = path.join(process.cwd(), 'venv', 'bin', 'python');
    if (!fs.existsSync(pythonBin)) {
      this.logger.error(`Python virtualenv no encontrado: ${pythonBin}`);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'Python virtualenv no encontrado' });
    }

    // 4) Preparar headers de descarga
    const filename = `${paciente}_${start.replace(/-/g, '')}-${end.replace(/-/g, '')}.edf`;
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    // 5) Ejecutar el script con el Python correcto
    const py = spawn(pythonBin, [scriptPath, paciente, start, end], {
      env: process.env,
      cwd: path.dirname(scriptPath),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // 6) Capturar errores de arranque
    py.on('error', (err) => {
      this.logger.error('Error arrancando Python:', err.message);
      if (!res.headersSent) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          error: 'No se pudo ejecutar el script EDF',
          details: err.message,
        });
      }
    });

    // 7) Acumular stderr para diagnóstico
    let stderr = '';
    py.stderr.on('data', (chunk) => {
      const msg = chunk.toString();
      stderr += msg;
      this.logger.warn(`Python stderr: ${msg}`);
    });

    // 8) Enviar stdout (EDF) directamente al cliente
    py.stdout.pipe(res);

    // 9) Al cerrar, revisar código de salida
    py.on('close', (code) => {
      if (code !== 0) {
        this.logger.error(
          `Script EDF finalizó con código ${code}\nStderr completo:\n${stderr}`,
        );
        // Si aún no se envió cuerpo, mandamos JSON de error
        if (!res.headersSent) {
          res
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .json({ error: 'Error generando archivo EDF', details: stderr });
        }
      }
    });
  }
}
