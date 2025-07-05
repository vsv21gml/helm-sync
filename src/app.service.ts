import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { App, AppStatus } from '@app/app.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(App)
    private appRepository: Repository<App>,
  ) {}

  async create(appData: Partial<App>): Promise<App> {
    const newApp = this.appRepository.create(appData);
    return this.appRepository.save(newApp);
  }

  async findAll(): Promise<App[]> {
    return this.appRepository.find();
  }

  async findOne(releaseName: string): Promise<App | null> {
    return this.appRepository.findOne({ where: { releaseName } });
  }

  async update(releaseName: string, appData: Partial<App>): Promise<App | null> {
    await this.appRepository.update({ releaseName }, appData);
    return this.appRepository.findOne({ where: { releaseName } });
  }

  async remove(releaseName: string): Promise<void> {
    // Instead of deleting, we update the status to 'deleted'
    await this.appRepository.update({ releaseName }, { status: AppStatus.DELETED });
  }
}