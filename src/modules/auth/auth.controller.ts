import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, AuthResponseDto } from './dto';
import { LocalAuthGuard } from './guards';
import { Public, CurrentUser } from '../../common/decorators';
import { ApiResponseDto } from '../../common/dtos/api-response.dto';
import { User } from '../../database/entities';
import type { RequestUser } from '../../common/interfaces';
import { UserResponseDto } from '../users/dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(@Req() req: Request): Promise<ApiResponseDto<AuthResponseDto>> {
    const user = req.user as User;
    const ip = req.ip || req.socket.remoteAddress;
    const result = await this.authService.login(user, ip);
    return ApiResponseDto.success(result, 'Login successful');
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
  })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<ApiResponseDto<{ accessToken: string }>> {
    const result = await this.authService.refreshToken(refreshTokenDto.refreshToken);
    return ApiResponseDto.success(result, 'Token refreshed successfully');
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getProfile(
    @CurrentUser() currentUser: RequestUser,
  ): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.authService.getProfile(currentUser);
    return ApiResponseDto.success(
      UserResponseDto.fromEntity(user),
      'Profile retrieved successfully',
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout current user' })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async logout(): Promise<ApiResponseDto<null>> {
    // JWT is stateless, so we just return success
    // The frontend should clear the stored tokens
    return ApiResponseDto.success(null, 'Logged out successfully');
  }
}
