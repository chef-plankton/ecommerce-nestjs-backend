# Admin Users & Roles API Documentation

## Overview

This document provides comprehensive documentation for the Admin Users and Roles API module. This module handles user management, role-based access control (RBAC), and permission management for the admin panel.

## Table of Contents

1. [Architecture](#architecture)
2. [Database Schema](#database-schema)
3. [Authentication & Authorization](#authentication--authorization)
4. [API Endpoints](#api-endpoints)
   - [Users API](#users-api)
   - [Roles API](#roles-api)
   - [Permissions API](#permissions-api)
5. [Data Transfer Objects (DTOs)](#data-transfer-objects-dtos)
6. [Error Handling](#error-handling)
7. [Usage Examples](#usage-examples)

---

## Architecture

### Module Structure

```
src/modules/
├── users/
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   ├── update-user.dto.ts
│   │   ├── query-user.dto.ts
│   │   ├── user-response.dto.ts
│   │   └── index.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.module.ts
│   └── index.ts
│
├── roles/
│   ├── dto/
│   │   ├── create-role.dto.ts
│   │   ├── update-role.dto.ts
│   │   ├── query-role.dto.ts
│   │   ├── role-response.dto.ts
│   │   ├── create-permission.dto.ts
│   │   └── index.ts
│   ├── roles.controller.ts
│   ├── roles.service.ts
│   ├── permissions.service.ts
│   ├── roles.module.ts
│   └── index.ts
```

### Design Patterns

- **Repository Pattern**: TypeORM repositories for data access
- **DTO Pattern**: Separate DTOs for input validation and response transformation
- **Service Layer**: Business logic encapsulated in services
- **Guard Pattern**: Role-based access control via NestJS guards

---

## Database Schema

### Users Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, Auto-generated | Unique identifier |
| firstName | VARCHAR(100) | NOT NULL | User's first name |
| lastName | VARCHAR(100) | NOT NULL | User's last name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email address |
| password | VARCHAR | NOT NULL, SELECT: false | Bcrypt hashed password |
| phone | VARCHAR(20) | UNIQUE, NULLABLE | Phone number |
| avatar | TEXT | NULLABLE | Avatar URL |
| birthDate | DATE | NULLABLE | Date of birth |
| gender | ENUM | NULLABLE | male, female, other |
| status | ENUM | DEFAULT: pending_verification | active, inactive, suspended, pending_verification |
| emailVerified | BOOLEAN | DEFAULT: false | Email verification status |
| emailVerifiedAt | TIMESTAMP | NULLABLE | Email verification timestamp |
| phoneVerified | BOOLEAN | DEFAULT: false | Phone verification status |
| phoneVerifiedAt | TIMESTAMP | NULLABLE | Phone verification timestamp |
| lastLoginAt | TIMESTAMP | NULLABLE | Last login timestamp |
| lastLoginIp | VARCHAR(45) | NULLABLE | Last login IP address |
| roleId | UUID | FK -> roles.id | Assigned role |
| metadata | JSONB | NULLABLE | Additional metadata |
| createdAt | TIMESTAMP | Auto-generated | Creation timestamp |
| updatedAt | TIMESTAMP | Auto-updated | Last update timestamp |
| deletedAt | TIMESTAMP | NULLABLE | Soft delete timestamp |

### Roles Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, Auto-generated | Unique identifier |
| name | VARCHAR(50) | UNIQUE, NOT NULL | Role slug (e.g., 'admin') |
| displayName | VARCHAR(100) | NULLABLE | Display name (e.g., 'Administrator') |
| description | TEXT | NULLABLE | Role description |
| isActive | BOOLEAN | DEFAULT: true | Active status |
| isSystem | BOOLEAN | DEFAULT: false | System role (cannot be modified) |
| createdAt | TIMESTAMP | Auto-generated | Creation timestamp |
| updatedAt | TIMESTAMP | Auto-updated | Last update timestamp |
| deletedAt | TIMESTAMP | NULLABLE | Soft delete timestamp |

### Permissions Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, Auto-generated | Unique identifier |
| name | VARCHAR(100) | UNIQUE, NOT NULL | Permission key (e.g., 'users.create') |
| displayName | VARCHAR(150) | NULLABLE | Display name |
| description | TEXT | NULLABLE | Permission description |
| module | VARCHAR(50) | NOT NULL | Module name (e.g., 'users') |
| action | VARCHAR(50) | NOT NULL | Action name (e.g., 'create') |
| isActive | BOOLEAN | DEFAULT: true | Active status |
| createdAt | TIMESTAMP | Auto-generated | Creation timestamp |
| updatedAt | TIMESTAMP | Auto-updated | Last update timestamp |
| deletedAt | TIMESTAMP | NULLABLE | Soft delete timestamp |

### Role_Permissions (Join Table)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| role_id | UUID | FK -> roles.id | Role reference |
| permission_id | UUID | FK -> permissions.id | Permission reference |

### Entity Relationships

```
User (N) -----> (1) Role
Role (N) <----> (N) Permission
```

---

## Authentication & Authorization

### Required Headers

All admin endpoints require authentication:

```http
Authorization: Bearer <jwt_token>
```

### Role Requirements

All endpoints in this module require one of the following roles:
- `ADMIN`
- `SUPER_ADMIN`

### User Roles Enum

```typescript
enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  VENDOR = 'vendor',
}
```

### User Status Enum

```typescript
enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}
```

---

## API Endpoints

Base URL: `/api/v1`

### Users API

#### Create User

```http
POST /admin/users
```

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecureP@ss123",
  "phone": "+989123456789",
  "birthDate": "1990-01-15",
  "gender": "male",
  "roleId": "uuid-of-role",
  "status": "active",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

**Response (201):**

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+989123456789",
    "avatar": "https://example.com/avatar.jpg",
    "birthDate": "1990-01-15",
    "gender": "male",
    "status": "active",
    "emailVerified": false,
    "phoneVerified": false,
    "roleId": "uuid-of-role",
    "role": {
      "id": "uuid-of-role",
      "name": "customer",
      "displayName": "Customer"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

#### List Users

```http
GET /admin/users
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page (max: 100) |
| sortBy | string | createdAt | Sort field |
| sortOrder | string | DESC | ASC or DESC |
| search | string | - | Search in firstName, lastName, email, phone |
| status | string | - | Filter by status |
| roleId | string | - | Filter by role ID |
| gender | string | - | Filter by gender |
| emailVerified | boolean | - | Filter by email verification |
| phoneVerified | boolean | - | Filter by phone verification |
| createdAfter | string | - | Filter users created after date |
| createdBefore | string | - | Filter users created before date |

**Response (200):**

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "data": [
      {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "status": "active",
        "role": {
          "id": "uuid",
          "name": "customer",
          "displayName": "Customer"
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "meta": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

---

#### Get User by ID

```http
GET /admin/users/:id
```

**Response (200):**

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+989123456789",
    "avatar": "https://example.com/avatar.jpg",
    "birthDate": "1990-01-15",
    "gender": "male",
    "status": "active",
    "emailVerified": true,
    "emailVerifiedAt": "2024-01-15T12:00:00.000Z",
    "phoneVerified": false,
    "lastLoginAt": "2024-01-20T08:00:00.000Z",
    "roleId": "uuid-of-role",
    "role": {
      "id": "uuid-of-role",
      "name": "customer",
      "displayName": "Customer"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T08:00:00.000Z"
  }
}
```

---

#### Update User

```http
PATCH /admin/users/:id
```

**Request Body (all fields optional):**

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.doe@example.com",
  "phone": "+989123456780",
  "birthDate": "1992-05-20",
  "gender": "female",
  "roleId": "new-role-uuid",
  "status": "active",
  "avatar": "https://example.com/new-avatar.jpg",
  "emailVerified": true,
  "phoneVerified": true
}
```

**Note:** Changing email or phone will reset their verification status.

---

#### Change User Password

```http
PATCH /admin/users/:id/password
```

**Request Body:**

```json
{
  "newPassword": "NewSecureP@ss123"
}
```

**Note:** Admin users don't need to provide the current password.

---

#### Verify User Email

```http
PATCH /admin/users/:id/verify-email
```

Manually verify a user's email address.

---

#### Verify User Phone

```http
PATCH /admin/users/:id/verify-phone
```

Manually verify a user's phone number.

---

#### Delete User

```http
DELETE /admin/users/:id
```

Performs a soft delete (sets `deletedAt` timestamp).

---

#### Restore User

```http
PATCH /admin/users/:id/restore
```

Restores a soft-deleted user.

---

#### Get User Statistics

```http
GET /admin/users/stats
```

**Response (200):**

```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "totalUsers": 1500
  }
}
```

---

### Roles API

#### Create Role

```http
POST /admin/roles
```

**Request Body:**

```json
{
  "name": "editor",
  "displayName": "Editor",
  "description": "Can edit and publish content",
  "isActive": true,
  "permissionIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

---

#### List Roles

```http
GET /admin/roles
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |
| sortBy | string | createdAt | Sort field |
| sortOrder | string | DESC | ASC or DESC |
| search | string | - | Search in name, displayName, description |
| isActive | boolean | - | Filter by active status |
| isSystem | boolean | - | Filter system roles |

---

#### Get Simple Roles List

```http
GET /admin/roles/simple
```

Returns a simplified list for dropdown menus.

**Response (200):**

```json
{
  "success": true,
  "message": "Roles retrieved successfully",
  "data": [
    { "id": "uuid-1", "name": "admin", "displayName": "Administrator" },
    { "id": "uuid-2", "name": "customer", "displayName": "Customer" },
    { "id": "uuid-3", "name": "vendor", "displayName": "Vendor" }
  ]
}
```

---

#### Get Role by ID

```http
GET /admin/roles/:id
```

**Response (200):**

```json
{
  "success": true,
  "message": "Role retrieved successfully",
  "data": {
    "id": "uuid",
    "name": "editor",
    "displayName": "Editor",
    "description": "Can edit and publish content",
    "isActive": true,
    "isSystem": false,
    "permissions": [
      {
        "id": "uuid-1",
        "name": "products.read",
        "displayName": "View Products",
        "module": "products",
        "action": "read"
      },
      {
        "id": "uuid-2",
        "name": "products.update",
        "displayName": "Update Products",
        "module": "products",
        "action": "update"
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

#### Update Role

```http
PATCH /admin/roles/:id
```

**Request Body:**

```json
{
  "name": "senior-editor",
  "displayName": "Senior Editor",
  "description": "Can edit, publish, and delete content",
  "isActive": true,
  "permissionIds": ["uuid-1", "uuid-2", "uuid-3", "uuid-4"]
}
```

**Note:** System roles (`isSystem: true`) cannot be modified.

---

#### Assign Permissions to Role

```http
PATCH /admin/roles/:id/permissions
```

**Request Body:**

```json
{
  "permissionIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

**Note:** This replaces all existing permissions with the provided list.

---

#### Delete Role

```http
DELETE /admin/roles/:id
```

**Note:** System roles cannot be deleted.

---

#### Get Role Statistics

```http
GET /admin/roles/stats
```

**Response (200):**

```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "totalRoles": 5,
    "totalPermissions": 20
  }
}
```

---

### Permissions API

#### Create Permission

```http
POST /admin/permissions
```

**Request Body:**

```json
{
  "name": "products.export",
  "displayName": "Export Products",
  "description": "Allows exporting product data to CSV/Excel",
  "module": "products",
  "action": "export",
  "isActive": true
}
```

---

#### List Permissions

```http
GET /admin/permissions
```

Standard pagination parameters apply.

---

#### Get Permissions Grouped by Module

```http
GET /admin/permissions/grouped
```

**Response (200):**

```json
{
  "success": true,
  "message": "Permissions retrieved successfully",
  "data": {
    "users": [
      { "id": "uuid-1", "name": "users.create", "displayName": "Create Users", "action": "create" },
      { "id": "uuid-2", "name": "users.read", "displayName": "View Users", "action": "read" },
      { "id": "uuid-3", "name": "users.update", "displayName": "Update Users", "action": "update" },
      { "id": "uuid-4", "name": "users.delete", "displayName": "Delete Users", "action": "delete" }
    ],
    "products": [
      { "id": "uuid-5", "name": "products.create", "displayName": "Create Products", "action": "create" },
      { "id": "uuid-6", "name": "products.read", "displayName": "View Products", "action": "read" }
    ],
    "orders": [
      { "id": "uuid-7", "name": "orders.read", "displayName": "View Orders", "action": "read" }
    ]
  }
}
```

---

#### Get Permission by ID

```http
GET /admin/permissions/:id
```

---

#### Update Permission

```http
PATCH /admin/permissions/:id
```

---

#### Delete Permission

```http
DELETE /admin/permissions/:id
```

---

#### Seed Default Permissions

```http
POST /admin/permissions/seed
```

**Required Role:** `SUPER_ADMIN` only

Seeds the following default permissions:

| Module | Permissions |
|--------|-------------|
| users | create, read, update, delete |
| roles | create, read, update, delete |
| products | create, read, update, delete |
| orders | create, read, update, delete |
| settings | read, update |

---

## Data Transfer Objects (DTOs)

### CreateUserDto

```typescript
{
  firstName: string;      // Required, 2-100 chars
  lastName: string;       // Required, 2-100 chars
  email: string;          // Required, valid email
  password: string;       // Required, 8-100 chars, strong password
  phone?: string;         // Optional, international format
  birthDate?: string;     // Optional, ISO date string
  gender?: 'male' | 'female' | 'other';
  roleId: string;         // Required, valid UUID
  status?: UserStatus;    // Optional, defaults to ACTIVE
  avatar?: string;        // Optional, URL
}
```

### UpdateUserDto

All fields from CreateUserDto are optional, plus:

```typescript
{
  emailVerified?: boolean;
  phoneVerified?: boolean;
}
```

### QueryUserDto

```typescript
{
  page?: number;          // Default: 1
  limit?: number;         // Default: 10, Max: 100
  sortBy?: string;        // Default: 'createdAt'
  sortOrder?: 'ASC' | 'DESC';  // Default: 'DESC'
  search?: string;
  status?: UserStatus;
  roleId?: string;
  gender?: Gender;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  createdAfter?: string;  // ISO date
  createdBefore?: string; // ISO date
}
```

### CreateRoleDto

```typescript
{
  name: string;           // Required, 2-50 chars, unique
  displayName?: string;   // Optional, 100 chars max
  description?: string;   // Optional
  isActive?: boolean;     // Default: true
  permissionIds?: string[]; // Optional, array of UUIDs
}
```

### CreatePermissionDto

```typescript
{
  name: string;           // Required, 2-100 chars, unique
  displayName?: string;   // Optional, 150 chars max
  description?: string;   // Optional
  module: string;         // Required, 50 chars max
  action: string;         // Required, 50 chars max
  isActive?: boolean;     // Default: true
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "errors": ["Detailed error 1", "Detailed error 2"],
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/v1/admin/users"
}
```

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid input data or validation failure |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate entry (email, phone, name) |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

### Validation Errors

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "email must be an email",
    "password must contain at least one uppercase, one lowercase, one number and one special character",
    "roleId must be a UUID"
  ]
}
```

---

## Usage Examples

### Creating a New Admin User

```bash
curl -X POST http://localhost:3000/api/v1/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@example.com",
    "password": "Admin@123456",
    "roleId": "admin-role-uuid",
    "status": "active"
  }'
```

### Searching Users with Filters

```bash
curl -X GET "http://localhost:3000/api/v1/admin/users?search=john&status=active&emailVerified=true&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

### Creating a Role with Permissions

```bash
curl -X POST http://localhost:3000/api/v1/admin/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "content-manager",
    "displayName": "Content Manager",
    "description": "Can manage products and categories",
    "permissionIds": [
      "products-create-uuid",
      "products-read-uuid",
      "products-update-uuid",
      "categories-read-uuid"
    ]
  }'
```

### Bulk Update Role Permissions

```bash
curl -X PATCH http://localhost:3000/api/v1/admin/roles/<role-id>/permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "permissionIds": [
      "permission-uuid-1",
      "permission-uuid-2",
      "permission-uuid-3"
    ]
  }'
```

---

## Security Considerations

1. **Password Storage**: Passwords are hashed using bcrypt with a cost factor of 12
2. **Soft Deletes**: All delete operations are soft deletes, preserving data integrity
3. **Role Protection**: System roles cannot be modified or deleted
4. **Input Validation**: All inputs are validated and sanitized
5. **Rate Limiting**: Default 100 requests per 60 seconds
6. **SQL Injection**: Protected via TypeORM parameterized queries

---

## Best Practices

1. Always assign the minimum required permissions to roles
2. Use system roles for core functionality
3. Regularly audit user permissions
4. Implement proper session management in the Auth module
5. Log all admin actions for audit trails
6. Use the grouped permissions endpoint for UI permission selectors

---

## Related Documentation

- [Authentication Module](./auth-module.md) (Coming Soon)
- [API Response Standards](./api-standards.md) (Coming Soon)
- [Database Migrations](./migrations.md) (Coming Soon)
