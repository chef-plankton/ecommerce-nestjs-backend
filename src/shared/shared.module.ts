import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';

@Global()
@Module({
  imports: [
    CacheModule.register({
      ttl: 60000, // 60 seconds default
      max: 100, // maximum number of items in cache
    }),
  ],
  exports: [CacheModule],
})
export class SharedModule {}
