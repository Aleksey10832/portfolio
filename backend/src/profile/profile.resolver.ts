import { Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import type { Profile as ProfileRecord } from '@prisma/client';
import { Experience } from './models/experience.model';
import { Profile } from './models/profile.model';
import { ProfileLink } from './models/profile-link.model';
import { Project } from './models/project.model';
import { Skill } from './models/skill.model';
import { ProfileService } from './profile.service';

@Resolver(() => Profile)
export class ProfileResolver {
  constructor(private readonly profileService: ProfileService) {}

  @Query(() => Profile, { description: 'Профиль владельца визитки' })
  profile(): Promise<ProfileRecord> {
    return this.profileService.getProfile();
  }

  @ResolveField(() => [ProfileLink])
  links(@Parent() profile: ProfileRecord): Promise<ProfileLink[]> {
    return this.profileService.getLinks(profile.id);
  }

  @ResolveField(() => [Skill])
  skills(@Parent() profile: ProfileRecord): Promise<Skill[]> {
    return this.profileService.getSkills(profile.id);
  }

  @ResolveField(() => [Experience])
  experience(@Parent() profile: ProfileRecord): Promise<Experience[]> {
    return this.profileService.getExperience(profile.id);
  }

  @ResolveField(() => [Project])
  projects(@Parent() profile: ProfileRecord): Promise<Project[]> {
    return this.profileService.getProjects(profile.id);
  }
}
