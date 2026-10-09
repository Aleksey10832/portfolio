import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Профиль владельца цифровой визитки' })
export class Profile {
  @Field(() => Int)
  id!: number;

  @Field()
  name!: string;

  @Field()
  description!: string;
}
