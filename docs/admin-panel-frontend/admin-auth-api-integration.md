# Admin Panel Authentication API Integration Guide

This document provides API documentation for frontend developers integrating authentication and authorization into the admin panel.

---

## Table of Contents

1. [Overview](#overview)
2. [Base Configuration](#base-configuration)
3. [Authentication](#authentication)
4. [Authorization & Roles](#authorization--roles)
5. [User Management APIs](#user-management-apis)
6. [File Upload APIs](#file-upload-apis)
7. [Role Management APIs](#role-management-apis)
8. [Permission Management APIs](#permission-management-apis)
9. [Error Handling](#error-handling)
10. [API Response Format](#api-response-format)

---

## Overview

The admin panel uses JWT (JSON Web Token) based authentication. All admin endpoints require a valid JWT token and appropriate role permissions.

### Authentication Flow

```
1. Admin submits credentials (email + password)
2. Server validates and returns JWT access token + refresh token
3. Frontend stores tokens securely
4. All subsequent requests include the access token in Authorization header
5. When access token expires, use refresh token to obtain new access token
6. On logout, clear stored tokens
```

### Required Role

All admin endpoints require one of the following roles:
- `admin`
- `super_admin`

---

## Base Configuration

### Base URL

```
/api/v1
```

### Required Headers

All authenticated requests must include:

| Header | Value | Description |
|--------|-------|-------------|
| `Authorization` | `Bearer <access_token>` | JWT access token |
| `Content-Type` | `application/json` | For requests with body |

### JWT Token Configuration

| Token Type | Expiration | Usage |
|------------|------------|-------|
| Access Token | 7 days | API requests |
| Refresh Token | 30 days | Obtain new access token |

---

## Authentication

### Login

```http
POST /auth/login
Content-Type: application/json
```

**Request Body:**

```json
{
  "email": "admin@example.com",
  "password": "SecureP@ss123"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com",
      "role": "admin",
      "permissions": ["users.create", "users.read", "users.update", "users.delete"]
    }
  }
}
```

**Error Response (401):**

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

---

### Refresh Token

```http
POST /auth/refresh
Content-Type: application/json
```

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### Logout

```http
POST /auth/logout
Authorization: Bearer <access_token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Get Current User Profile

```http
GET /auth/me
Authorization: Bearer <access_token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "uuid",
    "firstName": "Admin",
    "lastName": "User",
    "fullName": "Admin User",
    "email": "admin@example.com",
    "phone": "+989123456789",
    "avatar": "https://...",
    "status": "active",
    "emailVerified": true,
    "phoneVerified": false,
    "lastLoginAt": "2024-01-20T08:00:00.000Z",
    "roleId": "role-uuid",
    "role": {
      "id": "role-uuid",
      "name": "admin",
      "displayName": "Administrator"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T08:00:00.000Z"
  }
}
```

---

## Authorization & Roles

### User Roles

| Role | Name | Description |
|------|------|-------------|
| `customer` | Customer | Regular customer with no admin access |
| `vendor` | Vendor | Product vendor |
| `admin` | Administrator | Admin panel access |
| `super_admin` | Super Administrator | Full system access |

### User Status Values

| Status | Description |
|--------|-------------|
| `active` | User can access the system |
| `inactive` | User account is disabled |
| `suspended` | User is temporarily suspended |
| `pending_verification` | Awaiting email/phone verification |

### Permission Structure

Permissions follow the pattern: `{module}.{action}`

**Standard Actions:**
- `create` - Create new records
- `read` - View records
- `update` - Modify records
- `delete` - Delete records

**Example Permissions:**
- `users.create`, `users.read`, `users.update`, `users.delete`
- `products.create`, `products.read`, `products.update`, `products.delete`
- `orders.read`, `orders.update`
- `settings.read`, `settings.update`

---

## User Management APIs

All user management endpoints require `admin` or `super_admin` role.

### List Users (Paginated)

```http
GET /admin/users
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page (max: 100) |
| `sortBy` | string | createdAt | Sort field: `firstName`, `lastName`, `email`, `createdAt` |
| `sortOrder` | string | DESC | `ASC` or `DESC` |
| `search` | string | - | Search in firstName, lastName, email, phone |
| `status` | string | - | Filter: `active`, `inactive`, `suspended`, `pending_verification` |
| `roleId` | string | - | Filter by role UUID |
| `gender` | string | - | Filter: `male`, `female`, `other` |
| `emailVerified` | boolean | - | Filter: `true` or `false` |
| `phoneVerified` | boolean | - | Filter: `true` or `false` |
| `createdAfter` | string | - | ISO date (e.g., `2024-01-15`) |
| `createdBefore` | string | - | ISO date |
| `includeDeleted` | boolean | - | Include soft-deleted users in results |
| `onlyDeleted` | boolean | - | Show only soft-deleted users |

**Example Request:**

```
GET /admin/users?page=1&limit=20&search=john&status=active&sortBy=createdAt&sortOrder=DESC
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "firstName": "John",
        "lastName": "Doe",
        "fullName": "John Doe",
        "email": "john@example.com",
        "phone": "+989123456789",
        "avatar": null,
        "status": "active",
        "emailVerified": true,
        "phoneVerified": false,
        "role": {
          "id": "role-uuid",
          "name": "customer",
          "displayName": "Customer"
        },
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z",
        "deletedAt": null
      }
    ],
    "meta": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

---

### Get User Statistics

```http
GET /admin/users/stats
Authorization: Bearer <access_token>
```

**Success Response (200):**

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

### Get Single User

```http
GET /admin/users/:id
Authorization: Bearer <access_token>
```

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | User ID |

**Success Response (200):**

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+989123456789",
    "avatar": "https://example.com/avatar.jpg",
    "birthDate": "1990-01-15",
    "gender": "male",
    "status": "active",
    "emailVerified": true,
    "emailVerifiedAt": "2024-01-15T12:00:00.000Z",
    "phoneVerified": false,
    "phoneVerifiedAt": null,
    "lastLoginAt": "2024-01-20T08:00:00.000Z",
    "roleId": "role-uuid",
    "role": {
      "id": "role-uuid",
      "name": "customer",
      "displayName": "Customer"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T08:00:00.000Z"
  }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "statusCode": 404,
  "message": "User not found"
}
```

---

### Create User

```http
POST /admin/users
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `firstName` | string | Yes | 2-100 characters |
| `lastName` | string | Yes | 2-100 characters |
| `email` | string | Yes | Valid email, unique |
| `password` | string | Yes | 8-100 chars, must contain uppercase, lowercase, number, special char |
| `phone` | string | No | International format (e.g., `+989123456789`) |
| `birthDate` | string | No | ISO date (e.g., `1990-01-15`) |
| `gender` | string | No | `male`, `female`, or `other` |
| `roleId` | UUID | Yes | Valid role UUID |
| `status` | string | No | `active`, `inactive`, `suspended`, `pending_verification` |
| `avatar` | string | No | Valid URL |

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (@$!%*?&)

**Example Request:**

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "password": "SecureP@ss123",
  "phone": "+989123456789",
  "birthDate": "1992-05-20",
  "gender": "female",
  "roleId": "550e8400-e29b-41d4-a716-446655440001",
  "status": "active"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "new-user-uuid",
    "firstName": "Jane",
    "lastName": "Smith",
    "fullName": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+989123456789",
    "birthDate": "1992-05-20",
    "gender": "female",
    "status": "active",
    "emailVerified": false,
    "phoneVerified": false,
    "roleId": "550e8400-e29b-41d4-a716-446655440001",
    "role": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "customer",
      "displayName": "Customer"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (409 - Duplicate):**

```json
{
  "success": false,
  "statusCode": 409,
  "message": "User with this email already exists"
}
```

---

### Update User

```http
PATCH /admin/users/:id
Authorization: Bearer <access_token>
Content-Type: application/json
```

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | User ID |

**Request Body (all fields optional):**

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.new@example.com",
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

> **Important:** Changing `email` or `phone` will automatically reset their respective verification status to `false`.

**Success Response (200):**

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "user-uuid",
    "firstName": "Jane",
    "lastName": "Doe",
    "...": "..."
  }
}
```

---

### Change User Password

```http
PATCH /admin/users/:id/password
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "newPassword": "NewSecureP@ss123"
}
```

> **Note:** Admin does not need to provide current password when changing a user's password.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": null
}
```

---

### Verify User Email (Manual)

```http
PATCH /admin/users/:id/verify-email
Authorization: Bearer <access_token>
```

Manually sets `emailVerified` to `true`.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": null
}
```

---

### Verify User Phone (Manual)

```http
PATCH /admin/users/:id/verify-phone
Authorization: Bearer <access_token>
```

Manually sets `phoneVerified` to `true`.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Phone verified successfully",
  "data": null
}
```

---

### Delete User (Soft Delete)

```http
DELETE /admin/users/:id
Authorization: Bearer <access_token>
```

Performs a soft delete (sets `deletedAt` timestamp). User data is preserved.

**Success Response (200):**

```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": null
}
```

---

### Restore Deleted User

```http
PATCH /admin/users/:id/restore
Authorization: Bearer <access_token>
```

Restores a soft-deleted user.

**Success Response (200):**

```json
{
  "success": true,
  "message": "User restored successfully",
  "data": {
    "id": "user-uuid",
    "firstName": "John",
    "...": "..."
  }
}
```

---

### Bulk Delete Users

```http
POST /admin/users/bulk/delete
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

> **Note:** Maximum 100 IDs per request.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Bulk delete completed",
  "data": {
    "success": 3,
    "failed": 0,
    "failedIds": []
  }
}
```

---

### Bulk Restore Users

```http
POST /admin/users/bulk/restore
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Bulk restore completed",
  "data": {
    "success": 2,
    "failed": 1,
    "failedIds": ["uuid-3"]
  }
}
```

---

## File Upload APIs

All upload endpoints require authentication.

### Upload Avatar

```http
POST /upload/avatar
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | Image file (JPEG, PNG, GIF, WebP) |

**Limits:**
- Max file size: 5MB
- Allowed types: JPEG, PNG, GIF, WebP

**Success Response (201):**

```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "originalName": "profile.jpg",
    "filename": "550e8400-e29b-41d4-a716-446655440000.jpg",
    "path": "avatars/550e8400-e29b-41d4-a716-446655440000.jpg",
    "url": "/uploads/avatars/550e8400-e29b-41d4-a716-446655440000.jpg",
    "size": 102400,
    "mimeType": "image/jpeg"
  }
}
```

---

### Upload Product Image

```http
POST /upload/product
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

Same format as avatar upload. Files stored in `products/` directory.

---

### Upload General File

```http
POST /upload/general
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

Same format as avatar upload. Files stored in `general/` directory.

---

### Delete Uploaded File

```http
DELETE /upload/:category/:filename
Authorization: Bearer <access_token>
```

**URL Parameters:**

| Parameter | Description |
|-----------|-------------|
| `category` | `avatars`, `products`, or `general` |
| `filename` | The filename returned from upload |

**Success Response (200):**

```json
{
  "success": true,
  "message": "File deleted successfully",
  "data": null
}
```

---

## Role Management APIs

### List Roles (Paginated)

```http
GET /admin/roles
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `sortBy` | string | createdAt | Sort field |
| `sortOrder` | string | DESC | `ASC` or `DESC` |
| `search` | string | - | Search in name, displayName, description |
| `isActive` | boolean | - | Filter by active status |
| `isSystem` | boolean | - | Filter system roles |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Roles retrieved successfully",
  "data": {
    "data": [
      {
        "id": "role-uuid",
        "name": "admin",
        "displayName": "Administrator",
        "description": "Full admin access",
        "isActive": true,
        "isSystem": true,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "meta": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

---

### Get Simple Roles List (For Dropdowns)

```http
GET /admin/roles/simple
Authorization: Bearer <access_token>
```

Returns a lightweight list suitable for dropdown/select menus.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Roles retrieved successfully",
  "data": [
    { "id": "uuid-1", "name": "admin", "displayName": "Administrator" },
    { "id": "uuid-2", "name": "customer", "displayName": "Customer" },
    { "id": "uuid-3", "name": "vendor", "displayName": "Vendor" },
    { "id": "uuid-4", "name": "super_admin", "displayName": "Super Administrator" }
  ]
}
```

---

### Get Role Statistics

```http
GET /admin/roles/stats
Authorization: Bearer <access_token>
```

**Success Response (200):**

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

### Get Single Role

```http
GET /admin/roles/:id
Authorization: Bearer <access_token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Role retrieved successfully",
  "data": {
    "id": "role-uuid",
    "name": "editor",
    "displayName": "Editor",
    "description": "Can edit and publish content",
    "isActive": true,
    "isSystem": false,
    "permissions": [
      {
        "id": "perm-uuid-1",
        "name": "products.read",
        "displayName": "View Products",
        "module": "products",
        "action": "read"
      },
      {
        "id": "perm-uuid-2",
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

### Create Role

```http
POST /admin/roles
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | Yes | 2-50 chars, unique, slug format |
| `displayName` | string | No | Up to 100 chars |
| `description` | string | No | Text description |
| `isActive` | boolean | No | Default: `true` |
| `permissionIds` | UUID[] | No | Array of permission UUIDs |

**Example Request:**

```json
{
  "name": "content-manager",
  "displayName": "Content Manager",
  "description": "Can manage products and categories",
  "isActive": true,
  "permissionIds": [
    "perm-uuid-1",
    "perm-uuid-2",
    "perm-uuid-3"
  ]
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Role created successfully",
  "data": {
    "id": "new-role-uuid",
    "name": "content-manager",
    "displayName": "Content Manager",
    "...": "..."
  }
}
```

---

### Update Role

```http
PATCH /admin/roles/:id
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body (all fields optional):**

```json
{
  "name": "senior-editor",
  "displayName": "Senior Editor",
  "description": "Can edit, publish, and delete content",
  "isActive": true,
  "permissionIds": ["perm-1", "perm-2", "perm-3", "perm-4"]
}
```

> **Note:** System roles (`isSystem: true`) cannot be modified. Attempting to update a system role returns a 403 error.

---

### Assign Permissions to Role

```http
PATCH /admin/roles/:id/permissions
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "permissionIds": ["perm-uuid-1", "perm-uuid-2", "perm-uuid-3"]
}
```

> **Important:** This **replaces** all existing permissions with the provided list. To add permissions, include both existing and new permission IDs.

---

### Delete Role

```http
DELETE /admin/roles/:id
Authorization: Bearer <access_token>
```

> **Note:** System roles cannot be deleted.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Role deleted successfully",
  "data": null
}
```

**Error Response (403 - System Role):**

```json
{
  "success": false,
  "statusCode": 403,
  "message": "Cannot delete system role"
}
```

---

## Permission Management APIs

### List Permissions (Paginated)

```http
GET /admin/permissions
Authorization: Bearer <access_token>
```

Standard pagination parameters apply.

---

### Get Permissions Grouped by Module

```http
GET /admin/permissions/grouped
Authorization: Bearer <access_token>
```

Returns permissions organized by module - useful for building permission selection UI.

**Success Response (200):**

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
      { "id": "uuid-6", "name": "products.read", "displayName": "View Products", "action": "read" },
      { "id": "uuid-7", "name": "products.update", "displayName": "Update Products", "action": "update" },
      { "id": "uuid-8", "name": "products.delete", "displayName": "Delete Products", "action": "delete" }
    ],
    "orders": [
      { "id": "uuid-9", "name": "orders.read", "displayName": "View Orders", "action": "read" },
      { "id": "uuid-10", "name": "orders.update", "displayName": "Update Orders", "action": "update" }
    ],
    "settings": [
      { "id": "uuid-11", "name": "settings.read", "displayName": "View Settings", "action": "read" },
      { "id": "uuid-12", "name": "settings.update", "displayName": "Update Settings", "action": "update" }
    ]
  }
}
```

---

### Get Single Permission

```http
GET /admin/permissions/:id
Authorization: Bearer <access_token>
```

---

### Create Permission

```http
POST /admin/permissions
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "reports.export",
  "displayName": "Export Reports",
  "description": "Allows exporting reports to CSV/Excel",
  "module": "reports",
  "action": "export",
  "isActive": true
}
```

---

### Update Permission

```http
PATCH /admin/permissions/:id
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

### Delete Permission

```http
DELETE /admin/permissions/:id
Authorization: Bearer <access_token>
```

---

### Seed Default Permissions

```http
POST /admin/permissions/seed
Authorization: Bearer <access_token>
```

> **Required Role:** `super_admin` only

Creates default permissions for all modules:

| Module | Actions |
|--------|---------|
| users | create, read, update, delete |
| roles | create, read, update, delete |
| products | create, read, update, delete |
| orders | create, read, update, delete |
| settings | read, update |

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Human-readable error message",
  "errors": ["Detailed error 1", "Detailed error 2"],
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/v1/admin/users"
}
```

### HTTP Status Codes

| Code | Status | Description | Action |
|------|--------|-------------|--------|
| 200 | OK | Request successful | Process response data |
| 201 | Created | Resource created | Process response data |
| 400 | Bad Request | Invalid input/validation failed | Display validation errors |
| 401 | Unauthorized | Missing or invalid token | Redirect to login |
| 403 | Forbidden | Insufficient permissions | Show access denied message |
| 404 | Not Found | Resource doesn't exist | Show not found message |
| 409 | Conflict | Duplicate entry | Show conflict message |
| 429 | Too Many Requests | Rate limit exceeded | Implement backoff/retry |
| 500 | Internal Server Error | Server error | Show generic error message |

### Validation Error Example

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "email must be an email",
    "password must contain at least one uppercase, one lowercase, one number and one special character",
    "roleId must be a UUID"
  ],
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/v1/admin/users"
}
```

### Authentication Error Example

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Token expired",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/v1/admin/users"
}
```

---

## API Response Format

### Success Response Structure

All successful responses follow this format:

```json
{
  "success": true,
  "message": "Operation description",
  "data": { }
}
```

### Paginated Response Structure

```json
{
  "success": true,
  "message": "Items retrieved successfully",
  "data": {
    "data": [ ],
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

## Rate Limiting

The API implements rate limiting:

- **Limit:** 100 requests per 60 seconds per IP
- **Response when exceeded:** 429 Too Many Requests

```json
{
  "success": false,
  "statusCode": 429,
  "message": "Too many requests, please try again later"
}
```

---

## Quick Reference

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | List users (paginated) |
| GET | `/admin/users/stats` | Get user statistics |
| GET | `/admin/users/:id` | Get single user |
| POST | `/admin/users` | Create user |
| PATCH | `/admin/users/:id` | Update user |
| PATCH | `/admin/users/:id/password` | Change password |
| PATCH | `/admin/users/:id/verify-email` | Verify email |
| PATCH | `/admin/users/:id/verify-phone` | Verify phone |
| DELETE | `/admin/users/:id` | Delete user (soft) |
| PATCH | `/admin/users/:id/restore` | Restore user |
| POST | `/admin/users/bulk/delete` | Bulk delete users |
| POST | `/admin/users/bulk/restore` | Bulk restore users |

### Upload Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload/avatar` | Upload avatar image |
| POST | `/upload/product` | Upload product image |
| POST | `/upload/general` | Upload general file |
| DELETE | `/upload/:category/:filename` | Delete uploaded file |

### Role Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/roles` | List roles (paginated) |
| GET | `/admin/roles/simple` | Simple list for dropdowns |
| GET | `/admin/roles/stats` | Get role statistics |
| GET | `/admin/roles/:id` | Get single role |
| POST | `/admin/roles` | Create role |
| PATCH | `/admin/roles/:id` | Update role |
| PATCH | `/admin/roles/:id/permissions` | Assign permissions |
| DELETE | `/admin/roles/:id` | Delete role |

### Permission Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/permissions` | List permissions |
| GET | `/admin/permissions/grouped` | Permissions by module |
| GET | `/admin/permissions/:id` | Get single permission |
| POST | `/admin/permissions` | Create permission |
| PATCH | `/admin/permissions/:id` | Update permission |
| DELETE | `/admin/permissions/:id` | Delete permission |
| POST | `/admin/permissions/seed` | Seed defaults (super_admin) |
