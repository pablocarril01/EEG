import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pepi } from './entities/pepi.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.PG_HOST,
      port: parseInt(process.env.PG_PORT || '5432', 10),
      username: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      database: process.env.PG_DATABASE,
      entities: [Pepi],
      synchronize: false, // usa migraciones en producción
    }),
    TypeOrmModule.forFeature([Pepi]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}