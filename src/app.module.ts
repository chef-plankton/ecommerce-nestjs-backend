import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { appConfig, databaseConfig, jwtConfig, throttleConfig } from './config';
import { DatabaseModule } from './database/database.module';
import { SharedModule } from './shared/shared.module';
import { AllExceptionsFilter } from './common/filters';
import { TransformInterceptor, LoggingInterceptor } from './common/interceptors';
import { UsersModule } from './modules/users';
import { RolesModule } from './modules/roles';
import { AuthModule } from './modules/auth';
import { UploadModule } from './modules/upload';
import { CategoriesModule } from './modules/categories';
import { ProductsModule } from './modules/products';
import { MediaModule } from './modules/media';
import { TagsModule } from './modules/tags';
import { JwtAuthGuard } from './modules/auth/guards';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, throttleConfig],
      envFilePath: ['.env'],
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('throttle.ttl') ?? 60000,
            limit: configService.get<number>('throttle.limit') ?? 100,
          },
        ],
      }),
    }),

    // Database
    DatabaseModule,

    // Shared Module (Caching, etc.)
    SharedModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    RolesModule,
    UploadModule,
    CategoriesModule,
    ProductsModule,
    MediaModule,
    TagsModule,
    // OrdersModule,
    // CartModule,
    // PaymentsModule,
    // ReviewsModule,
    // CouponsModule,
    // ShippingModule,
    // NotificationsModule,
    // MediaModule,
    // SettingsModule,
  ],
  controllers: [],
  providers: [
    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Global Transform Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // Global Logging Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Global Throttler Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global JWT Auth Guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
