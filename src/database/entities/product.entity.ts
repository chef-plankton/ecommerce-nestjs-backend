import {
  Entity,
  Column,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Category } from './category.entity';
import { ProductVariant } from './product-variant.entity';
import { Tag } from './tag.entity';
import { ProductStatus } from '../../common/enums';

@Entity('products')
export class Product extends BaseEntity {
  @Column({ length: 255 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  shortDescription?: string;

  @Index({ unique: true })
  @Column({ length: 100, unique: true })
  sku: string;

  @Column({ type: 'decimal', precision: 12, scale: 0 })
  price: number;

  @Column({ type: 'decimal', precision: 12, scale: 0, nullable: true })
  compareAtPrice?: number;

  @Column({ type: 'decimal', precision: 12, scale: 0, nullable: true })
  costPrice?: number;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'int', default: 5 })
  lowStockThreshold: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight?: number;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  status: ProductStatus;

  @Column({ type: 'text', array: true, default: '{}' })
  images: string[];

  @Column({ type: 'uuid', nullable: true })
  categoryId?: string;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category?: Category;

  @Column({ default: false })
  hasVariants: boolean;

  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
  })
  variants: ProductVariant[];

  @ManyToMany(() => Tag, (tag) => tag.products)
  tags: Tag[];

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  get isInStock(): boolean {
    if (this.hasVariants && this.variants) {
      return this.variants.some((v) => v.quantity > 0 && v.isActive);
    }
    return this.quantity > 0;
  }

  get isLowStock(): boolean {
    if (this.hasVariants && this.variants) {
      return this.variants.some(
        (v) => v.quantity <= this.lowStockThreshold && v.quantity > 0 && v.isActive,
      );
    }
    return this.quantity <= this.lowStockThreshold && this.quantity > 0;
  }
}
