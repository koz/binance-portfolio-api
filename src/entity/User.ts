import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToOne, JoinColumn } from 'typeorm';
import { Field, ObjectType } from 'type-graphql';
import { Wallet } from './Wallet';
import { Transaction } from '../utils/types';

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column('text', { unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  binanceApiKey: string;

  @Column()
  binanceSecretKey: string;

  @Column('simple-array', { nullable: true })
  pairs: string[];

  @Field()
  @OneToOne(() => Wallet, (wallet) => wallet.user)
  @JoinColumn()
  wallet: Wallet;

  @Column('simple-array', { nullable: true })
  transactions: Transaction[][];

  @Column({ nullable: true })
  transactionsLastUpdated: number;
}
