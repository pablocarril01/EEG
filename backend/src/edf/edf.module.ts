import { Module } from '@nestjs/common';
import { EdfService } from './edf.service';
import { EdfController } from './edf.controller';

@Module({
  providers: [EdfService],
  controllers: [EdfController],
})
export class EdfModule {}
