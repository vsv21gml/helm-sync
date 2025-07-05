import { Module } from '@nestjs/common';
import { HelmService } from './helm.service';
import { AppService } from '../app.service'; // Import AppService
import { TypeOrmModule } from '@nestjs/typeorm';
import { App } from '@app/app.entity';

@Module({
  imports: [TypeOrmModule.forFeature([App])], // Import TypeOrmModule.forFeature for App entity
  providers: [HelmService, AppService], // Provide AppService here
  exports: [HelmService],
})
export class HelmModule {}
