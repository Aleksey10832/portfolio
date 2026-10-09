import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { profileSeed } from './seed-data';

@Injectable()
export class DatabaseSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    const profilesCount = await this.prisma.profile.count();

    if (profilesCount > 0) {
      this.logger.log('Профиль уже существует, заполнение пропущено');
      return;
    }

    await this.prisma.profile.create({ data: profileSeed });
    this.logger.log('База данных заполнена демонстрационным профилем');
  }
}
