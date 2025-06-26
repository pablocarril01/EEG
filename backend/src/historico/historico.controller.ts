// File: src/historico/historico.controller.ts
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
    if (!paciente || !start || !end) {
      throw new BadRequestException(
        'Parámetros inválidos. Usa /api/historico/edf?paciente=XXX&start=YYYY-MM-DD&end=YYYY-MM-DD',
      );
    }

    const scriptPath = path.join(process.cwd(), 'scripts', 'postgres-edf.py');
    if (!fs.existsSync(scriptPath)) {
      this.logger.error(`No existe el script en ${scriptPath}`);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'Script EDF no encontrado en el servidor' });
    }

    // Arranca el proceso
    const py = spawn('python3', [scriptPath, paciente, start, end], {
      env: process.env,
      cwd: path.dirname(scriptPath),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Capturamos errores de spawn
    py.on('error', (err) => {
      this.logger.error('Error arrancando Python', err);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'No se pudo ejecutar el script EDF' });
    });

    // Acumulamos stderr para diagnóstico
    let stderr = '';
    py.stderr.on('data', (chunk) => {
      const msg = chunk.toString();
      stderr += msg;
      this.logger.warn(`python stderr: ${msg}`);
    });

    // Preparamos headers HTTP
    const filename = `${paciente}_${start.replace(/-/g, '')}-${end.replace(/-/g, '')}.edf`;
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    // Pipe stdout al cliente
    py.stdout.pipe(res);

    py.on('close', (code) => {
      if (code !== 0) {
        this.logger.error(
          `Script EDF salió con código ${code}, stderr:\n${stderr}`,
        );
        // Si ya hemos enviado headers, el cliente verá un cuerpo vacío, así que mejor cerrar
        if (!res.headersSent) {
          res
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .json({
              error: `Error generando EDF (exit code ${code})`,
              details: stderr,
            });
        }
      }
    });
  }
}
