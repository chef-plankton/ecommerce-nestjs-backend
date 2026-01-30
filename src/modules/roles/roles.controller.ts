import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { PermissionsService } from './permissions.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  QueryRoleDto,
  RoleResponseDto,
  AssignPermissionsDto,
  CreatePermissionDto,
  UpdatePermissionDto,
  PermissionResponseDto,
} from './dto';
import { ApiResponseDto } from '../../common/dtos/api-response.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { PaginatedResult } from '../../common/interfaces';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums';
import { Permission } from '../../database/entities';

@ApiTags('Admin - Roles')
@ApiBearerAuth('JWT-auth')
@Controller('admin/roles')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Role name already exists' })
  async create(
    @Body() createRoleDto: CreateRoleDto,
  ): Promise<ApiResponseDto<RoleResponseDto>> {
    const role = await this.rolesService.create(createRoleDto);
    return ApiResponseDto.success(
      RoleResponseDto.fromEntity(role),
      'Role created successfully',
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Roles retrieved successfully',
  })
  async findAll(
    @Query() query: QueryRoleDto,
  ): Promise<ApiResponseDto<PaginatedResult<RoleResponseDto>>> {
    const result = await this.rolesService.findAll(query);
    return ApiResponseDto.success(result, 'Roles retrieved successfully');
  }

  @Get('simple')
  @ApiOperation({ summary: 'Get all active roles (simple list for dropdowns)' })
  @ApiResponse({
    status: 200,
    description: 'Roles retrieved successfully',
  })
  async findAllSimple(): Promise<
    ApiResponseDto<{ id: string; name: string; displayName: string }[]>
  > {
    const roles = await this.rolesService.findAllSimple();
    return ApiResponseDto.success(
      roles.map((r) => ({ id: r.id, name: r.name, displayName: r.displayName })),
      'Roles retrieved successfully',
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get role statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(): Promise<
    ApiResponseDto<{ totalRoles: number; totalPermissions: number }>
  > {
    const [totalRoles, totalPermissions] = await Promise.all([
      this.rolesService.count(),
      this.permissionsService.count(),
    ]);
    return ApiResponseDto.success(
      { totalRoles, totalPermissions },
      'Statistics retrieved successfully',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a role by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Role retrieved successfully',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<RoleResponseDto>> {
    const role = await this.rolesService.findOne(id);
    return ApiResponseDto.success(
      RoleResponseDto.fromEntity(role),
      'Role retrieved successfully',
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a role' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'System roles cannot be modified' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 409, description: 'Role name already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<ApiResponseDto<RoleResponseDto>> {
    const role = await this.rolesService.update(id, updateRoleDto);
    return ApiResponseDto.success(
      RoleResponseDto.fromEntity(role),
      'Role updated successfully',
    );
  }

  @Patch(':id/permissions')
  @ApiOperation({ summary: 'Assign permissions to a role' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Permissions assigned successfully',
    type: RoleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'System role permissions cannot be modified',
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async assignPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ): Promise<ApiResponseDto<RoleResponseDto>> {
    const role = await this.rolesService.assignPermissions(
      id,
      assignPermissionsDto,
    );
    return ApiResponseDto.success(
      RoleResponseDto.fromEntity(role),
      'Permissions assigned successfully',
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a role (soft delete)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 400, description: 'System roles cannot be deleted' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.rolesService.remove(id);
    return ApiResponseDto.success(null, 'Role deleted successfully');
  }
}

@ApiTags('Admin - Permissions')
@ApiBearerAuth('JWT-auth')
@Controller('admin/permissions')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({
    status: 201,
    description: 'Permission created successfully',
    type: PermissionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Permission name already exists' })
  async create(
    @Body() createPermissionDto: CreatePermissionDto,
  ): Promise<ApiResponseDto<PermissionResponseDto>> {
    const permission = await this.permissionsService.create(createPermissionDto);
    return ApiResponseDto.success(
      PermissionResponseDto.fromEntity(permission),
      'Permission created successfully',
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all permissions with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Permissions retrieved successfully',
  })
  async findAll(
    @Query() query: PaginationDto,
  ): Promise<ApiResponseDto<PaginatedResult<PermissionResponseDto>>> {
    const result = await this.permissionsService.findAll(query);
    return ApiResponseDto.success(result, 'Permissions retrieved successfully');
  }

  @Get('grouped')
  @ApiOperation({ summary: 'Get all permissions grouped by module' })
  @ApiResponse({
    status: 200,
    description: 'Permissions retrieved successfully',
  })
  async findAllGrouped(): Promise<
    ApiResponseDto<Record<string, Permission[]>>
  > {
    const result = await this.permissionsService.findAllGroupedByModule();
    return ApiResponseDto.success(
      result,
      'Permissions retrieved successfully',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a permission by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Permission retrieved successfully',
    type: PermissionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<PermissionResponseDto>> {
    const permission = await this.permissionsService.findOne(id);
    return ApiResponseDto.success(
      PermissionResponseDto.fromEntity(permission),
      'Permission retrieved successfully',
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a permission' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Permission updated successfully',
    type: PermissionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  @ApiResponse({ status: 409, description: 'Permission name already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ): Promise<ApiResponseDto<PermissionResponseDto>> {
    const permission = await this.permissionsService.update(
      id,
      updatePermissionDto,
    );
    return ApiResponseDto.success(
      PermissionResponseDto.fromEntity(permission),
      'Permission updated successfully',
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a permission (soft delete)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Permission deleted successfully' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.permissionsService.remove(id);
    return ApiResponseDto.success(null, 'Permission deleted successfully');
  }

  @Post('seed')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Seed default permissions (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'Permissions seeded successfully' })
  async seedPermissions(): Promise<ApiResponseDto<null>> {
    await this.permissionsService.seedDefaultPermissions();
    return ApiResponseDto.success(null, 'Permissions seeded successfully');
  }
}
