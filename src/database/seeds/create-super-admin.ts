import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';
import { config } from 'dotenv';

// Load environment variables
config();

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

function questionHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    const stdin = process.stdin;
    const oldRawMode = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let password = '';
    const onData = (char: string) => {
      if (char === '\n' || char === '\r' || char === '\u0004') {
        stdin.setRawMode(oldRawMode);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(password);
      } else if (char === '\u0003') {
        process.exit();
      } else if (char === '\u007F' || char === '\b') {
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else {
        password += char;
        process.stdout.write('*');
      }
    };
    stdin.on('data', onData);
  });
}

async function createSuperAdmin() {
  console.log('\n========================================');
  console.log('   Super Admin User Creation Script');
  console.log('========================================\n');

  try {
    // Connect to database
    console.log('Connecting to database...');
    await dataSource.initialize();
    console.log('Connected successfully!\n');

    // Get user input
    const firstName = await question('First Name: ');
    const lastName = await question('Last Name: ');
    const email = await question('Email: ');
    const phone = (await question('Phone (optional, press Enter to skip): ')) || null;

    let password: string;
    let confirmPassword: string;

    // Simple password input for Windows compatibility
    password = await question('Password (min 8 chars, must include uppercase, lowercase, number, special char): ');
    confirmPassword = await question('Confirm Password: ');

    if (password !== confirmPassword) {
      console.error('\n❌ Passwords do not match!');
      process.exit(1);
    }

    // Validate password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      console.error('\n❌ Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character (@$!%*?&)');
      process.exit(1);
    }

    // Check if email already exists
    const existingUser = await dataSource.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.length > 0) {
      console.error('\n❌ A user with this email already exists!');
      process.exit(1);
    }

    // Create or get super_admin role
    console.log('\nChecking for super_admin role...');

    let roleResult = await dataSource.query(
      'SELECT id FROM roles WHERE name = $1',
      ['super_admin']
    );

    let roleId: string;

    if (roleResult.length === 0) {
      console.log('Creating super_admin role...');
      const newRole = await dataSource.query(
        `INSERT INTO roles (id, name, "displayName", description, "isActive", "isSystem", "createdAt", "updatedAt")
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

    // Also create other default roles if they don't exist
    const defaultRoles = [
      { name: 'admin', displayName: 'Administrator', description: 'Administrative access' },
      { name: 'vendor', displayName: 'Vendor', description: 'Vendor/Seller access' },
      { name: 'customer', displayName: 'Customer', description: 'Regular customer access' },
    ];

    for (const role of defaultRoles) {
      const exists = await dataSource.query('SELECT id FROM roles WHERE name = $1', [role.name]);
      if (exists.length === 0) {
        await dataSource.query(
          `INSERT INTO roles (id, name, "displayName", description, "isActive", "isSystem", "createdAt", "updatedAt")
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
        "emailVerified", "emailVerifiedAt", "phoneVerified", "roleId", "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, 'active',
        true, NOW(), $6, $7, NOW(), NOW()
      )
      RETURNING id, "firstName", "lastName", email`,
      [firstName, lastName, email, hashedPassword, phone, phone ? true : false, roleId]
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
    rl.close();
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

createSuperAdmin();
