import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToOne, UpdateDateColumn } from 'typeorm';
import { Field, ObjectType } from 'type-graphql';
import { User } from './User';
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType()
@Entity()
export class Wallet extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.wallet)
  user: User;

  @Field(() => GraphQLJSONObject, { nullable: true })
  @Column('simple-json', { nullable: true })
  tokens: Record<
    string,
    {
      qty: number;
      investimentValue: number;
      currentFiatValue: number;
      currentTotalValue: number;
    }
  >;

  @UpdateDateColumn()
  updatedDate: Date;
}
