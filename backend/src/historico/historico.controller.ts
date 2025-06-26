import {
  Controller,
  Get,
  Query,
  Res,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { spawn } from 'child_process';
import * as path from 'path';

@Controller('historico')
export class HistoricoController {
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

    // Ejecuta el script con args [paciente, start, end]
    const py = spawn('python3', [scriptPath, paciente, start, end], {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const filename = `${paciente}_${start.replace(/-/g, '')}-${end.replace(/-/g, '')}.edf`;
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    // Envía los datos EDF directamente al cliente
    py.stdout.pipe(res);

    py.stderr.on('data', (chunk) => console.error(chunk.toString()));

    py.on('close', (code) => {
      if (code !== 0) {
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .end(`Error generando EDF (exit code ${code})`);
      }
    });
  }
}
