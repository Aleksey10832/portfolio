import { registerEnumType, Field, Int, ObjectType } from '@nestjs/graphql';
import { ProjectStatus } from '@prisma/client';

registerEnumType(ProjectStatus, {
  name: 'ProjectStatus',
  description: 'Текущий статус проекта',
});

@ObjectType({ description: 'Проект' })
export class Project {
  @Field(() => Int)
  id!: number;

  @Field()
  name!: string;

  @Field()
  description!: string;

  @Field({ description: 'Ссылка на репозиторий' })
  repositoryUrl!: string;

  @Field(() => ProjectStatus)
  status!: ProjectStatus;
}
