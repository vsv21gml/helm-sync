import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as yaml from 'js-yaml';
import { AppService } from '../app.service';
import { AppStatus } from '@app/app.entity';

const execPromise = promisify(exec);

@Injectable()
export class HelmService {
  private readonly logger = new Logger(HelmService.name);

  constructor(private appService: AppService) {}

  async installOrUpgrade(
    releaseName: string,
    chartUrl: string,
    chartVersion: string,
    namespace: string,
    values: object,
  ): Promise<string> {
    const valuesYaml: string = yaml.dump(values);
    // Construct the command to pipe valuesYaml to helm's stdin
    const command = `echo ${JSON.stringify(valuesYaml)} | helm upgrade --install ${releaseName} ${chartUrl} --version ${chartVersion} --namespace ${namespace} --create-namespace -f -`;

    this.logger.log(`Executing Helm command: ${command}`);
    try {
      const { stdout, stderr } = await execPromise(command);
      if (stderr) {
        this.logger.warn(`Helm stderr: ${stderr}`);
      }
      this.logger.log(`Helm stdout: ${stdout}`);
      return stdout;
    } catch (error) {
      this.logger.error(
        `Failed to install/upgrade Helm release ${releaseName}: ${error.message}`,
      );
      throw new Error(`Helm command failed: ${error.message}`);
    }
  }

  async getReleaseStatus(
    releaseName: string,
    namespace: string,
  ): Promise<any | null> {
    const command = `helm status ${releaseName} --namespace ${namespace} -o json`;
    try {
      const { stdout } = await execPromise(command);
      return JSON.parse(stdout);
    } catch (error) {
      if (error.message.includes(`release: not found`)) {
        return null; // Release not found
      }
      this.logger.error(
        `Failed to get Helm release status for ${releaseName}: ${error.message}`,
      );
      throw new Error(`Helm status command failed: ${error.message}`);
    }
  }

  async uninstall(releaseName: string, namespace: string): Promise<string> {
    const command = `helm uninstall ${releaseName} --namespace ${namespace}`;
    this.logger.log(`Executing Helm command: ${command}`);
    try {
      const { stdout, stderr } = await execPromise(command);
      if (stderr) {
        this.logger.warn(`Helm stderr: ${stderr}`);
      }
      this.logger.log(`Helm stdout: ${stdout}`);
      return stdout;
    } catch (error) {
      this.logger.error(
        `Failed to uninstall Helm release ${releaseName}: ${error.message}`,
      );
      throw new Error(`Helm uninstall command failed: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleCron() {
    this.logger.debug('Running Helm synchronization job...');
    const apps = await this.appService.findAll();

    for (const app of apps) {
      try {
        const releaseStatus = await this.getReleaseStatus(
          app.releaseName,
          app.namespace,
        );

        if (app.status === AppStatus.RUNNING) {
          if (!releaseStatus) {
            // App is running in DB but not in cluster, install it
            this.logger.log(
              `App ${app.releaseName} (status: RUNNING) not found in cluster. Installing...`,
            );
            await this.installOrUpgrade(
              app.releaseName,
              app.chartUrl,
              app.chartVersion,
              app.namespace,
              app.values,
            );
          } else {
            // App is running in DB and in cluster, check if update is needed
            const helmLastDeployedStr = releaseStatus.info.last_deployed;
            const helmLastDeployed = new Date(helmLastDeployedStr);
            const appUpdatedAt = app.updatedAt; // This is already a Date object from TypeORM

            if (appUpdatedAt.getTime() > helmLastDeployed.getTime()) {
              this.logger.log(
                `App ${app.releaseName} (status: RUNNING) in DB is newer than deployed Helm release. Upgrading...`,
              );
              await this.installOrUpgrade(
                app.releaseName,
                app.chartUrl,
                app.chartVersion,
                app.namespace,
                app.values,
              );
            } else {
              this.logger.log(
                `App ${app.releaseName} (status: RUNNING) in DB is up to date with deployed Helm release.`,
              );
            }
          }
        } else if (app.status === AppStatus.DELETED) {
          if (releaseStatus) {
            // App is deleted in DB but still in cluster, uninstall it
            this.logger.log(
              `App ${app.releaseName} (status: DELETED) found in cluster. Uninstalling...`,
            );
            await this.uninstall(app.releaseName, app.namespace);
            // Optionally, remove from DB after successful uninstall
            // await this.appService.remove(app.releaseName); // This would permanently delete from DB
          } else {
            this.logger.log(
              `App ${app.releaseName} (status: DELETED) not found in cluster. No action needed.`,
            );
          }
        }
      } catch (error) {
        this.logger.error(
          `Error synchronizing Helm release ${app.releaseName}: ${error.message}`,
        );
      }
    }
  }
}
