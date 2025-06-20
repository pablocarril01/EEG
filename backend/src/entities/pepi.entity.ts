import { Entity, PrimaryColumn, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('pepi')
export class Pepi {
  // `ts` forma parte de la PK
  @PrimaryColumn({ type: 'timestamptz', name: 'ts' })
  ts: Date;

  // `id` también parte de la PK, generado en la base
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'id_paciente', type: 'text' })
  idPaciente: string;

  @Column('double precision', { name: 'fp1' }) fp1: number;
  @Column('double precision', { name: 'fp2' }) fp2: number;
  @Column('double precision', { name: 't3' })  t3: number;
  @Column('double precision', { name: 't4' })  t4: number;
  @Column('double precision', { name: 'o1' })  o1: number;
  @Column('double precision', { name: 'o2' })  o2: number;
  @Column('double precision', { name: 'c3' })  c3: number;
  @Column('double precision', { name: 'c4' })  c4: number;

  @Column({ type: 'boolean', default: false })
  evento: boolean;
}
