/**
 * Non-interactive Super Admin Creation Script
 *
 * Usage:
 *   pnpm seed:admin -- --email=admin@example.com --password=Admin@123456 --firstName=John --lastName=Doe
 *
 * Or with short flags:
 *   pnpm seed:admin -- -e admin@example.com -p Admin@123456 -f John -l Doe
 */

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';

// Load environment variables
config();

// Parse command line arguments
function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  const argv = process.argv.slice(2);

  // Map short flags to long names
  const mapping: Record<string, string> = {
    e: 'email',
    p: 'password',
    f: 'firstName',
    l: 'lastName',
    ph: 'phone',
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    // Skip the "--" separator
    if (arg === '--') continue;

    if (arg.startsWith('--')) {
      // Handle --key=value format
      if (arg.includes('=')) {
        const eqIndex = arg.indexOf('=');
        const key = arg.slice(2, eqIndex);
        const value = arg.slice(eqIndex + 1);
        args[key] = value;
      } else {
        // Handle --key value format
        const key = arg.slice(2);
        const value = argv[++i];
        if (value && !value.startsWith('-')) {
          args[key] = value;
        }
      }
    } else if (arg.startsWith('-') && !arg.startsWith('--')) {
      const key = arg.slice(1);
      const value = argv[++i];
      if (value && !value.startsWith('-')) {
        args[mapping[key] || key] = value;
      }
    }
  }

  return args;
}

// Database configuration
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'ecommerce',
  synchronize: false,
  logging: false,
});

async function createSuperAdmin() {
  const args = parseArgs();

  // Validate required arguments
  const required = ['email', 'password', 'firstName', 'lastName'];
  const missing = required.filter((key) => !args[key]);

  if (missing.length > 0) {
    console.error('\n❌ Missing required arguments:', missing.join(', '));
    console.log('\nUsage:');
    console.log('  pnpm seed:admin -- --email=admin@example.com --password=Admin@123456 --firstName=John --lastName=Doe');
    console.log('\nOptions:');
    console.log('  --email, -e       Email address (required)');
    console.log('  --password, -p    Password (required)');
    console.log('  --firstName, -f   First name (required)');
    console.log('  --lastName, -l    Last name (required)');
    console.log('  --phone, -ph      Phone number (optional)');
    process.exit(1);
  }

  const { email, password, firstName, lastName, phone } = args;

  // Validate password
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    console.error('\n❌ Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character (@$!%*?&)');
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('   Super Admin Creation (CLI Mode)');
  console.log('========================================\n');

  try {
    // Connect to database
    console.log('Connecting to database...');
    await dataSource.initialize();
    console.log('Connected successfully!\n');

    // Check if email already exists
    const existingUser = await dataSource.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.length > 0) {
      console.error('❌ A user with this email already exists!');
      process.exit(1);
    }

    // Create or get super_admin role
    console.log('Checking for super_admin role...');

    let roleResult = await dataSource.query(
      'SELECT id FROM roles WHERE name = $1',
      ['super_admin']
    );

    let roleId: string;

    if (roleResult.length === 0) {
      console.log('Creating super_admin role...');
      const newRole = await dataSource.query(
        `INSERT INTO roles (id, name, "displayName", description, "isActive", "isSystem", created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id`,
        ['super_admin', 'Super Administrator', 'Full system access with all permissions', true, true]
      );
      roleId = newRole[0].id;
      console.log('✅ Super admin role created');
    } else {
      roleId = roleResult[0].id;
      console.log('✅ Super admin role found');
    }

    // Create other default roles
    const defaultRoles = [
      { name: 'admin', displayName: 'Administrator', description: 'Administrative access' },
      { name: 'vendor', displayName: 'Vendor', description: 'Vendor/Seller access' },
      { name: 'customer', displayName: 'Customer', description: 'Regular customer access' },
    ];

    for (const role of defaultRoles) {
      const exists = await dataSource.query('SELECT id FROM roles WHERE name = $1', [role.name]);
      if (exists.length === 0) {
        await dataSource.query(
          `INSERT INTO roles (id, name, "displayName", description, "isActive", "isSystem", created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, true, true, NOW(), NOW())`,
          [role.name, role.displayName, role.description]
        );
        console.log(`✅ Created ${role.name} role`);
      }
    }

    // Hash password
    console.log('\nCreating super admin user...');
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await dataSource.query(
      `INSERT INTO users (
        id, "firstName", "lastName", email, password, phone, status,
        "emailVerified", "emailVerifiedAt", "phoneVerified", "roleId", created_at, updated_at
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, 'active',
        true, NOW(), $6, $7, NOW(), NOW()
      )
      RETURNING id, "firstName", "lastName", email`,
      [firstName, lastName, email, hashedPassword, phone || null, phone ? true : false, roleId]
    );

    console.log('\n========================================');
    console.log('   ✅ Super Admin Created Successfully!');
    console.log('========================================');
    console.log(`\n   ID: ${newUser[0].id}`);
    console.log(`   Name: ${newUser[0].firstName} ${newUser[0].lastName}`);
    console.log(`   Email: ${newUser[0].email}`);
    console.log(`   Role: Super Administrator`);
    console.log('\n========================================\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

createSuperAdmin();
