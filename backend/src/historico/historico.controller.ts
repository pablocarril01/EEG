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

    // Ruta al script Python
    const scriptPath = path.join(process.cwd(), 'scripts', 'postgres-edf.py');
    if (!fs.existsSync(scriptPath)) {
      this.logger.error(`Script no encontrado en ${scriptPath}`);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'Script EDF no encontrado en el servidor' });
    }

    // Ejecutable Python dentro del virtualenv
    const pythonBin = path.join(process.cwd(), 'venv', 'bin', 'python');
    if (!fs.existsSync(pythonBin)) {
      this.logger.error(`Python del virtualenv no encontrado en ${pythonBin}`);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'Python virtualenv no encontrado' });
    }

    // Lanza el script con el Python del venv
    const py = spawn(pythonBin, [scriptPath, paciente, start, end], {
      env: process.env,
      cwd: path.dirname(scriptPath),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Captura fallos al arrancar el proceso
    py.on('error', (err) => {
      this.logger.error('Error arrancando Python', err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({
          error: 'No se pudo ejecutar el script EDF',
          details: err.message,
        });
    });

    // Acumula stderr para diagnóstico
    let stderr = '';
    py.stderr.on('data', (chunk) => {
      const msg = chunk.toString();
      stderr += msg;
      this.logger.warn(`Python stderr: ${msg}`);
    });

    // Prepara headers para la descarga
    const filename = `${paciente}_${start.replace(/-/g, '')}-${end.replace(/-/g, '')}.edf`;
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    // Envía stdout directamente al cliente
    py.stdout.pipe(res);

    // Al cerrar el proceso, comprueba el código de salida
    py.on('close', (code) => {
      if (code !== 0) {
        this.logger.error(
          `Script EDF finalizó con código ${code}\nStderr completo:\n${stderr}`,
        );
        if (!res.headersSent) {
          res
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .json({ error: 'Error generando archivo EDF', details: stderr });
        }
      }
    });
  }
}
