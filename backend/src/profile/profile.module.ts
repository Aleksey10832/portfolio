import { Module } from '@nestjs/common';
import { ProfileResolver } from './profile.resolver';
import { ProfileService } from './profile.service';

@Module({
  providers: [ProfileService, ProfileResolver],
})
export class ProfileModule {}
