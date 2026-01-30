import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../../database/entities';
import { PaginatedResult } from '../../common/interfaces';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import {
  CreatePermissionDto,
  UpdatePermissionDto,
  PermissionResponseDto,
} from './dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const { name, ...rest } = createPermissionDto;

    // Check if name already exists
    const existingPermission = await this.permissionRepository.findOne({
      where: { name },
    });
    if (existingPermission) {
      throw new ConflictException('Permission with this name already exists');
    }

    const permission = this.permissionRepository.create({
      name,
      displayName:
        rest.displayName ||
        name
          .split('.')
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' '),
      ...rest,
    });

    return this.permissionRepository.save(permission);
  }

  async findAll(
    query: PaginationDto,
  ): Promise<PaginatedResult<PermissionResponseDto>> {
    const { page, limit, sortBy = 'module', sortOrder, search } = query;

    const queryBuilder = this.permissionRepository.createQueryBuilder('permission');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(permission.name ILIKE :search OR permission.displayName ILIKE :search OR permission.module ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Exclude soft deleted
    queryBuilder.andWhere('permission.deletedAt IS NULL');

    // Sorting
    const validSortFields = [
      'createdAt',
      'name',
      'displayName',
      'module',
      'action',
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'module';
    queryBuilder.orderBy(`permission.${sortField}`, sortOrder);
    if (sortField === 'module') {
      queryBuilder.addOrderBy('permission.action', sortOrder);
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Pagination
    const permissions = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data: permissions.map((p) => PermissionResponseDto.fromEntity(p)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findAllGroupedByModule(): Promise<Record<string, Permission[]>> {
    const permissions = await this.permissionRepository.find({
      where: { isActive: true },
      order: { module: 'ASC', action: 'ASC' },
    });

    return permissions.reduce(
      (grouped, permission) => {
        const module = permission.module;
        if (!grouped[module]) {
          grouped[module] = [];
        }
        grouped[module].push(permission);
        return grouped;
      },
      {} as Record<string, Permission[]>,
    );
  }

  async findOne(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return permission;
  }

  async findByName(name: string): Promise<Permission | null> {
    return this.permissionRepository.findOne({
      where: { name },
    });
  }

  async update(
    id: string,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    const permission = await this.findOne(id);

    const { name, ...rest } = updatePermissionDto;

    // Check if name is being changed and already exists
    if (name && name !== permission.name) {
      const existingPermission = await this.permissionRepository.findOne({
        where: { name },
      });
      if (existingPermission) {
        throw new ConflictException('Permission with this name already exists');
      }
      permission.name = name;
    }

    Object.assign(permission, rest);

    return this.permissionRepository.save(permission);
  }

  async remove(id: string): Promise<void> {
    const permission = await this.findOne(id);
    await this.permissionRepository.softRemove(permission);
  }

  async count(): Promise<number> {
    return this.permissionRepository.count();
  }

  async seedDefaultPermissions(): Promise<void> {
    const defaultPermissions = [
      // Users module
      { name: 'users.create', module: 'users', action: 'create', displayName: 'Create Users' },
      { name: 'users.read', module: 'users', action: 'read', displayName: 'View Users' },
      { name: 'users.update', module: 'users', action: 'update', displayName: 'Update Users' },
      { name: 'users.delete', module: 'users', action: 'delete', displayName: 'Delete Users' },
      // Roles module
      { name: 'roles.create', module: 'roles', action: 'create', displayName: 'Create Roles' },
      { name: 'roles.read', module: 'roles', action: 'read', displayName: 'View Roles' },
      { name: 'roles.update', module: 'roles', action: 'update', displayName: 'Update Roles' },
      { name: 'roles.delete', module: 'roles', action: 'delete', displayName: 'Delete Roles' },
      // Products module
      { name: 'products.create', module: 'products', action: 'create', displayName: 'Create Products' },
      { name: 'products.read', module: 'products', action: 'read', displayName: 'View Products' },
      { name: 'products.update', module: 'products', action: 'update', displayName: 'Update Products' },
      { name: 'products.delete', module: 'products', action: 'delete', displayName: 'Delete Products' },
      // Orders module
      { name: 'orders.create', module: 'orders', action: 'create', displayName: 'Create Orders' },
      { name: 'orders.read', module: 'orders', action: 'read', displayName: 'View Orders' },
      { name: 'orders.update', module: 'orders', action: 'update', displayName: 'Update Orders' },
      { name: 'orders.delete', module: 'orders', action: 'delete', displayName: 'Delete Orders' },
      // Settings module
      { name: 'settings.read', module: 'settings', action: 'read', displayName: 'View Settings' },
      { name: 'settings.update', module: 'settings', action: 'update', displayName: 'Update Settings' },
    ];

    for (const permData of defaultPermissions) {
      const exists = await this.permissionRepository.findOne({
        where: { name: permData.name },
      });
      if (!exists) {
        const permission = this.permissionRepository.create(permData);
        await this.permissionRepository.save(permission);
      }
    }
  }
}
