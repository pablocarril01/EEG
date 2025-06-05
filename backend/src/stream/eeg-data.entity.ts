import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class EegData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pacienteId: string;

  @Column({ type: 'timestamptz' })
  timestamp: Date;

  @Column('float') canal1: number;
  @Column('float') canal2: number;
  @Column('float') canal3: number;
  @Column('float') canal4: number;
  @Column('float') canal5: number;
  @Column('float') canal6: number;
  @Column('float') canal7: number;
  @Column('float') canal8: number;

  @Column({ default: false })
  evento: boolean;
}
