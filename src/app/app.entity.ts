import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AppStatus {
  RUNNING = 'running',
  DELETED = 'deleted',
}

@Entity('app') // Table name in PostgreSQL
export class App {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  chartUrl: string;

  @Column()
  chartVersion: string;

  @Column({ unique: true })
  releaseName: string;

  @Column()
  namespace: string;

  @Column({ type: 'jsonb' }) // Use jsonb for JSON data in PostgreSQL
  values: object; // Use object for JSON type in TypeORM

  @Column({ type: 'enum', enum: AppStatus, default: AppStatus.RUNNING })
  status: AppStatus; // New status column

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
