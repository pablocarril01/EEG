import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { spawn } from 'child_process';
import { join } from 'path';
import type { Response } from 'express';

@Injectable()
export class EdfService {
  generarEdf(paciente: string, desde: string, hasta: string, res: Response) {
    const scriptPath = join(__dirname, '../scripts/postgres-edf.py');
    const py = spawn('python3', [scriptPath, paciente, desde, hasta]);

    // Cabeceras para descarga
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${paciente}_${desde.replace(/-/g, '')}-${hasta.replace(/-/g, '')}.edf"`,
    });

    // Pipe stdout del script al cliente
    py.stdout.pipe(res);

    py.stderr.on('data', (data) => {
      console.error('EDF error:', data.toString());
    });
    py.on('close', (code) => {
      if (code !== 0) {
        throw new InternalServerErrorException('Error generando EDF');
      }
      res.end();
    });
  }
}
