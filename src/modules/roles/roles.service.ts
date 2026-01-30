import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role, Permission } from '../../database/entities';
import { PaginatedResult } from '../../common/interfaces';
import {
  CreateRoleDto,
  UpdateRoleDto,
  QueryRoleDto,
  RoleResponseDto,
  AssignPermissionsDto,
} from './dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const { name, permissionIds, ...rest } = createRoleDto;

    // Check if name already exists
    const existingRole = await this.roleRepository.findOne({
      where: { name },
    });
    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }

    // Validate permissions if provided
    let permissions: Permission[] = [];
    if (permissionIds?.length) {
      permissions = await this.permissionRepository.find({
        where: { id: In(permissionIds) },
      });
      if (permissions.length !== permissionIds.length) {
        throw new BadRequestException('One or more permission IDs are invalid');
      }
    }

    const role = this.roleRepository.create({
      name,
      displayName: rest.displayName || name.charAt(0).toUpperCase() + name.slice(1),
      ...rest,
      permissions,
    });

    return this.roleRepository.save(role);
  }

  async findAll(query: QueryRoleDto): Promise<PaginatedResult<RoleResponseDto>> {
    const { page, limit, sortBy = 'createdAt', sortOrder, search, isActive, isSystem } =
      query;

    const queryBuilder = this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permission');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(role.name ILIKE :search OR role.displayName ILIKE :search OR role.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Active filter
    if (isActive !== undefined) {
      queryBuilder.andWhere('role.isActive = :isActive', { isActive });
    }

    // System filter
    if (isSystem !== undefined) {
      queryBuilder.andWhere('role.isSystem = :isSystem', { isSystem });
    }

    // Exclude soft deleted
    queryBuilder.andWhere('role.deletedAt IS NULL');

    // Sorting
    const validSortFields = ['createdAt', 'updatedAt', 'name', 'displayName'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`role.${sortField}`, sortOrder);

    // Get total count
    const total = await queryBuilder.getCount();

    // Pagination
    const roles = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data: RoleResponseDto.fromEntities(roles),
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

  async findAllSimple(): Promise<Role[]> {
    return this.roleRepository.find({
      where: { isActive: true },
      select: ['id', 'name', 'displayName'],
      order: { displayName: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { name },
      relations: ['permissions'],
    });
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new BadRequestException('System roles cannot be modified');
    }

    const { name, permissionIds, ...rest } = updateRoleDto;

    // Check if name is being changed and already exists
    if (name && name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name },
      });
      if (existingRole) {
        throw new ConflictException('Role with this name already exists');
      }
      role.name = name;
    }

    // Update permissions if provided
    if (permissionIds !== undefined) {
      if (permissionIds.length > 0) {
        const permissions = await this.permissionRepository.find({
          where: { id: In(permissionIds) },
        });
        if (permissions.length !== permissionIds.length) {
          throw new BadRequestException(
            'One or more permission IDs are invalid',
          );
        }
        role.permissions = permissions;
      } else {
        role.permissions = [];
      }
    }

    Object.assign(role, rest);

    return this.roleRepository.save(role);
  }

  async assignPermissions(
    id: string,
    assignPermissionsDto: AssignPermissionsDto,
  ): Promise<Role> {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new BadRequestException(
        'System role permissions cannot be modified',
      );
    }

    const { permissionIds } = assignPermissionsDto;

    if (permissionIds.length > 0) {
      const permissions = await this.permissionRepository.find({
        where: { id: In(permissionIds) },
      });
      if (permissions.length !== permissionIds.length) {
        throw new BadRequestException(
          'One or more permission IDs are invalid',
        );
      }
      role.permissions = permissions;
    } else {
      role.permissions = [];
    }

    return this.roleRepository.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new BadRequestException('System roles cannot be deleted');
    }

    await this.roleRepository.softRemove(role);
  }

  async count(): Promise<number> {
    return this.roleRepository.count();
  }
}
