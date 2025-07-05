
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { HelmModule } from './helm/helm.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { App } from '@app/app.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HelmModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'helm_apps',
      entities: [App],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([App]),
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [AppService, TypeOrmModule], // Export AppService and TypeOrmModule
})
export class AppModule {}
