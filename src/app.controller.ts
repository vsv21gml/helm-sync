import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AppService } from './app.service';
import { App } from '@app/app.entity';

@Controller('apps')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  async create(@Body() appData: Partial<App>): Promise<App> {
    return this.appService.create(appData);
  }

  @Get()
  async findAll(): Promise<App[]> {
    return this.appService.findAll();
  }

  @Get(':releaseName')
  async findOne(
    @Param('releaseName') releaseName: string,
  ): Promise<App | null> {
    return this.appService.findOne(releaseName);
  }

  @Put(':releaseName')
  async update(
    @Param('releaseName') releaseName: string,
    @Body() appData: Partial<App>,
  ): Promise<App | null> {
    return this.appService.update(releaseName, appData);
  }

  @Delete(':releaseName')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('releaseName') releaseName: string): Promise<void> {
    await this.appService.remove(releaseName);
  }
}
