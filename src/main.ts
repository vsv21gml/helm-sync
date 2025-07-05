import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

async function bootstrap() {
  // Set KUBECONFIG environment variable if KUBECONFIG_PATH is provided in .env
  if (process.env.KUBECONFIG_PATH) {
    process.env.KUBECONFIG = process.env.KUBECONFIG_PATH;
    console.log(`KUBECONFIG set to: ${process.env.KUBECONFIG}`);
  }

  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();