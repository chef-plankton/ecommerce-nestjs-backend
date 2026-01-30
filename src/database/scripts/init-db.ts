/**
 * Production Database Initialization Script
 *
 * This script:
 * 1. Creates all database tables (synchronize)
 * 2. Seeds default roles
 * 3. Creates super admin user
 *
 * Usage in Docker:
 *   docker exec ecommerce_api node dist/database/scripts/init-db.js
 *
 * With custom admin credentials:
 *   docker exec ecommerce_api node dist/database/scripts/init-db.js --email=admin@example.com --password=Admin@123456
 */

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

// Import all entities
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { Tag } from '../entities/tag.entity';
import { Media } from '../entities/media.entity';
import { UserStatus } from '../../common/enums';

// Password validation regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Parse command line arguments
function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--') && arg.includes('=')) {
      const [key, value] = arg.slice(2).split('=');
      args[key] = value;
    }
  }

  return args;
}

async function initializeDatabase() {
  const args = parseArgs();

  // Default admin credentials
  const adminEmail = args.email || 'admin@admin.com';
  const adminPassword = args.password || 'Admin@123456';
  const adminFirstName = args.firstName || 'Super';
  const adminLastName = args.lastName || 'Admin';

  console.log('\n========================================');
  console.log('   Database Initialization Script');
  console.log('========================================\n');

  // Create data source with synchronize enabled
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'ecommerce_db',
    entities: [User, Role, Permission, Category, Product, ProductVariant, Tag, Media],
    synchronize: true, // This will create tables
    logging: false,
  });

  try {
    // Connect and create tables
    console.log('📦 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected and tables synchronized!\n');

    // Create default roles
    console.log('👥 Creating default roles...');
    const roleRepository = dataSource.getRepository(Role);

    const defaultRoles = [
      {
        name: 'super_admin',
        displayName: 'Super Administrator',
        description: 'Full system access with all permissions',
        isSystem: true,
      },
      {
        name: 'admin',
        displayName: 'Administrator',
        description: 'Administrative access',
        isSystem: true,
      },
      {
        name: 'vendor',
        displayName: 'Vendor',
        description: 'Vendor/Seller access',
        isSystem: true,
      },
      {
        name: 'customer',
        displayName: 'Customer',
        description: 'Regular customer access',
        isSystem: true,
      },
    ];

    let superAdminRole: Role | null = null;

    for (const roleData of defaultRoles) {
      let role = await roleRepository.findOne({ where: { name: roleData.name } });
      if (!role) {
        role = roleRepository.create(roleData);
        await roleRepository.save(role);
        console.log(`   ✅ Created role: ${roleData.displayName}`);
      } else {
        console.log(`   ⏭️  Role exists: ${roleData.displayName}`);
      }
      if (roleData.name === 'super_admin') {
        superAdminRole = role;
      }
    }

    // Create super admin user
    console.log('\n👤 Creating super admin user...');
    const userRepository = dataSource.getRepository(User);

    const existingAdmin = await userRepository.findOne({ where: { email: adminEmail } });

    if (existingAdmin) {
      console.log(`   ⏭️  Admin user already exists: ${adminEmail}`);
    } else {
      // Validate password
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(adminPassword)) {
        console.error('   ❌ Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character (@$!%*?&)');
        console.log('   Using default password: Admin@123456');
      }

      const hashedPassword = await bcrypt.hash(
        passwordRegex.test(adminPassword) ? adminPassword : 'Admin@123456',
        12
      );

      const adminUser = userRepository.create({
        firstName: adminFirstName,
        lastName: adminLastName,
        email: adminEmail,
        password: hashedPassword,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        role: superAdminRole!,
      });

      await userRepository.save(adminUser);
      console.log(`   ✅ Created super admin: ${adminEmail}`);
    }

    console.log('\n========================================');
    console.log('   ✅ Database Initialization Complete!');
    console.log('========================================');
    console.log(`\n   Admin Email: ${adminEmail}`);
    console.log(`   Admin Password: ${passwordRegex.test(adminPassword) ? adminPassword : 'Admin@123456'}`);
    console.log('\n========================================\n');

  } catch (error) {
    console.error('\n❌ Error:', (error as Error).message);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

initializeDatabase();
