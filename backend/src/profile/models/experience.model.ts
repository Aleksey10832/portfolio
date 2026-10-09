import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'Место работы' })
export class Experience {
  @Field(() => Int)
  id!: number;

  @Field()
  company!: string;

  @Field()
  position!: string;

  @Field({ description: 'Период работы, например "9 месяцев"' })
  period!: string;

  @Field(() => [String])
  achievements!: string[];
}
