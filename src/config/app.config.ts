import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api',
  apiVersion: process.env.API_VERSION || 'v1',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  defaultLocale: process.env.DEFAULT_LOCALE || 'fa',
  defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Asia/Tehran',
}));
