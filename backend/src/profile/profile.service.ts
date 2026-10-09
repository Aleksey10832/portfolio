import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  Experience as ExperienceRecord,
  Profile as ProfileRecord,
  Project as ProjectRecord,
  ProfileLink as ProfileLinkRecord,
  Skill as SkillRecord,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(): Promise<ProfileRecord> {
    const profile = await this.prisma.profile.findFirst({
      orderBy: { id: 'asc' },
    });

    if (!profile) {
      throw new NotFoundException('Профиль не найден');
    }

    return profile;
  }

  getLinks(profileId: number): Promise<ProfileLinkRecord[]> {
    return this.prisma.profileLink.findMany({
      where: { profileId },
      orderBy: { id: 'asc' },
    });
  }

  getSkills(profileId: number): Promise<SkillRecord[]> {
    return this.prisma.skill.findMany({
      where: { profileId },
      orderBy: { id: 'asc' },
    });
  }

  getExperience(profileId: number): Promise<ExperienceRecord[]> {
    return this.prisma.experience.findMany({
      where: { profileId },
      orderBy: { id: 'asc' },
    });
  }

  getProjects(profileId: number): Promise<ProjectRecord[]> {
    return this.prisma.project.findMany({
      where: { profileId },
      orderBy: { id: 'asc' },
    });
  }
}
