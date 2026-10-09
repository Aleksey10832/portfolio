import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Ссылка на профессиональный ресурс' })
export class ProfileLink {
  @Field(() => Int)
  id!: number;

  @Field({ description: 'Название ресурса, например GitHub' })
  label!: string;

  @Field()
  url!: string;
}
