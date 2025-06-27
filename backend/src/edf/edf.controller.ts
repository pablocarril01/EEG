import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { EdfService } from './edf.service';
import type { Response } from 'express';

@Controller('api/edf')
export class EdfController {
  constructor(private readonly edfService: EdfService) {}

  @Get()
  downloadEdf(
    @Query('paciente') paciente: string,
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
    @Res() res: Response,
  ) {
    if (!paciente || !desde || !hasta) {
      throw new BadRequestException(
        'Faltan parámetros: paciente, desde, hasta',
      );
    }
    this.edfService.generarEdf(paciente, desde, hasta, res);
  }
}
