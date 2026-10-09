import { Module } from '@nestjs/common';
import { DatabaseSeeder } from './database-seeder.service';

@Module({
  providers: [DatabaseSeeder],
})
export class DatabaseModule {}
