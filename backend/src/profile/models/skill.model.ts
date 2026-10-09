import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Навык' })
export class Skill {
  @Field(() => Int)
  id!: number;

  @Field()
  name!: string;
}
