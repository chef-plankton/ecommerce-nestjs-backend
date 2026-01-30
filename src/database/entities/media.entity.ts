import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MediaType } from '../../common/enums';

@Entity('media')
export class Media extends BaseEntity {
  @Column({ length: 255 })
  originalName: string;

  @Column({ length: 255 })
  filename: string;

  @Index()
  @Column({ length: 500 })
  path: string;

  @Column({ length: 500 })
  url: string;

  @Column({ type: 'int' })
  size: number;

  @Column({ length: 100 })
  mimeType: string;

  @Index()
  @Column({
    type: 'enum',
    enum: MediaType,
    default: MediaType.GENERAL,
  })
  type: MediaType;

  @Column({ length: 255, nullable: true })
  alt?: string;

  @Column({ length: 500, nullable: true })
  title?: string;
}
