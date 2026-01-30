import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Role } from '../../database/entities';
import { PaginatedResult } from '../../common/interfaces';
import {
  CreateUserDto,
  UpdateUserDto,
  QueryUserDto,
  UserResponseDto,
  ChangePasswordDto,
  BulkOperationResultDto,
} from './dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, phone, roleId, ...rest } = createUserDto;

    // Check if email already exists
    const existingEmail = await this.userRepository.findOne({
      where: { email },
    });
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Check if phone already exists (if provided)
    if (phone) {
      const existingPhone = await this.userRepository.findOne({
        where: { phone },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already exists');
      }
    }

    // Validate role exists
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new BadRequestException('Invalid role ID');
    }

    const user = this.userRepository.create({
      ...rest,
      email,
      phone,
      roleId,
    });

    return this.userRepository.save(user);
  }

  async findAll(query: QueryUserDto): Promise<PaginatedResult<UserResponseDto>> {
    const {
      page,
      limit,
      sortBy = 'createdAt',
      sortOrder,
      search,
      status,
      roleId,
      gender,
      emailVerified,
      phoneVerified,
      createdAfter,
      createdBefore,
      includeDeleted,
      onlyDeleted,
    } = query;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role');

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Status filter
    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    // Role filter
    if (roleId) {
      queryBuilder.andWhere('user.roleId = :roleId', { roleId });
    }

    // Gender filter
    if (gender) {
      queryBuilder.andWhere('user.gender = :gender', { gender });
    }

    // Email verified filter
    if (emailVerified !== undefined) {
      queryBuilder.andWhere('user.emailVerified = :emailVerified', {
        emailVerified,
      });
    }

    // Phone verified filter
    if (phoneVerified !== undefined) {
      queryBuilder.andWhere('user.phoneVerified = :phoneVerified', {
        phoneVerified,
      });
    }

    // Date range filters
    if (createdAfter) {
      queryBuilder.andWhere('user.createdAt >= :createdAfter', {
        createdAfter: new Date(createdAfter),
      });
    }

    if (createdBefore) {
      queryBuilder.andWhere('user.createdAt <= :createdBefore', {
        createdBefore: new Date(createdBefore),
      });
    }

    // Soft delete filter
    if (onlyDeleted) {
      queryBuilder.withDeleted().andWhere('user.deletedAt IS NOT NULL');
    } else if (includeDeleted) {
      queryBuilder.withDeleted();
    } else {
      queryBuilder.andWhere('user.deletedAt IS NULL');
    }

    // Sorting
    const validSortFields = [
      'createdAt',
      'updatedAt',
      'firstName',
      'lastName',
      'email',
      'status',
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`user.${sortField}`, sortOrder);

    // Get total count
    const total = await queryBuilder.getCount();

    // Pagination
    const users = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data: UserResponseDto.fromEntities(users),
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

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'role.permissions'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['role', 'role.permissions'],
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'password',
        'status',
        'emailVerified',
        'roleId',
      ],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    const { email, phone, roleId, ...rest } = updateUserDto;

    // Check if email is being changed and already exists
    if (email && email !== user.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email },
      });
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
      user.email = email;
      user.emailVerified = false;
      user.emailVerifiedAt = undefined;
    }

    // Check if phone is being changed and already exists
    if (phone && phone !== user.phone) {
      const existingPhone = await this.userRepository.findOne({
        where: { phone },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already exists');
      }
      user.phone = phone;
      user.phoneVerified = false;
      user.phoneVerifiedAt = undefined;
    }

    // Validate role if being changed
    if (roleId && roleId !== user.roleId) {
      const role = await this.roleRepository.findOne({ where: { id: roleId } });
      if (!role) {
        throw new BadRequestException('Invalid role ID');
      }
      user.roleId = roleId;
    }

    Object.assign(user, rest);

    return this.userRepository.save(user);
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
    isAdmin = false,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Non-admin users must provide current password
    if (!isAdmin && changePasswordDto.currentPassword) {
      const isValidPassword = await bcrypt.compare(
        changePasswordDto.currentPassword,
        user.password,
      );
      if (!isValidPassword) {
        throw new BadRequestException('Current password is incorrect');
      }
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(changePasswordDto.newPassword, salt);

    await this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.softRemove(user);
  }

  async restore(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.deletedAt) {
      throw new BadRequestException('User is not deleted');
    }

    await this.userRepository.restore(id);
    return this.findOne(id);
  }

  async updateLastLogin(id: string, ip: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    });
  }

  async verifyEmail(id: string): Promise<void> {
    await this.userRepository.update(id, {
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });
  }

  async verifyPhone(id: string): Promise<void> {
    await this.userRepository.update(id, {
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
    });
  }

  async count(): Promise<number> {
    return this.userRepository.count();
  }

  async countByRole(roleId: string): Promise<number> {
    return this.userRepository.count({ where: { roleId } });
  }

  async bulkDelete(ids: string[]): Promise<BulkOperationResultDto> {
    const result: BulkOperationResultDto = {
      success: 0,
      failed: 0,
      failedIds: [],
    };

    for (const id of ids) {
      try {
        const user = await this.userRepository.findOne({ where: { id } });
        if (user) {
          await this.userRepository.softRemove(user);
          result.success++;
        } else {
          result.failed++;
          result.failedIds.push(id);
        }
      } catch {
        result.failed++;
        result.failedIds.push(id);
      }
    }

    return result;
  }

  async bulkRestore(ids: string[]): Promise<BulkOperationResultDto> {
    const result: BulkOperationResultDto = {
      success: 0,
      failed: 0,
      failedIds: [],
    };

    for (const id of ids) {
      try {
        const user = await this.userRepository.findOne({
          where: { id },
          withDeleted: true,
        });

        if (user && user.deletedAt) {
          await this.userRepository.restore(id);
          result.success++;
        } else {
          result.failed++;
          result.failedIds.push(id);
        }
      } catch {
        result.failed++;
        result.failedIds.push(id);
      }
    }

    return result;
  }
}
