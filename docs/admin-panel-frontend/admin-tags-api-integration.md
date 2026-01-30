# Admin Panel Tags API Integration Guide

This document provides API documentation for frontend developers integrating tag management into the admin panel. Tags allow admins to categorize and label products for better organization and filtering.

---

## Table of Contents

1. [Overview](#overview)
2. [Tag Management APIs](#tag-management-apis)
3. [Product-Tag APIs](#product-tag-apis)
4. [Error Handling](#error-handling)
5. [Quick Reference](#quick-reference)
6. [TypeScript Interfaces](#typescript-interfaces)

---

## Overview

The admin panel provides full CRUD operations for managing tags and assigning them to products. All endpoints require authentication and admin/super_admin role.

### Required Headers

All requests must include:

| Header | Value | Description |
|--------|-------|-------------|
| `Authorization` | `Bearer <access_token>` | JWT access token |
| `Content-Type` | `application/json` | For requests with body |

### Required Role

All endpoints require one of the following roles:
- `admin`
- `super_admin`

---

## Tag Management APIs

### List Tags (Paginated)

```http
GET /admin/tags
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page (max: 100) |
| `sortBy` | string | sortOrder | Sort field: `sortOrder`, `name`, `createdAt`, `updatedAt` |
| `sortOrder` | string | DESC | `ASC` or `DESC` |
| `search` | string | - | Search in name, slug, description |
| `isActive` | boolean | - | Filter by active status |
| `includeDeleted` | boolean | - | Include soft-deleted tags |
| `onlyDeleted` | boolean | - | Show only soft-deleted tags |

**Example Request:**

```
GET /admin/tags?page=1&limit=20&isActive=true&sortBy=name&sortOrder=ASC
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Tags retrieved successfully",
  "data": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Summer Sale",
        "slug": "summer-sale",
        "description": "Products on sale for summer season",
        "isActive": true,
        "sortOrder": 1,
        "productCount": 25,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z",
        "deletedAt": null
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "New Arrival",
        "slug": "new-arrival",
        "description": "Recently added products",
        "isActive": true,
        "sortOrder": 2,
        "productCount": 42,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z",
        "deletedAt": null
      }
    ],
    "meta": {
      "total": 25,
      "page": 1,
      "limit": 20,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

---

### Get Simple Tags List (For Dropdowns)

```http
GET /admin/tags/simple
Authorization: Bearer <access_token>
```

Returns a lightweight list suitable for dropdown/select menus. Only returns active tags.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Tags retrieved successfully",
  "data": [
    { "id": "uuid-1", "name": "Summer Sale", "slug": "summer-sale" },
    { "id": "uuid-2", "name": "New Arrival", "slug": "new-arrival" },
    { "id": "uuid-3", "name": "Best Seller", "slug": "best-seller" }
  ]
}
```

---

### Get Tag Statistics

```http
GET /admin/tags/stats
Authorization: Bearer <access_token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "totalTags": 25,
    "activeTags": 20,
    "inactiveTags": 5,
    "tagsWithProducts": 18
  }
}
```

---

### Get Single Tag

```http
GET /admin/tags/:id
Authorization: Bearer <access_token>
```

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Tag ID |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Tag retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Summer Sale",
    "slug": "summer-sale",
    "description": "Products on sale for summer season",
    "isActive": true,
    "sortOrder": 1,
    "productCount": 25,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "deletedAt": null
  }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Tag not found"
}
```

---

### Create Tag

```http
POST /admin/tags
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | string | Yes | 2-100 characters, unique |
| `slug` | string | Yes | 2-100 characters, unique, lowercase with hyphens only |
| `description` | string | No | Text description |
| `isActive` | boolean | No | Default: `true` |
| `sortOrder` | number | No | Default: `0`, minimum: `0` |

**Slug Format:**
- Must be lowercase letters and numbers only
- Words separated by hyphens
- Examples: `summer-sale`, `new-arrival`, `best-seller-2024`

**Example Request:**

```json
{
  "name": "Summer Sale",
  "slug": "summer-sale",
  "description": "Products on sale for summer season",
  "isActive": true,
  "sortOrder": 1
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Tag created successfully",
  "data": {
    "id": "new-tag-uuid",
    "name": "Summer Sale",
    "slug": "summer-sale",
    "description": "Products on sale for summer season",
    "isActive": true,
    "sortOrder": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (409 - Duplicate Name):**

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Tag with this name already exists"
}
```

**Error Response (409 - Duplicate Slug):**

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Tag with this slug already exists"
}
```

**Error Response (400 - Invalid Slug Format):**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "Slug must be lowercase with hyphens only (e.g., summer-sale)"
  ]
}
```

---

### Update Tag

```http
PATCH /admin/tags/:id
Authorization: Bearer <access_token>
Content-Type: application/json
```

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Tag ID |

**Request Body (all fields optional):**

```json
{
  "name": "Summer Sale 2024",
  "slug": "summer-sale-2024",
  "description": "Updated description for summer sale",
  "isActive": true,
  "sortOrder": 2
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Tag updated successfully",
  "data": {
    "id": "tag-uuid",
    "name": "Summer Sale 2024",
    "slug": "summer-sale-2024",
    "description": "Updated description for summer sale",
    "isActive": true,
    "sortOrder": 2,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-16T14:20:00.000Z"
  }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Tag not found"
}
```

**Error Response (409 - Duplicate Name/Slug):**

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Tag with this name already exists"
}
```

---

### Delete Tag (Soft Delete)

```http
DELETE /admin/tags/:id
Authorization: Bearer <access_token>
```

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Tag ID |

> **Note:** This is a soft delete. The tag can be restored later.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Tag deleted successfully",
  "data": null
}
```

**Error Response (404):**

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Tag not found"
}
```

---

### Restore Deleted Tag

```http
PATCH /admin/tags/:id/restore
Authorization: Bearer <access_token>
```

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Tag ID |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Tag restored successfully",
  "data": {
    "id": "tag-uuid",
    "name": "Summer Sale",
    "slug": "summer-sale",
    "description": "Products on sale for summer season",
    "isActive": true,
    "sortOrder": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-16T14:20:00.000Z"
  }
}
```

**Error Response (400 - Not Deleted):**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Tag is not deleted"
}
```

---

### Bulk Delete Tags

```http
POST /admin/tags/bulk/delete
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

**Partial Success Response (200):**

```json
{
  "success": true,
  "message": "Bulk delete completed",
  "data": {
    "success": 2,
    "failed": 1,
    "failedIds": ["uuid-3"]
  }
}
```

---

### Bulk Restore Tags

```http
POST /admin/tags/bulk/restore
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

## Product-Tag APIs

Manage the relationship between products and tags.

### Get Product Tags

```http
GET /admin/tags/product/:productId
Authorization: Bearer <access_token>
```

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `productId` | UUID | Product ID |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Product tags retrieved successfully",
  "data": [
    { "id": "uuid-1", "name": "Summer Sale", "slug": "summer-sale" },
    { "id": "uuid-2", "name": "New Arrival", "slug": "new-arrival" }
  ]
}
```

**Error Response (404):**

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Product not found"
}
```

---

### Assign Tags to Product

```http
PATCH /admin/tags/product/:productId/assign
Authorization: Bearer <access_token>
Content-Type: application/json
```

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `productId` | UUID | Product ID |

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `tagIds` | string[] | Yes | Array of tag UUIDs, max 50 items |

> **Important:** This replaces all existing tags on the product with the provided tags.

**Example Request:**

```json
{
  "tagIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Tags assigned successfully",
  "data": null
}
```

**Error Response (404 - Product Not Found):**

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Product not found"
}
```

**Error Response (400 - Invalid Tags):**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Some tags were not found or are inactive"
}
```

---

### Remove Tags from Product

```http
PATCH /admin/tags/product/:productId/remove
Authorization: Bearer <access_token>
Content-Type: application/json
```

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `productId` | UUID | Product ID |

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `tagIds` | string[] | Yes | Array of tag UUIDs to remove |

**Example Request:**

```json
{
  "tagIds": ["uuid-1", "uuid-2"]
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Tags removed successfully",
  "data": null
}
```

**Error Response (404):**

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Product not found"
}
```

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
  "path": "/api/v1/admin/tags"
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
| 409 | Conflict | Duplicate entry (name, slug) | Show conflict message |
| 429 | Too Many Requests | Rate limit exceeded | Implement backoff/retry |
| 500 | Internal Server Error | Server error | Show generic error message |

### Validation Error Example

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "name must be longer than or equal to 2 characters",
    "slug must be lowercase with hyphens only (e.g., summer-sale)",
    "sortOrder must be a non-negative integer"
  ],
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/v1/admin/tags"
}
```

---

## Quick Reference

### Tag Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/tags` | List tags (paginated) |
| GET | `/admin/tags/simple` | Simple list for dropdowns |
| GET | `/admin/tags/stats` | Get tag statistics |
| POST | `/admin/tags/bulk/delete` | Bulk delete tags |
| POST | `/admin/tags/bulk/restore` | Bulk restore tags |
| GET | `/admin/tags/:id` | Get single tag |
| POST | `/admin/tags` | Create tag |
| PATCH | `/admin/tags/:id` | Update tag |
| DELETE | `/admin/tags/:id` | Delete tag (soft) |
| PATCH | `/admin/tags/:id/restore` | Restore tag |

### Product-Tag Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/tags/product/:productId` | Get product's tags |
| PATCH | `/admin/tags/product/:productId/assign` | Assign tags to product |
| PATCH | `/admin/tags/product/:productId/remove` | Remove tags from product |

---

## TypeScript Interfaces

For frontend TypeScript projects, here are the recommended interfaces:

```typescript
// Tag
interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

interface SimpleTag {
  id: string;
  name: string;
  slug: string;
}

// Tag Statistics
interface TagStats {
  totalTags: number;
  activeTags: number;
  inactiveTags: number;
  tagsWithProducts: number;
}

// API Response Types
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

interface BulkOperationResult {
  success: number;
  failed: number;
  failedIds: string[];
}

// Create/Update DTOs
interface CreateTagDto {
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

interface UpdateTagDto {
  name?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

interface AssignTagsDto {
  tagIds: string[];
}

// Query Parameters
interface QueryTagParams {
  page?: number;
  limit?: number;
  sortBy?: 'sortOrder' | 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
}
```

### Example API Service (TypeScript)

```typescript
import axios from 'axios';

const API_BASE = '/api/v1';

class TagsApiService {
  private getHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // List tags with pagination
  async getTags(params: QueryTagParams): Promise<ApiResponse<PaginatedResponse<Tag>>> {
    const response = await axios.get(`${API_BASE}/admin/tags`, {
      headers: this.getHeaders(),
      params,
    });
    return response.data;
  }

  // Get simple tags for dropdowns
  async getSimpleTags(): Promise<ApiResponse<SimpleTag[]>> {
    const response = await axios.get(`${API_BASE}/admin/tags/simple`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // Get tag statistics
  async getStats(): Promise<ApiResponse<TagStats>> {
    const response = await axios.get(`${API_BASE}/admin/tags/stats`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // Get single tag
  async getTag(id: string): Promise<ApiResponse<Tag>> {
    const response = await axios.get(`${API_BASE}/admin/tags/${id}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // Create tag
  async createTag(data: CreateTagDto): Promise<ApiResponse<Tag>> {
    const response = await axios.post(`${API_BASE}/admin/tags`, data, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // Update tag
  async updateTag(id: string, data: UpdateTagDto): Promise<ApiResponse<Tag>> {
    const response = await axios.patch(`${API_BASE}/admin/tags/${id}`, data, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // Delete tag
  async deleteTag(id: string): Promise<ApiResponse<null>> {
    const response = await axios.delete(`${API_BASE}/admin/tags/${id}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // Restore tag
  async restoreTag(id: string): Promise<ApiResponse<Tag>> {
    const response = await axios.patch(`${API_BASE}/admin/tags/${id}/restore`, {}, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // Bulk delete
  async bulkDelete(ids: string[]): Promise<ApiResponse<BulkOperationResult>> {
    const response = await axios.post(`${API_BASE}/admin/tags/bulk/delete`, { ids }, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // Bulk restore
  async bulkRestore(ids: string[]): Promise<ApiResponse<BulkOperationResult>> {
    const response = await axios.post(`${API_BASE}/admin/tags/bulk/restore`, { ids }, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // Get product tags
  async getProductTags(productId: string): Promise<ApiResponse<SimpleTag[]>> {
    const response = await axios.get(`${API_BASE}/admin/tags/product/${productId}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // Assign tags to product
  async assignTagsToProduct(productId: string, tagIds: string[]): Promise<ApiResponse<null>> {
    const response = await axios.patch(
      `${API_BASE}/admin/tags/product/${productId}/assign`,
      { tagIds },
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  // Remove tags from product
  async removeTagsFromProduct(productId: string, tagIds: string[]): Promise<ApiResponse<null>> {
    const response = await axios.patch(
      `${API_BASE}/admin/tags/product/${productId}/remove`,
      { tagIds },
      { headers: this.getHeaders() }
    );
    return response.data;
  }
}

export const tagsApi = new TagsApiService();
```
