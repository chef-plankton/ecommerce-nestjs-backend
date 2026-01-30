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
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  QueryUserDto,
  UserResponseDto,
  ChangePasswordDto,
  BulkOperationDto,
  BulkOperationResultDto,
} from './dto';
import { ApiResponseDto } from '../../common/dtos/api-response.dto';
import { PaginatedResult } from '../../common/interfaces';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums';

@ApiTags('Admin - Users')
@ApiBearerAuth('JWT-auth')
@Controller('admin/users')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Email or phone already exists' })
  async create(@Body() createUserDto: CreateUserDto): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.usersService.create(createUserDto);
    return ApiResponseDto.success(
      UserResponseDto.fromEntity(user),
      'User created successfully',
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
  })
  async findAll(
    @Query() query: QueryUserDto,
  ): Promise<ApiResponseDto<PaginatedResult<UserResponseDto>>> {
    const result = await this.usersService.findAll(query);
    return ApiResponseDto.success(result, 'Users retrieved successfully');
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(): Promise<ApiResponseDto<{ totalUsers: number }>> {
    const totalUsers = await this.usersService.count();
    return ApiResponseDto.success(
      { totalUsers },
      'Statistics retrieved successfully',
    );
  }

  @Post('bulk/delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk delete users (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Bulk delete completed',
    type: BulkOperationResultDto,
  })
  async bulkDelete(
    @Body() bulkOperationDto: BulkOperationDto,
  ): Promise<ApiResponseDto<BulkOperationResultDto>> {
    const result = await this.usersService.bulkDelete(bulkOperationDto.ids);
    return ApiResponseDto.success(result, 'Bulk delete completed');
  }

  @Post('bulk/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk restore deleted users' })
  @ApiResponse({
    status: 200,
    description: 'Bulk restore completed',
    type: BulkOperationResultDto,
  })
  async bulkRestore(
    @Body() bulkOperationDto: BulkOperationDto,
  ): Promise<ApiResponseDto<BulkOperationResultDto>> {
    const result = await this.usersService.bulkRestore(bulkOperationDto.ids);
    return ApiResponseDto.success(result, 'Bulk restore completed');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.usersService.findOne(id);
    return ApiResponseDto.success(
      UserResponseDto.fromEntity(user),
      'User retrieved successfully',
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email or phone already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.usersService.update(id, updateUserDto);
    return ApiResponseDto.success(
      UserResponseDto.fromEntity(user),
      'User updated successfully',
    );
  }

  @Patch(':id/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password (Admin)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async changePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<ApiResponseDto<null>> {
    await this.usersService.changePassword(id, changePasswordDto, true);
    return ApiResponseDto.success(null, 'Password changed successfully');
  }

  @Patch(':id/verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually verify user email' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async verifyEmail(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.usersService.verifyEmail(id);
    return ApiResponseDto.success(null, 'Email verified successfully');
  }

  @Patch(':id/verify-phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually verify user phone' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Phone verified successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async verifyPhone(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.usersService.verifyPhone(id);
    return ApiResponseDto.success(null, 'Phone verified successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a user (soft delete)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<null>> {
    await this.usersService.remove(id);
    return ApiResponseDto.success(null, 'User deleted successfully');
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a deleted user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'User restored successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'User is not deleted' })
  async restore(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.usersService.restore(id);
    return ApiResponseDto.success(
      UserResponseDto.fromEntity(user),
      'User restored successfully',
    );
  }
}
